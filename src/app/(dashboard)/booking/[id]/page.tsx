'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CalendarDays,
  Clock,
  User,
  DoorOpen,
  MapPin,
  Tag,
  FileText,
  XCircle,
  CheckCircle2,
  MessageSquare,
  ArrowLeft,
  Church,
  Phone,
} from 'lucide-react'
import { useBooking, useCancelBooking } from '@/hooks/useBookings'
import { formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils'

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: booking, isLoading, isError } = useBooking(id)
  const cancelMutation = useCancelBooking()

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

  const handleCancel = () => {
    if (confirm('Yakin ingin membatalkan booking ini?')) {
      cancelMutation.mutate(booking.id)
    }
  }

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="h-5 w-5" />
                Informasi Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <DoorOpen className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Ruangan</p>
                    <p className="text-sm text-muted-foreground">{booking.room?.name ?? '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Lokasi</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.room?.building ?? '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Tanggal</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(booking.booking_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Waktu</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Dipesan oleh</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.user?.name ?? '-'}
                  </p>
                </div>
              </div>

              {booking.purpose_type && (
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Tujuan</p>
                    <p className="text-sm text-muted-foreground">{booking.purpose_type}</p>
                  </div>
                </div>
              )}

              {booking.description && (
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Deskripsi</p>
                    <p className="text-sm text-muted-foreground">{booking.description}</p>
                  </div>
                </div>
              )}

              {booking.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Catatan</p>
                    <p className="text-sm text-muted-foreground">{booking.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {booking.service_details && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Church className="h-5 w-5" />
                  Detail Pelayanan Gereja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Jenis Pelayanan</p>
                    <p className="text-sm text-muted-foreground">{booking.service_details.service_type_label}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Kontak</p>
                    <p className="text-sm text-muted-foreground">{booking.service_details.contact}</p>
                  </div>
                </div>
                {booking.service_details.equipment?.length > 0 && (
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Perlengkapan</p>
                      <p className="text-sm text-muted-foreground">{booking.service_details.equipment.join(', ')}</p>
                    </div>
                  </div>
                )}
                {booking.service_details.dynamic_fields && Object.keys(booking.service_details.dynamic_fields).length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {Object.entries(booking.service_details.dynamic_fields).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start gap-4 text-sm">
                        <span className="text-muted-foreground shrink-0">{key}</span>
                        <span className="text-foreground font-medium text-right">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                  {booking.logs.map((log: any, index: number) => (
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
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                >
                  <XCircle className="h-4 w-4" />
                  {cancelMutation.isPending ? 'Membatalkan...' : 'Batalkan Booking'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
