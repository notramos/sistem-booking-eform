'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { SignatureDialog } from '@/components/ui/signature-dialog'
import { Textarea } from '@/components/ui/textarea'
import { StatusStepper, type StepperStep } from '@/components/detail/StatusStepper'
import { ActivityTimeline, type TimelineItem } from '@/components/detail/ActivityTimeline'
import { DetailFields, type DetailGroup } from '@/components/detail/DetailFields'
import { DocumentPreviewDialog } from '@/components/detail/DocumentPreviewDialog'
import { RoomReallocationCard } from '@/components/booking/RoomReallocationCard'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter,
} from '@/components/ui/dialog'
import {
  Clock, FileText, XCircle, CheckCircle2, ArrowLeft, PenLine, RotateCcw, PlayCircle, Pencil,
  MapPin, CalendarDays, Users, User as UserIcon,
} from 'lucide-react'
import {
  useBooking, useCancelBooking, useSignBooking,
  useApproveBooking, useRejectBooking, useReviseBooking, useStartReview,
} from '@/hooks/useBookings'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils'

const NON_FINAL_STATUSES = ['pending', 'sekretariat_review', 'admin_review', 'revision_sekretariat', 'revision_admin']

const PURPOSE_LABELS: Record<string, string> = {
  ibadah: 'Ibadah & Persekutuan',
  acara_keluarga: 'Acara Keluarga',
  latihan_musik: 'Latihan Musik',
  pembinaan: 'Pembinaan',
  rapat: 'Rapat Pelayanan',
  seminar: 'Seminar & Training',
  publik: 'Acara Publik',
}

const LOG_LABELS: Record<string, string> = {
  created: 'Booking diajukan',
  approved: 'Booking disetujui',
  rejected: 'Booking ditolak',
  cancelled: 'Booking dibatalkan',
  completed: 'Booking selesai',
  updated: 'Booking diperbarui',
}

function bookingSteps(status: string): StepperStep[] {
  if (status === 'cancelled') {
    return [
      { label: 'Diajukan', state: 'done' },
      { label: 'Dibatalkan', state: 'rejected' },
    ]
  }
  if (status === 'rejected') {
    return [
      { label: 'Diajukan', state: 'done' },
      { label: 'Ditinjau', state: 'done' },
      { label: 'Ditolak', state: 'rejected' },
    ]
  }

  const sekretariatDone = !['pending', 'sekretariat_review', 'revision_sekretariat'].includes(status)
  const adminDone = ['approved', 'completed'].includes(status)

  return [
    { label: 'Diajukan', state: 'done' },
    {
      label: 'Sekretariat',
      state: status === 'revision_sekretariat' ? 'revision' : sekretariatDone ? 'done' : 'current',
    },
    {
      label: 'Admin',
      state: status === 'revision_admin' ? 'revision' : adminDone ? 'done' : sekretariatDone ? 'current' : 'todo',
    },
    { label: 'Disetujui', state: adminDone ? 'done' : 'todo' },
    { label: 'Selesai', state: status === 'completed' ? 'done' : 'todo' },
  ]
}

function logIcon(action: string) {
  if (action === 'created') return <FileText className="h-4 w-4" />
  if (['approved', 'confirmed', 'completed'].includes(action)) return <CheckCircle2 className="h-4 w-4" />
  if (['cancelled', 'rejected'].includes(action)) return <XCircle className="h-4 w-4" />
  return <Clock className="h-4 w-4" />
}

function logTone(action: string): TimelineItem['tone'] {
  if (['approved', 'confirmed', 'completed'].includes(action)) return 'success'
  if (['cancelled', 'rejected'].includes(action)) return 'danger'
  if (action === 'created') return 'default'
  return 'muted'
}

function SignatureStatus({ label, signed }: { label: string; signed: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`inline-flex items-center gap-1.5 font-medium ${signed ? 'text-green-600' : 'text-muted-foreground'}`}>
        <span className={`h-2 w-2 rounded-full ${signed ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
        {signed ? 'Sudah' : 'Belum'}
      </span>
    </div>
  )
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: booking, isLoading, isError } = useBooking(id)
  const cancelMutation = useCancelBooking()
  const signMutation = useSignBooking()
  const approveMutation = useApproveBooking()
  const rejectMutation = useRejectBooking()
  const reviseMutation = useReviseBooking()
  const startReviewMutation = useStartReview()
  const { user, hasAnyRole, isAdmin, isSekretariat } = useAuth()
  const isStaff = hasAnyRole(['admin', 'sekretariat'])

  const [showCancel, setShowCancel] = useState(false)
  const [signRole, setSignRole] = useState<'pemohon' | 'petugas' | null>(null)
  const [showApprove, setShowApprove] = useState(false)
  const [approveNotes, setApproveNotes] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRevise, setShowRevise] = useState(false)
  const [reviseReason, setReviseReason] = useState('')

  if (isLoading) {
    return <Spinner size="lg" center label="Memuat detail booking..." />
  }

  if (isError || !booking) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Booking tidak ditemukan</h2>
        <p className="text-sm text-muted-foreground">
          Booking yang Anda cari tidak ada atau sudah dihapus.
        </p>
        <Link href="/my-bookings" className={buttonVariants({ variant: 'outline' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Booking Saya
        </Link>
      </div>
    )
  }

  const handleCancel = async () => {
    await cancelMutation.mutateAsync(booking.id)
    setShowCancel(false)
  }

  const handleSaveSignature = async (dataUrl: string) => {
    if (!signRole) return
    await signMutation.mutateAsync({ id: booking.id, role: signRole, signature: dataUrl })
    setSignRole(null)
  }

  const handleApprove = async () => {
    await approveMutation.mutateAsync({ id: booking.id, notes: approveNotes || undefined })
    setShowApprove(false)
    setApproveNotes('')
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    await rejectMutation.mutateAsync({ id: booking.id, reason: rejectReason })
    setShowReject(false)
    setRejectReason('')
  }

  const handleRevise = async () => {
    if (!reviseReason.trim()) return
    await reviseMutation.mutateAsync({ id: booking.id, reason: reviseReason })
    setShowRevise(false)
    setReviseReason('')
  }

  // Sekretariat: gate approve/reject/revisi ke tahap pertama saja (belum diteruskan ke admin).
  // Admin: bisa bertindak kapan pun booking belum final (termasuk override/skip sekretariat).
  const canActOnApproval = isStaff && NON_FINAL_STATUSES.includes(booking.status) && (
    isAdmin || ['pending', 'sekretariat_review'].includes(booking.status)
  )
  const canStartReview = isSekretariat && booking.status === 'pending'
  const isOwner = user?.id === booking.user_id
  const canResubmit = isOwner && ['revision_sekretariat', 'revision_admin'].includes(booking.status)
  const latestRevision = [...(booking.approvals ?? [])]
    .filter((a) => a.action === 'revision')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  // ---- Data untuk tampilan web ----
  const detailGroups: DetailGroup[] = [
    {
      title: 'Informasi Kegiatan',
      fields: [
        { label: 'Judul', value: booking.title },
        { label: 'Jenis Kegiatan', value: booking.purpose_type ? (PURPOSE_LABELS[booking.purpose_type] ?? booking.purpose_type) : null },
        { label: 'Jumlah Peserta', value: booking.expected_attendees ? `${booking.expected_attendees} orang` : null },
        { label: 'Kontak', value: booking.contact_person },
        { label: 'Deskripsi', value: booking.description },
        { label: 'Catatan', value: booking.notes },
      ],
    },
    {
      title: 'Ruangan & Waktu',
      fields: [
        { label: 'Ruangan', value: booking.room?.name },
        { label: 'Gedung / Lokasi', value: booking.room?.building },
        { label: 'Tanggal', value: booking.booking_date ? formatDate(booking.booking_date, 'full') : null },
        { label: 'Waktu', value: `${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}` },
      ],
    },
    ...(booking.service_details
      ? [{
          title: 'Detail Pelayanan Gereja',
          fields: [
            { label: 'Jenis Pelayanan', value: booking.service_details.service_type_label },
            { label: 'Kontak', value: booking.service_details.contact },
            { label: 'Perlengkapan', value: booking.service_details.equipment?.join(', ') || null },
            ...Object.entries(booking.service_details.dynamic_fields || {}).map(([key, value]) => ({
              label: key,
              value: value ? String(value) : null,
            })),
          ],
        }]
      : []),
  ]

  // Dokumen resmi (bukti dokumen) — dari grup detail yang sama, field kosong dibuang
  const documentSections = detailGroups
    .map((g) => ({
      title: g.title ?? '',
      fields: g.fields
        .map((f) => ({ label: f.label, value: f.value as string | null | undefined }))
        .filter((f) => f.value),
    }))
    .filter((section) => section.fields.length > 0)

  // Timeline riwayat
  const sortedLogs = [...(booking.logs ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const timelineItems: TimelineItem[] = sortedLogs.length > 0
    ? sortedLogs.map((log) => ({
        icon: logIcon(log.action),
        title: LOG_LABELS[log.action] ?? log.action.charAt(0).toUpperCase() + log.action.slice(1),
        description: log.description,
        meta: `${formatDate(log.created_at, 'long')} · ${log.user?.name ?? 'Sistem'}`,
        tone: logTone(log.action),
      }))
    : [{
        icon: <FileText className="h-4 w-4" />,
        title: 'Booking diajukan',
        meta: `${formatDate(booking.created_at, 'long')} · ${booking.user?.name ?? '-'}`,
        tone: 'default',
      }]

  const canSignPemohon = user?.id === booking.user_id && !booking.signature_pemohon
  const canSignPetugas = isStaff && booking.status === 'approved' && !booking.signature_petugas

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/my-bookings"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Booking Saya
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{booking.title}</h1>
              {booking.booking_type === 'rutin' && (
                <Badge variant="outline" className="shrink-0">
                  Rutin · {booking.recurring_dates?.length ?? 0} tanggal
                </Badge>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {booking.room?.name && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{booking.room.name}</span>}
              {booking.booking_type === 'rutin' && booking.recurring_dates && booking.recurring_dates.length > 1 ? (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(booking.recurring_dates[0], 'long')} – {formatDate(booking.recurring_dates[booking.recurring_dates.length - 1], 'long')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(booking.booking_date, 'long')}</span>
              )}
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatTime(booking.start_time)}–{formatTime(booking.end_time)}</span>
            </div>
          </div>
          <Badge className={`${getStatusColor(booking.status)} shrink-0 px-3 py-1 text-sm`}>
            {getStatusLabel(booking.status)}
          </Badge>
        </div>
      </div>

      {/* Status stepper */}
      <Card>
        <CardContent className="py-5">
          <StatusStepper steps={bookingSteps(booking.status)} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kolom utama: versi web */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" /> Detail Pemesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetailFields groups={detailGroups} />
            </CardContent>
          </Card>

          {booking.booking_type === 'rutin' && booking.recurring_dates && booking.recurring_dates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="h-5 w-5 text-primary" /> Jadwal Rutin ({booking.recurring_dates.length} tanggal)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {booking.recurring_dates.map((d) => (
                  <Badge key={d} variant="secondary" className="text-xs">
                    {formatDate(d)}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {booking.status === 'rejected' && booking.reject_reason && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-700">Alasan Penolakan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700/90">{booking.reject_reason}</p>
              </CardContent>
            </Card>
          )}

          {['revision_sekretariat', 'revision_admin'].includes(booking.status) && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" /> Perlu Revisi
                  {latestRevision?.approver?.name && (
                    <span className="font-normal text-orange-700/70">— diminta oleh {latestRevision.approver.name}</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700/90">{latestRevision?.notes ?? '-'}</p>
              </CardContent>
            </Card>
          )}

          {isSekretariat && booking.status === 'sekretariat_review' && (
            <RoomReallocationCard booking={booking} />
          )}

          {canActOnApproval && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Aksi Persetujuan
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {canStartReview && (
                  <Button variant="outline" onClick={() => startReviewMutation.mutate(booking.id)} disabled={startReviewMutation.isPending}>
                    <PlayCircle className="h-4 w-4 mr-2" /> Mulai Review
                  </Button>
                )}
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowApprove(true)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Setujui
                </Button>
                <Button variant="outline" onClick={() => setShowRevise(true)}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Minta Revisi
                </Button>
                <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => setShowReject(true)}>
                  <XCircle className="h-4 w-4 mr-2" /> Tolak
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" /> Riwayat Aktivitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline items={timelineItems} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: ringkasan + aksi */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={getStatusColor(booking.status)}>{getStatusLabel(booking.status)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Diajukan</span>
                <span className="font-medium">{formatDate(booking.created_at, 'long')}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Pemohon</span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />{booking.user?.name ?? '-'}
                </span>
              </div>
              {booking.expected_attendees != null && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Peserta</span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />{booking.expected_attendees} orang
                  </span>
                </div>
              )}
              <div className="border-t pt-3 space-y-2">
                <SignatureStatus label="TTD Pemohon" signed={!!booking.signature_pemohon} />
                <SignatureStatus label="TTD Petugas" signed={!!booking.signature_petugas} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DocumentPreviewDialog
                title="Surat Peminjaman Ruangan"
                sections={documentSections}
                applicantName={booking.user?.name}
                submittedAt={booking.created_at}
                status={booking.status}
                signaturePemohonUrl={booking.signature_pemohon}
                signaturePetugasUrl={booking.signature_petugas}
                signerPetugasName={booking.signed_petugas_by}
              />
              {canSignPemohon && (
                <Button variant="outline" className="w-full gap-2" onClick={() => setSignRole('pemohon')}>
                  <PenLine className="h-4 w-4" /> Tanda Tangan Pemohon
                </Button>
              )}
              {canSignPetugas && (
                <Button variant="outline" className="w-full gap-2" onClick={() => setSignRole('petugas')}>
                  <PenLine className="h-4 w-4" /> Tanda Tangan Petugas
                </Button>
              )}
              {canResubmit && (
                <Link href={`/booking/new?edit=${booking.id}`} className={buttonVariants({ className: 'w-full gap-2' })}>
                  <Pencil className="h-4 w-4" /> Edit & Ajukan Ulang
                </Link>
              )}
              {(isOwner || isStaff) && booking.is_cancellable && (
                <Button variant="destructive" className="w-full gap-2" onClick={() => setShowCancel(true)}>
                  <XCircle className="h-4 w-4" /> Batalkan Booking
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Booking</DialogTitle>
            <DialogDesc>
              Tindakan ini tidak dapat diurungkan. Booking akan dibatalkan secara permanen.
            </DialogDesc>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCancel(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleCancel} loading={cancelMutation.isPending}>
              Ya, Batalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SignatureDialog
        open={signRole !== null}
        onOpenChange={(open) => { if (!open) setSignRole(null) }}
        title={`Tanda Tangan Sebagai ${signRole === 'pemohon' ? 'Pemohon' : 'Petugas Sekretariat'}`}
        savedSignature={user?.signature}
        onSubmit={handleSaveSignature}
        isPending={signMutation.isPending}
      />

      <Dialog open={showApprove} onOpenChange={setShowApprove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Booking</DialogTitle>
            <DialogDesc>
              {isAdmin
                ? 'Booking akan disetujui final dan ruangan dikonfirmasi untuk peminjaman.'
                : 'Booking akan diteruskan ke tahap Admin untuk persetujuan final.'}
            </DialogDesc>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-foreground mb-1 block">Catatan (opsional)</label>
            <Textarea rows={2} placeholder="Tambahkan catatan..." value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowApprove(false)}>Batal</Button>
            <Button onClick={handleApprove} loading={approveMutation.isPending}>Ya, Setujui</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Booking</DialogTitle>
            <DialogDesc>Masukkan alasan penolakan. Pemohon akan mendapat notifikasi.</DialogDesc>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-foreground mb-1 block">Alasan Penolakan *</label>
            <Textarea rows={3} placeholder="Masukkan alasan penolakan..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowReject(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()} loading={rejectMutation.isPending}>
              Tolak Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRevise} onOpenChange={setShowRevise}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Minta Revisi</DialogTitle>
            <DialogDesc>Booking akan dikembalikan ke pemohon untuk diperbaiki. Pemohon akan mendapat notifikasi.</DialogDesc>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-foreground mb-1 block">Alasan Revisi *</label>
            <Textarea rows={3} placeholder="Jelaskan apa yang perlu diperbaiki..." value={reviseReason} onChange={(e) => setReviseReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRevise(false)}>Batal</Button>
            <Button onClick={handleRevise} disabled={!reviseReason.trim()} loading={reviseMutation.isPending}>
              Minta Revisi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
