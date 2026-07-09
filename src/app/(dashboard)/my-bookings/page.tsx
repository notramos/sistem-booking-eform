'use client';

import { useEffect, useState } from 'react';
import { useMyBookings, useCancelBooking } from '@/hooks/useBookings';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils';
import { CalendarDays, Clock, MapPin, XCircle, Calendar, Search, PenLine } from 'lucide-react';
import Link from 'next/link';

export default function MyBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const { data, isLoading } = useMyBookings(statusFilter || undefined, page, search || undefined);
  const cancelBooking = useCancelBooking();

  const bookings = data?.data;
  const meta = data?.meta;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    await cancelBooking.mutateAsync(cancelId);
    setCancelId(null);
  };

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl options={statuses} value={statusFilter} onChange={handleStatusFilter} />
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari judul booking..."
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <Spinner size="lg" center label="Memuat booking..." />
      ) : bookings?.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Belum ada booking"
          action={{ label: 'Booking Sekarang', href: '/rooms' }}
        />
      ) : (
        <div className="space-y-3">
          {bookings?.map((booking) => {
            const needsSignature = booking.status === 'approved' && !booking.signature_pemohon;
            return (
              <Card key={booking.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/booking/${booking.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {booking.title}
                        </Link>
                        {booking.service_details && (
                          <Badge variant="outline" className="shrink-0">Pelayanan Gereja</Badge>
                        )}
                        {needsSignature && (
                          <Badge variant="outline" className="shrink-0 gap-1 text-amber-700 border-amber-300 bg-amber-50">
                            <PenLine className="w-3 h-3" /> Perlu tanda tangan
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{booking.room?.name}</p>

                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(booking.booking_date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </span>
                        {booking.room?.building && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
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
                          onClick={() => setCancelId(booking.id)}
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
            );
          })}
        </div>
      )}

      <Pagination meta={meta} onPageChange={setPage} itemLabel="booking" />

      <Dialog open={!!cancelId} onOpenChange={(open) => { if (!open) setCancelId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Booking</DialogTitle>
            <DialogDescription>Booking yang dibatalkan tidak dapat dikembalikan. Yakin ingin melanjutkan?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelId(null)}>Batal</Button>
            <Button
              variant="destructive"
              loading={cancelBooking.isPending}
              onClick={handleCancel}
            >
              Ya, Batalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
