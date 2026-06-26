'use client';

import { useState } from 'react';
import { useMyBookings, useCancelBooking } from '@/hooks/useBookings';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils';
import { CalendarDays, Clock, MapPin, XCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function MyBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: bookings, isLoading } = useMyBookings(statusFilter || undefined);
  const cancelBooking = useCancelBooking();

  const statuses = [
    { value: '', label: 'Semua' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
    { value: 'cancelled', label: 'Dibatalkan' },
    { value: 'completed', label: 'Selesai' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Booking Saya</h1>
          <p className="text-muted-foreground mt-1">Riwayat peminjaman ruangan</p>
        </div>
        <Link href="/rooms">
          <Button>
            <Calendar className="w-4 h-4 mr-2" /> Booking Baru
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : bookings?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Belum ada booking</p>
          <Link href="/rooms">
            <Button>Booking Sekarang</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings?.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/booking/${booking.id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {booking.title}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">{booking.room?.name}</p>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-4 h-4" />
                        {formatDate(booking.booking_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </span>
                      {booking.room?.building && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {booking.room.building}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 ml-4 shrink-0">
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusLabel(booking.status)}
                    </Badge>
                    {booking.is_cancellable && (
                      <button
                        onClick={() => {
                          if (confirm('Yakin ingin membatalkan booking ini?')) {
                            cancelBooking.mutate(booking.id);
                          }
                        }}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Batalkan booking"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
