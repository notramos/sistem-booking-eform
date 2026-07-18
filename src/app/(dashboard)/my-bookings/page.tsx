'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMyBookings } from '@/hooks/useBookings';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Pagination } from '@/components/ui/pagination';
import { formatDate, formatTime, getStatusColor, getStatusLabel, cn } from '@/lib/utils';
import { CalendarDays, Clock, MapPin, Calendar, Search, PenLine, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type { Booking } from '@/types';

function needsResubmitOf(booking: Booking) {
  return ['revision_sekretariat', 'revision_admin'].includes(booking.status);
}

function needsSignatureOf(booking: Booking) {
  return booking.status === 'approved' && !booking.signature_pemohon;
}

function latestRevisionOf(booking: Booking) {
  return [...(booking.approvals ?? [])]
    .filter((a) => a.action === 'revision')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyBookings(statusFilter || undefined, page, search || undefined);

  const meta = data?.meta;

  // Kartu yang butuh tindakan pemohon (revisi lalu tanda tangan) ditaruh paling atas
  // di halaman yang sedang tampil, sisanya mempertahankan urutan asli dari API.
  const bookings = useMemo(() => {
    const list = data?.data ?? [];
    const priority = (b: Booking) => (needsResubmitOf(b) ? 0 : needsSignatureOf(b) ? 1 : 2);
    return [...list].sort((a, b) => priority(a) - priority(b));
  }, [data]);

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

  const statuses = [
    { value: '', label: 'Semua' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'sekretariat_review', label: 'Ditinjau Sekretariat' },
    { value: 'admin_review', label: 'Ditinjau Admin' },
    { value: 'revision_sekretariat', label: 'Revisi (Sekretariat)' },
    { value: 'revision_admin', label: 'Revisi (Admin)' },
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
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Belum ada booking"
          action={{ label: 'Booking Sekarang', href: '/rooms' }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => {
            const needsSignature = needsSignatureOf(booking);
            const needsResubmit = needsResubmitOf(booking);
            const needsAction = needsResubmit || needsSignature;
            const revision = needsResubmit ? latestRevisionOf(booking) : undefined;

            return (
              <Card
                key={booking.id}
                onClick={() => router.push(`/booking/${booking.id}`)}
                className={cn(
                  'flex flex-col cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
                  needsResubmit && 'border-l-4 border-l-orange-400',
                  !needsResubmit && needsSignature && 'border-l-4 border-l-amber-400'
                )}
              >
                <CardContent className="p-5 flex flex-1 flex-col">
                  {needsAction && (
                    <div className={cn(
                      'mb-2 flex items-center gap-1.5 text-xs font-medium',
                      needsResubmit ? 'text-orange-700' : 'text-amber-700'
                    )}>
                      {needsResubmit ? <RotateCcw className="w-3.5 h-3.5" /> : <PenLine className="w-3.5 h-3.5" />}
                      {needsResubmit ? 'Perlu Revisi' : 'Perlu Tanda Tangan'}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground truncate">{booking.title}</h3>
                    <Badge className={cn(getStatusColor(booking.status), 'shrink-0')}>
                      {getStatusLabel(booking.status)}
                    </Badge>
                  </div>

                  {booking.service_details && (
                    <Badge variant="outline" className="mt-1.5 self-start">Pelayanan Gereja</Badge>
                  )}
                  {booking.booking_type === 'rutin' && (
                    <Badge variant="outline" className="mt-1.5 self-start">
                      Rutin · {booking.recurring_dates?.length ?? 0} tanggal
                    </Badge>
                  )}

                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {booking.room?.name}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {booking.booking_type === 'rutin' && booking.recurring_dates && booking.recurring_dates.length > 1
                        ? `${formatDate(booking.recurring_dates[0])} – ${formatDate(booking.recurring_dates[booking.recurring_dates.length - 1])}`
                        : formatDate(booking.booking_date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </span>
                  </div>

                  {revision?.notes && (
                    <div className="mt-3 rounded-md border border-orange-200 bg-orange-50 p-2.5 text-xs text-orange-700">
                      <p className="line-clamp-2">{revision.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination meta={meta} onPageChange={setPage} itemLabel="booking" />
    </div>
  );
}
