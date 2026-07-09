'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { TooltipCell } from '@/components/booking/TooltipCell';
import { useCalendarEvents } from '@/hooks/useBookings';
import { useRooms } from '@/hooks/useRooms';
import { useHolidays } from '@/hooks/useHolidays';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Filter, Clock, MapPin, Eye, CalendarPlus } from 'lucide-react';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import { BOOKING_MIN_ADVANCE_DAYS, BOOKING_MAX_ADVANCE_DAYS } from '@/lib/constants';
import type { CalendarEvent } from '@/types';

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
  { value: 'rejected', label: 'Ditolak' },
] as const;

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
  const days: (number | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startPad + 1;
    days.push(dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null);
  }
  return days;
}

function formatLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toDateStr(iso: string) {
  return iso.slice(0, 10);
}

function toTimeStr(iso: string) {
  return iso.slice(11, 16);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function CalendarPage() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const monthStart = formatLocalDate(new Date(year, month, 1));
  const monthEnd = formatLocalDate(new Date(year, month + 1, 0));

  const { data: rawEvents, isLoading, isError, refetch } = useCalendarEvents(yearStart, yearEnd, selectedRoomId || undefined);
  const { data: roomsData } = useRooms({ per_page: 100, sort_by: 'name' });
  const holidays = useHolidays(year);

  const events = (rawEvents as CalendarEvent[] | undefined) ?? [];
  const rooms = roomsData?.data ?? [];

  // Rentang tanggal yang boleh dibooking (H+7 s/d H+30), untuk mute sel & gating tombol.
  const minDateStr = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + BOOKING_MIN_ADVANCE_DAYS);
    return formatLocalDate(d);
  }, [today]);
  const maxDateStr = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + BOOKING_MAX_ADVANCE_DAYS);
    return formatLocalDate(d);
  }, [today]);
  const isBookableDate = (dateStr: string) => dateStr >= minDateStr && dateStr <= maxDateStr;

  const filteredEvents = useMemo(() => {
    if (statusFilter === 'all') return events;
    return events.filter((e) => e.status === statusFilter);
  }, [events, statusFilter]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of filteredEvents) {
      const key = toDateStr(event.start);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [filteredEvents]);

  const eventsOnSelectedDate = selectedDate ? eventsByDate.get(selectedDate) ?? [] : [];

  const summary = useMemo(() => {
    let total = 0;
    let pending = 0;
    let approved = 0;
    for (const e of events) {
      if (toDateStr(e.start) >= monthStart && toDateStr(e.start) <= monthEnd) {
        total++;
        if (e.status === 'pending') pending++;
        if (e.status === 'approved') approved++;
      }
    }
    return { total, pending, approved };
  }, [events, monthStart, monthEnd]);

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  function navigate(delta: number) {
    setCurrentDate(new Date(year, month + delta, 1));
    setSelectedDate(null);
  }

  function goToday() {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(formatLocalDate(today));
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') navigate(-1);
      else if (e.key === 'ArrowRight') navigate(1);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [year, month]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kalender Booking</h1>
          <p className="text-muted-foreground mt-1">Lihat jadwal peminjaman ruangan</p>
        </div>
        <Link href={`/booking/new?date=${minDateStr}`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Booking Baru
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Booking</p>
            <p className="text-2xl font-bold text-foreground mt-1">{summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">Menunggu</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{summary.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-green-600 dark:text-green-400">Disetujui</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{summary.approved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
        <div className="ml-auto flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="flex h-9 w-56 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Semua Ruangan</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}{room.building ? ` - ${room.building}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold text-foreground min-w-[180px] text-center">
                {MONTH_NAMES[month]} {year}
              </h2>
              <Button variant="outline" size="icon" onClick={() => navigate(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToday}>
              <CalendarDays className="w-4 h-4 mr-1" /> Hari Ini
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Spinner size="lg" center label="Memuat jadwal..." />
          ) : isError ? (
            <ErrorState message="Gagal memuat jadwal kalender." onRetry={() => refetch()} />
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map((name) => (
                  <div key={name} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {name}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 border-t border-l border-border">
                {days.map((dayNum, idx) => {
                  if (dayNum === null) {
                    return <div key={`empty-${idx}`} className="border-r border-b border-border p-1.5 min-h-[100px] bg-muted/20" />;
                  }

                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayEvents = eventsByDate.get(dateStr) ?? [];
                  const isToday = isSameDay(new Date(year, month, dayNum), today);
                  const isSelected = selectedDate === dateStr;
                  const dow = new Date(year, month, dayNum).getDay();
                  const holiday = holidays.get(dateStr);
                  const isRed = dow === 0 || !!holiday; // Minggu atau libur nasional = tanggal merah
                  const bookable = isBookableDate(dateStr);
                  const maxDots = 4;
                  const visibleEvents = dayEvents.slice(0, maxDots);
                  const overflow = dayEvents.length - maxDots;

                  return (
                    <div
                      key={dateStr}
                      title={holiday?.name}
                      className={`relative border-r border-b border-border p-1.5 min-h-[100px] transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary/5'
                          : isToday
                            ? 'bg-accent/40'
                            : isRed
                              ? 'bg-red-50/60 dark:bg-red-950/20 hover:bg-red-50'
                              : 'hover:bg-accent/20'
                      } ${!bookable ? 'opacity-60' : ''}`}
                      onClick={() => setSelectedDate(dateStr)}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-primary text-primary-foreground'
                            : isRed
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-foreground'
                        }`}>
                          {dayNum}
                        </div>
                        {holiday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" aria-hidden />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {visibleEvents.map((event) => (
                          <TooltipCell key={event.id} event={event} />
                        ))}
                        {overflow > 0 && (
                          <span className="text-xs text-muted-foreground font-medium ml-1">
                            +{overflow} lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> Menunggu
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Disetujui
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Selesai
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Dibatalkan/Ditolak
        </span>
      </div>

      {/* Agenda Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">
              {selectedDate
                ? `Agenda — ${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(selectedDate + 'T00:00:00'))}${holidays.get(selectedDate) ? ` · ${holidays.get(selectedDate)!.name}` : ''}`
                : 'Agenda — Pilih tanggal untuk melihat jadwal'}
            </CardTitle>
            {selectedDate && isBookableDate(selectedDate) && (
              <Button size="sm" onClick={() => router.push(`/booking/new?date=${selectedDate}`)}>
                <CalendarPlus className="w-4 h-4 mr-1.5" /> Booking di tanggal ini
              </Button>
            )}
          </div>
          {selectedDate && !isBookableDate(selectedDate) && (
            <p className="text-xs text-muted-foreground mt-1">
              Tanggal ini di luar rentang pemesanan (H+{BOOKING_MIN_ADVANCE_DAYS} s/d H+{BOOKING_MAX_ADVANCE_DAYS} dari hari ini).
            </p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {selectedDate && eventsOnSelectedDate.length > 0 ? (
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jam</TableHead>
                    <TableHead>Ruangan</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventsOnSelectedDate.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          {event.start_time} - {event.end_time}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {event.room}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{event.title}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(event.status)}>
                          {event.extendedProps?.status_label ?? getStatusLabel(event.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => router.push(`/booking/${event.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : selectedDate ? (
            <EmptyState icon={CalendarDays} title="Tidak ada jadwal pada tanggal ini" />
          ) : (
            <EmptyState icon={CalendarDays} title="Klik tanggal pada kalender untuk melihat jadwal" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
