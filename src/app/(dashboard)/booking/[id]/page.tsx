'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { StatusStepper, type StepperStep } from '@/components/detail/StatusStepper'
import { ActivityTimeline, type TimelineItem } from '@/components/detail/ActivityTimeline'
import { DetailFields, type DetailGroup } from '@/components/detail/DetailFields'
import { RoomReallocationCard } from '@/components/booking/RoomReallocationCard'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter,
} from '@/components/ui/dialog'
import {
  Clock, FileText, XCircle, CheckCircle2, ArrowLeft, PlayCircle, Pencil, Info,
  MapPin, CalendarDays, User as UserIcon,
} from 'lucide-react'
import {
  useBooking, useCancelBooking,
  useApproveBooking, useRejectBooking, useStartReview, useUpdateRecurringDate,
} from '@/hooks/useBookings'
import { useDayAvailability } from '@/hooks/useRooms'
import { useAuth } from '@/hooks/useAuth'
import { cn, formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils'
import { getServiceFieldLabel } from '@/lib/service-types'
import { BOOKING_MIN_ADVANCE_DAYS, PURPOSE_LABELS } from '@/lib/constants'
import type { Booking } from '@/types'

const NON_FINAL_STATUSES = ['pending', 'sekretariat_review', 'admin_review', 'revision_sekretariat', 'revision_admin']

const LOG_LABELS: Record<string, string> = {
  created: 'Booking diajukan',
  approved: 'Booking disetujui',
  rejected: 'Booking ditolak',
  cancelled: 'Booking dibatalkan',
  completed: 'Booking selesai',
  updated: 'Booking diperbarui',
  rescheduled: 'Jadwal/ruangan diubah',
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
  if (action === 'rescheduled') return <Pencil className="h-4 w-4" />
  return <Clock className="h-4 w-4" />
}

function logTone(action: string): TimelineItem['tone'] {
  if (['approved', 'confirmed', 'completed'].includes(action)) return 'success'
  if (['cancelled', 'rejected'].includes(action)) return 'danger'
  if (action === 'created') return 'default'
  return 'muted'
}

/**
 * Dialog ganti satu tanggal dalam seri booking rutin. Komponen terpisah (bukan
 * inline di BookingDetailPage) supaya useDayAvailability bisa dipanggil dengan
 * booking.room_id yang sudah pasti ada — di parent, booking bisa undefined
 * sebelum guard isLoading/isError, jadi hook tidak aman dipanggil di sana.
 */
function RecurringDateEditDialog({
  booking, oldDate, onClose,
}: { booking: Booking; oldDate: string; onClose: () => void }) {
  const [newDate, setNewDate] = useState<Date | undefined>(undefined)
  const updateRecurringDateMutation = useUpdateRecurringDate()

  const year = new Date(oldDate + 'T00:00:00').getFullYear()
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + BOOKING_MIN_ADVANCE_DAYS)
  const fromDate = minDate.getFullYear() > year ? undefined : new Date(Math.max(minDate.getTime(), new Date(year, 0, 1).getTime()))
  const toDate = new Date(year, 11, 31)

  const dateStr = newDate ? format(newDate, 'yyyy-MM-dd') : undefined
  const { data: dayAvailability } = useDayAvailability(booking.room_id, dateStr)
  const bookedSlots = dayAvailability?.booked_slots ?? []

  const handleSave = () => {
    if (!newDate) return
    updateRecurringDateMutation.mutate(
      { id: booking.id, oldDate, newDate: format(newDate, 'yyyy-MM-dd') },
      { onSuccess: onClose }
    )
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ganti Tanggal Booking Rutin</DialogTitle>
          <DialogDesc>
            Mengganti tanggal <strong>{formatDate(oldDate, 'long')}</strong> dengan tanggal lain di tahun {year} — tanggal lain di seri ini tidak ikut berubah.
          </DialogDesc>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <DatePicker label="Tanggal Pengganti" value={newDate} onChange={setNewDate} fromDate={fromDate} toDate={toDate} />
          {dateStr && bookedSlots.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">Sudah ada booking di ruangan ini pada tanggal tersebut:</p>
                <ul className="space-y-0.5">
                  {bookedSlots.map((slot, i) => (
                    <li key={i}>{formatTime(slot.start_time)} – {formatTime(slot.end_time)}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={!newDate} loading={updateRecurringDateMutation.isPending}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: booking, isLoading, isError } = useBooking(id)
  const cancelMutation = useCancelBooking()
  const approveMutation = useApproveBooking()
  const rejectMutation = useRejectBooking()
  const startReviewMutation = useStartReview()
  const { user, hasAnyRole, isAdmin, isSekretariat } = useAuth()
  const isStaff = hasAnyRole(['p2', 'pastor', 'it_admin', 'sekretariat'])

  const [showCancel, setShowCancel] = useState(false)
  const [showApprove, setShowApprove] = useState(false)
  const [approveNotes, setApproveNotes] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [editingRecurringDate, setEditingRecurringDate] = useState<string | null>(null)

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

  // Sekretariat: gate approve/reject ke tahap pertama saja (belum diteruskan ke admin).
  // Admin: bisa bertindak kapan pun booking belum final (termasuk override/skip sekretariat).
  const canActOnApproval = isStaff && NON_FINAL_STATUSES.includes(booking.status) && (
    isAdmin || ['pending', 'sekretariat_review'].includes(booking.status)
  )
  const canStartReview = isSekretariat && booking.status === 'pending'
  const isOwner = user?.id === booking.user_id
  const canEdit = isOwner && ['pending', 'sekretariat_review', 'revision_sekretariat', 'revision_admin'].includes(booking.status)
  const canEditRecurringDates = isStaff && NON_FINAL_STATUSES.includes(booking.status)
  const canCancel = (isOwner || isStaff) && !!booking.is_cancellable
  const hasAnyAction = canActOnApproval || canEdit || canCancel

  // Dipakai dua kali: card sidebar (desktop) dan action bar melayang (mobile).
  const actionButtons = (
    <>
      {canActOnApproval && (
        <>
          {canStartReview && (
            <Button variant="outline" className="w-full gap-2" onClick={() => startReviewMutation.mutate(booking.id)} disabled={startReviewMutation.isPending}>
              <PlayCircle className="h-4 w-4" /> Mulai Review
            </Button>
          )}
          <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowApprove(true)}>
            <CheckCircle2 className="h-4 w-4" /> Setujui
          </Button>
          <Button variant="outline" className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => setShowReject(true)}>
            <XCircle className="h-4 w-4" /> Tolak
          </Button>
        </>
      )}
      {canEdit && (
        <Link href={`/booking/new?edit=${booking.id}`} className={buttonVariants({ className: 'w-full gap-2' })}>
          <Pencil className="h-4 w-4" /> Edit Booking
        </Link>
      )}
      {canCancel && (
        <Button variant="destructive" className="w-full gap-2" onClick={() => setShowCancel(true)}>
          <XCircle className="h-4 w-4" /> Batalkan
        </Button>
      )}
    </>
  )

  // ---- Data untuk tampilan web ----
  const detailGroups: DetailGroup[] = [
    {
      title: 'Informasi Kegiatan',
      fields: [
        { label: 'Peminjam', value: booking.title },
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
              label: getServiceFieldLabel(booking.service_details?.service_type_label, key),
              value: value ? String(value) : null,
            })),
          ],
        }]
      : []),
  ]

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

  return (
    <div className={cn('space-y-4 sm:space-y-6', hasAnyAction && 'pb-24 lg:pb-0')}>
      {/* Header */}
      <div>
        <Link
          href="/my-bookings"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Booking Saya
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words">{booking.title}</h1>
              {booking.booking_type === 'rutin' && (
                <Badge variant="outline" className="shrink-0">
                  Rutin · {booking.recurring_dates?.length ?? 0} tanggal
                </Badge>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
              {booking.room?.name && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" />{booking.room.name}</span>}
              {booking.booking_type === 'rutin' && booking.recurring_dates && booking.recurring_dates.length > 1 ? (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  {formatDate(booking.recurring_dates[0], 'long')} – {formatDate(booking.recurring_dates[booking.recurring_dates.length - 1], 'long')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 shrink-0" />{formatDate(booking.booking_date, 'long')}</span>
              )}
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 shrink-0" />{formatTime(booking.start_time)}–{formatTime(booking.end_time)}</span>
              <span className="inline-flex items-center gap-1"><UserIcon className="h-3.5 w-3.5 shrink-0" />{booking.user?.name ?? '-'}</span>
              <span className="text-muted-foreground/70">Diajukan {formatDate(booking.created_at, 'long')}</span>
            </div>
          </div>
          <Badge className={`${getStatusColor(booking.status)} shrink-0 px-2.5 py-1 text-xs sm:px-3 sm:text-sm`}>
            {getStatusLabel(booking.status)}
          </Badge>
        </div>
      </div>

      {/* Status stepper */}
      <Card>
        <CardContent className="p-4 sm:py-5 sm:px-6">
          <StatusStepper steps={bookingSteps(booking.status)} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Kolom utama: versi web */}
        <div className={cn('space-y-4 sm:space-y-6', hasAnyAction ? 'lg:col-span-2' : 'lg:col-span-3')}>
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-5 w-5 text-primary shrink-0" /> Detail Pemesanan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <DetailFields groups={detailGroups} />
            </CardContent>
          </Card>

          {booking.booking_type === 'rutin' && booking.recurring_dates && booking.recurring_dates.length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <CalendarDays className="h-5 w-5 text-primary shrink-0" /> Jadwal Rutin ({booking.recurring_dates.length} tanggal)
                </CardTitle>
                {canEditRecurringDates && (
                  <p className="text-xs text-muted-foreground">Klik tanggal untuk mengganti tanggal tersebut secara individual.</p>
                )}
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5 p-4 pt-0 sm:p-6 sm:pt-0">
                {booking.recurring_dates.map((d) => (
                  canEditRecurringDates ? (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setEditingRecurringDate(d)}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground hover:bg-secondary/70 transition-colors"
                    >
                      {formatDate(d)}
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ) : (
                    <Badge key={d} variant="secondary" className="text-xs">
                      {formatDate(d)}
                    </Badge>
                  )
                ))}
              </CardContent>
            </Card>
          )}

          {booking.status === 'rejected' && booking.reject_reason && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
                <CardTitle className="text-sm text-red-700">Alasan Penolakan</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <p className="text-sm text-red-700/90">{booking.reject_reason}</p>
              </CardContent>
            </Card>
          )}

          {isSekretariat && booking.status === 'sekretariat_review' && (
            <RoomReallocationCard booking={booking} />
          )}

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-5 w-5 text-primary shrink-0" /> Riwayat Aktivitas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <ActivityTimeline items={timelineItems} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar aksi (desktop) — sticky supaya tetap kelihatan saat kolom utama di-scroll.
            Di mobile digantikan action bar melayang di bawah layar (lihat bawah). */}
        {hasAnyAction && (
          <div className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base">Aksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">{actionButtons}</CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Action bar mobile — supaya staf tidak perlu scroll melewati seluruh detail
          & riwayat hanya untuk menyetujui/menolak. */}
      {hasAnyAction && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
          <div className="flex gap-2 [&>*]:flex-1">{actionButtons}</div>
        </div>
      )}

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

      {editingRecurringDate && (
        <RecurringDateEditDialog
          booking={booking}
          oldDate={editingRecurringDate}
          onClose={() => setEditingRecurringDate(null)}
        />
      )}
    </div>
  )
}
