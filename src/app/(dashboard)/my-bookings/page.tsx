'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMyBookings } from '@/hooks/useBookings';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { formatDate, formatTime, getStatusColor, getStatusLabel, getRoomDisplayLabel, cn } from '@/lib/utils';
import { PURPOSE_LABELS } from '@/lib/constants';
import { CalendarDays, Clock, MapPin, Calendar, Search, Tag, Users, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';

export default function MyBookingsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyBookings(statusFilter || undefined, page, search || undefined);

  const meta = data?.meta;
  const bookings = useMemo(() => data?.data ?? [], [data]);

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

  const resetFilters = () => {
    setStatusFilter('');
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const hasFilters = Boolean(statusFilter || searchInput);

  const statuses = [
    { value: '', label: 'Semua' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'sekretariat_review', label: 'Ditinjau Sekretariat' },
    { value: 'admin_review', label: 'Ditinjau Admin' },
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

      <Card className="border-border/80 bg-muted/[0.12] shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E7F0EA] text-[#526F5E]">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Cari & Filter Booking</p>
              <p className="text-xs text-muted-foreground">Temukan peminjaman berdasarkan peminjam atau status.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end">
            <div className="space-y-1">
              <label htmlFor="booking-search" className="text-xs font-medium text-muted-foreground">Pencarian</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="booking-search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari nama peminjam..."
                  className="h-10 bg-background pl-9 pr-9"
                />
                {searchInput && (
                  <button
                    type="button"
                    aria-label="Hapus pencarian"
                    onClick={() => setSearchInput('')}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <Select
              id="booking-status"
              label="Status"
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="h-10 bg-background"
            >
              {statuses.map((status) => <option key={status.value || 'all'} value={status.value}>{status.label}</option>)}
            </Select>

            <Button
              type="button"
              variant="ghost"
              onClick={resetFilters}
              disabled={!hasFilters}
              className="h-10 justify-center text-muted-foreground sm:px-3"
            >
              <X className="mr-1.5 h-4 w-4" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Spinner size="lg" center label="Memuat booking..." />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={hasFilters ? 'Booking tidak ditemukan' : 'Belum ada booking'}
          description={hasFilters ? 'Coba ubah kata pencarian atau status yang dipilih.' : 'Peminjaman yang Anda ajukan akan tampil di halaman ini.'}
          action={hasFilters ? { label: 'Reset Filter', onClick: resetFilters } : { label: 'Booking Sekarang', href: '/rooms' }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => {
            return (
              <Card
                key={booking.id}
                onClick={() => router.push(`/booking/${booking.id}`)}
                className="flex flex-col cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
              >
                <CardContent className="p-5 flex flex-1 flex-col">
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
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {getRoomDisplayLabel(booking.room)}
                    {(booking.room?.building || booking.room?.floor) && (
                      <span className="text-muted-foreground/70">
                        · {booking.room?.building}{booking.room?.floor ? ` Lt.${booking.room.floor}` : ''}
                      </span>
                    )}
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
                    {booking.purpose_type && (
                      <span className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        {PURPOSE_LABELS[booking.purpose_type] ?? booking.purpose_type}
                      </span>
                    )}
                    {booking.expected_attendees != null && (
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {booking.expected_attendees} orang
                      </span>
                    )}
                  </div>
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
