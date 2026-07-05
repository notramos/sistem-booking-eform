'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { OfficialDocumentPreview } from '@/components/ui/official-document-preview'
import { SignatureDialog } from '@/components/ui/signature-dialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter,
} from '@/components/ui/dialog'
import {
  Clock,
  FileText,
  XCircle,
  CheckCircle2,
  ArrowLeft,
  PenLine,
  Loader2,
} from 'lucide-react'
import { useBooking, useCancelBooking, useSignBooking } from '@/hooks/useBookings'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils'

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: booking, isLoading, isError } = useBooking(id)
  const cancelMutation = useCancelBooking()
  const signMutation = useSignBooking()
  const { user, hasAnyRole } = useAuth()
  const isStaff = hasAnyRole(['admin', 'sekretariat'])

  const [showCancel, setShowCancel] = useState(false)
  const [signRole, setSignRole] = useState<'pemohon' | 'petugas' | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
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

  const documentSections = [
    {
      title: 'Data Pemesanan',
      fields: [
        { label: 'Ruangan', value: booking.room?.name },
        { label: 'Gedung/Lokasi', value: booking.room?.building },
        { label: 'Tanggal', value: booking.booking_date },
        { label: 'Waktu', value: `${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}` },
        { label: 'Jenis Kegiatan', value: booking.purpose_type },
        { label: 'Jumlah Peserta', value: booking.expected_attendees ? String(booking.expected_attendees) : null },
        { label: 'Kontak', value: booking.contact_person },
        { label: 'Deskripsi', value: booking.description },
        { label: 'Catatan', value: booking.notes },
      ],
    },
    ...(booking.service_details
      ? [
          {
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
          },
        ]
      : []),
  ].map((section) => ({
    ...section,
    fields: section.fields.filter((f) => f.value),
  }))

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/my-bookings"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Booking Saya
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{booking.title}</h1>
            <p className="text-muted-foreground mt-1">
              Detail dan status booking
            </p>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {getStatusLabel(booking.status)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <p className="text-sm text-muted-foreground no-print">
            Dipesan oleh {booking.user?.name ?? '-'}
          </p>

          <OfficialDocumentPreview
            title="Surat Peminjaman Ruangan"
            sections={documentSections}
            applicantName={booking.user?.name}
            submittedAt={booking.created_at}
            status={booking.status}
            showPrintButton
            signaturePemohonUrl={booking.signature_pemohon}
            signaturePetugasUrl={booking.signature_petugas}
            signerPetugasName={booking.signed_petugas_by}
          />

          <div className="flex flex-wrap gap-3 no-print">
            {user?.id === booking.user_id && !booking.signature_pemohon && (
              <Button variant="outline" size="sm" onClick={() => setSignRole('pemohon')}>
                <PenLine className="h-4 w-4 mr-2" />
                Tanda Tangan Sebagai Pemohon
              </Button>
            )}
            {isStaff && booking.status === 'approved' && !booking.signature_petugas && (
              <Button variant="outline" size="sm" onClick={() => setSignRole('petugas')}>
                <PenLine className="h-4 w-4 mr-2" />
                Tanda Tangan Sebagai Petugas
              </Button>
            )}
          </div>

          {booking.approval && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5" />
                  Informasi Persetujuan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{booking.approval.action}</Badge>
                  <span className="text-sm text-muted-foreground">
                    oleh {booking.approval.approver?.name ?? '-'}
                  </span>
                </div>
                {booking.approval.notes && (
                  <p className="text-sm text-muted-foreground">
                    {booking.approval.notes}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDate(booking.approval.created_at)}
                </p>
              </CardContent>
            </Card>
          )}

          {booking.logs && booking.logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Riwayat Aktivitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {booking.logs.map((log, index) => (
                    <div key={log.id ?? index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border">
                          {log.action === 'created' ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : log.action === 'approved' || log.action === 'confirmed' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : log.action === 'cancelled' || log.action === 'rejected' ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        {booking.logs && index < booking.logs.length - 1 && (
                          <div className="h-full w-px bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium capitalize">{log.action}</p>
                        {log.description && (
                          <p className="text-sm text-muted-foreground">{log.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(log.created_at)} - {log.user?.name ?? 'Sistem'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {booking.is_cancellable && (
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => setShowCancel(true)}
                >
                  <XCircle className="h-4 w-4" />
                  Batalkan Booking
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
            <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
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
    </div>
  )
}
