'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { TooltipCell } from '@/components/booking/TooltipCell';
import { useCalendarEvents } from '@/hooks/useBookings';
import { useHolidays } from '@/hooks/useHolidays';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Clock, MapPin, Eye, CalendarPlus, Info, ScrollText, DoorOpen, ListChecks, FileCheck2, BellRing } from 'lucide-react';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import { BOOKING_MIN_ADVANCE_DAYS, OPERATING_HOURS, TATA_TERTIB_TEXT } from '@/lib/constants';
import type { CalendarEvent } from '@/types';

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  // Kalender hanya menampilkan booking yang sudah disetujui — tidak ada UI filter status/ruangan.
  const statusFilter = 'approved';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const { data: rawEvents, isLoading, isError, refetch } = useCalendarEvents(yearStart, yearEnd);
  const holidays = useHolidays(year);

  const events = (rawEvents as CalendarEvent[] | undefined) ?? [];

  // Tanggal paling awal yang boleh dibooking (minimal H+7), untuk mute sel & gating tombol.
  // Tidak ada batas atas.
  const minDateStr = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + BOOKING_MIN_ADVANCE_DAYS);
    return formatLocalDate(d);
  }, [today]);
  const isBookableDate = (dateStr: string) => dateStr >= minDateStr;
  // Cuma tanggal yang SUDAH LEWAT yang dibuat pudar — tanggal hari ini s/d H+7
  // tetap terlihat jelas walau belum bisa dibooking (toast saat diklik sudah cukup jelaskan alasannya).
  const todayStr = useMemo(() => formatLocalDate(today), [today]);
  const isPastDate = (dateStr: string) => dateStr < todayStr;

  const filteredEvents = useMemo(() => events.filter((e) => e.status === statusFilter), [events]);

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

      {/* Panduan cara memesan ruangan */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ListChecks className="w-4 h-4 text-primary" /> Cara Memesan Ruangan
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <DoorOpen className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">1. Cek Ketersediaan</p>
                <p className="text-muted-foreground mt-0.5">Lihat kalender atau cari ruangan di menu Ruangan sesuai kapasitas & fasilitas yang dibutuhkan.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CalendarPlus className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">2. Isi Form Booking</p>
                <p className="text-muted-foreground mt-0.5">Klik tanggal di kalender atau tombol Booking Baru, lalu isi judul kegiatan, tanggal, jam, dan jumlah peserta.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">3. Ajukan & Tunggu Review</p>
                <p className="text-muted-foreground mt-0.5">Booking diajukan minimal H+{BOOKING_MIN_ADVANCE_DAYS}, lalu ditinjau bertahap oleh Sekretariat dan Admin.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">4. Dapat Notifikasi</p>
                <p className="text-muted-foreground mt-0.5">Setelah disetujui/ditolak, cek Notifikasi. Booking disetujui langsung muncul di kalender ini.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold text-foreground min-w-[140px] sm:min-w-[180px] text-center">
                {MONTH_NAMES[month]} {year}
              </h2>
              <Button variant="outline" size="icon" onClick={() => navigate(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-end gap-2">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLegendOpen((v) => !v)}
                  aria-label="Keterangan warna"
                >
                  <Info className="w-4 h-4" />
                </Button>
                {legendOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLegendOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border bg-popover text-popover-foreground shadow-lg p-3 space-y-2 text-sm">
                      <p className="font-medium text-xs text-muted-foreground mb-1">Keterangan</p>
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Booking Disetujui
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground inline-block" /> Hari Libur Nasional
                      </span>
                    </div>
                  </>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={goToday}>
                <CalendarDays className="w-4 h-4 mr-1" /> Hari Ini
              </Button>
            </div>
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
                    return <div key={`empty-${idx}`} className="border-r border-b border-border p-1.5 min-h-[88px] bg-muted/20" />;
                  }

                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayEvents = eventsByDate.get(dateStr) ?? [];
                  const isToday = isSameDay(new Date(year, month, dayNum), today);
                  const isSelected = selectedDate === dateStr;
                  const dow = new Date(year, month, dayNum).getDay();
                  const holiday = holidays.get(dateStr);
                  const isRed = dow === 0 || !!holiday; // Minggu atau libur nasional = tanggal merah, warna sama
                  const bookable = isBookableDate(dateStr);
                  const maxVisible = 3;
                  const visibleEvents = dayEvents.slice(0, maxVisible);
                  const overflow = dayEvents.length - maxVisible;

                  return (
                    <div
                      key={dateStr}
                      title={holiday?.name}
                      className={`relative border-r border-b border-border p-1.5 min-h-[88px] transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 hover:bg-primary/20'
                          : isToday
                            ? 'bg-accent/40 hover:bg-accent/60'
                            : isRed
                              ? 'bg-neutral-900 hover:bg-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-600'
                              : 'hover:bg-accent/60'
                      } ${isToday ? 'ring-2 ring-primary ring-inset' : ''} ${isPastDate(dateStr) ? 'opacity-60' : ''}`}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        if (!bookable) {
                          toast.info(`Tanggal ini terlalu dekat. Booking minimal H+${BOOKING_MIN_ADVANCE_DAYS} (mulai ${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(minDateStr + 'T00:00:00'))}).`);
                        }
                        setSheetOpen(true);
                      }}
                    >
                      {holiday && (
                        <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-white shrink-0" aria-hidden />
                      )}
                      <div className={`absolute top-1 right-1 text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-primary text-primary-foreground'
                          : isRed
                            ? 'text-white'
                            : 'text-foreground'
                      }`}>
                        {dayNum}
                      </div>
                      <div className="space-y-0.5 pt-0.5 pr-6">
                        {visibleEvents.map((event) => (
                          <TooltipCell key={event.id} event={event} />
                        ))}
                        {overflow > 0 && (
                          <span className={`block text-[10px] font-medium px-1 ${isRed ? 'text-neutral-300' : 'text-muted-foreground'}`}>
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

      {/* Tata tertib & ketentuan booking */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ScrollText className="w-4 h-4 text-primary" /> Tata Tertib & Ketentuan Booking Ruangan
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-1">
            <li>Booking harus diajukan minimal <strong className="text-foreground">H+{BOOKING_MIN_ADVANCE_DAYS}</strong> (tidak ada batas maksimal hari ke depan).</li>
            <li>Jam operasional ruangan: <strong className="text-foreground">{OPERATING_HOURS.open} – {OPERATING_HOURS.close}</strong>.</li>
            <li>Booking baru berlaku setelah disetujui oleh Sekretariat dan/atau Admin — status &quot;Menunggu Review&quot; belum berarti ruangan terkonfirmasi.</li>
          </ul>
          <div className="border-t pt-3 space-y-1">
            {TATA_TERTIB_TEXT.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agenda — panel geser dari kanan, muncul saat tanggal diklik */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {selectedDate
                ? `Agenda — ${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(selectedDate + 'T00:00:00'))}${holidays.get(selectedDate) ? ` · ${holidays.get(selectedDate)!.name}` : ''}`
                : 'Agenda'}
            </SheetTitle>
            <SheetClose onClick={() => setSheetOpen(false)} />
          </SheetHeader>

          {selectedDate && eventsOnSelectedDate.length > 0 ? (
            <ScrollArea className="flex-1">
              <div className="space-y-0">
                {eventsOnSelectedDate.map((event, index) => (
                  <div key={event.id}>
                    {index > 0 && <Separator />}
                    <button
                      type="button"
                      onClick={() => router.push(`/booking/${event.booking_id ?? event.id}`)}
                      className="w-full flex items-start gap-3 py-3 text-left hover:bg-muted/50 transition-colors rounded-md px-2 -mx-2"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {event.start_time} - {event.end_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.room}
                          </span>
                        </div>
                        <Badge className={getStatusColor(event.status)}>
                          {event.extendedProps?.status_label ?? getStatusLabel(event.status)}
                        </Badge>
                      </div>
                      <Eye className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : selectedDate ? (
            <EmptyState icon={CalendarDays} title="Tidak ada jadwal pada tanggal ini" />
          ) : (
            <EmptyState icon={CalendarDays} title="Klik tanggal pada kalender untuk melihat jadwal" />
          )}

          {selectedDate && isBookableDate(selectedDate) && (
            <div className="sticky bottom-0 bg-background pt-3 border-t mt-auto">
              <Button className="w-full" onClick={() => router.push(`/booking/new?date=${selectedDate}`)}>
                <CalendarPlus className="w-4 h-4 mr-1.5" /> Booking di tanggal ini
              </Button>
            </div>
          )}
          {selectedDate && !isBookableDate(selectedDate) && (
            <div className="sticky bottom-0 bg-background pt-3 border-t mt-auto">
              <p className="text-xs text-muted-foreground">
                Tanggal ini terlalu dekat untuk dipesan (minimal H+{BOOKING_MIN_ADVANCE_DAYS} dari hari ini).
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
