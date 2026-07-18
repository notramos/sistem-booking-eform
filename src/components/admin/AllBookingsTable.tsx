'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useBookings } from '@/hooks/useBookings';
import { useRooms } from '@/hooks/useRooms';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Pagination } from '@/components/ui/pagination';
import { formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Eye, ClipboardList, X } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
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

export function AllBookingsTable() {
  const [status, setStatus] = useState('');
  const [roomId, setRoomId] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data: roomsData } = useRooms({ per_page: 100, sort_by: 'name' });
  const rooms = roomsData?.data ?? [];

  const { data, isLoading, isError, refetch } = useBookings({
    status: status || undefined,
    room_id: roomId || undefined,
    date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
    date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
    page,
  });

  const bookings = data?.data ?? [];
  const hasFilters = !!status || !!roomId || !!dateFrom || !!dateTo;

  const resetFilters = () => {
    setStatus('');
    setRoomId('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <Select
              label="Status"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-48"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
            <Select
              label="Ruangan"
              value={roomId}
              onChange={(e) => { setRoomId(e.target.value); setPage(1); }}
              className="w-56"
            >
              <option value="">Semua Ruangan</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}{room.building ? ` - ${room.building}` : ''}
                </option>
              ))}
            </Select>
            <DatePicker label="Dari Tanggal" value={dateFrom} onChange={(d) => { setDateFrom(d); setPage(1); }} />
            <DatePicker label="Sampai Tanggal" value={dateTo} onChange={(d) => { setDateTo(d); setPage(1); }} />
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="w-4 h-4 mr-1" /> Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Spinner size="lg" center label="Memuat data booking..." />
      ) : isError ? (
        <ErrorState message="Gagal memuat data booking." onRetry={() => refetch()} />
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState icon={ClipboardList} title="Tidak ada booking yang cocok dengan filter" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead className="hidden md:table-cell">Pemohon</TableHead>
                  <TableHead>Ruangan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.title}</TableCell>
                    <TableCell className="hidden md:table-cell">{booking.user?.name ?? '-'}</TableCell>
                    <TableCell>{booking.room?.name ?? '-'}</TableCell>
                    <TableCell>{formatDate(booking.booking_date)}</TableCell>
                    <TableCell>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>{getStatusLabel(booking.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/booking/${booking.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} itemLabel="booking" />
    </div>
  );
}
