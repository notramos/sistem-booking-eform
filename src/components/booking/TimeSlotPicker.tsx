'use client';

import { useMemo, useState } from 'react';
import { Clock, Check } from 'lucide-react';
import { useDayAvailability } from '@/hooks/useRooms';
import { BookedSlotsTimeline } from '@/components/booking/BookedSlotsTimeline';
import { OPERATING_HOURS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const STEP_MINUTES = 30;
/** Durasi pintas — mayoritas peminjaman ruangan gereja bulat 1–3 jam. */
const QUICK_DURATIONS = [60, 120, 180];

const PERIODS: { label: string; until: number }[] = [
  { label: 'Pagi', until: 11 * 60 },
  { label: 'Siang', until: 15 * 60 },
  { label: 'Sore', until: 18 * 60 },
  { label: 'Malam', until: 24 * 60 },
];

function toMin(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

function toHM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

function periodOf(min: number): string {
  return PERIODS.find((p) => min < p.until)?.label ?? 'Malam';
}

function durationLabel(minutes: number): string {
  const h = minutes / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1).replace('.', ',')} jam`;
}

interface Props {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  /** Untuk mengambil slot yang sudah terpesan — tanpa ini semua jam dianggap bebas. */
  roomId?: string;
  date?: string;
  label?: string;
  error?: string;
}

/**
 * Pemilih jam berbasis slot: pilih jam mulai dari grid (jam yang sudah terpesan
 * otomatis nonaktif), lalu pilih durasi — jam selesai dihitung otomatis. Slot
 * yang melewati booking lain berikutnya ikut dinonaktifkan, jadi rentang bentrok
 * tidak bisa dipilih sejak awal (bukan baru ketahuan setelah submit).
 */
export function TimeSlotPicker({ start, end, onChange, roomId, date, label, error }: Props) {
  const [customEnd, setCustomEnd] = useState(false);
  const { data, isLoading } = useDayAvailability(roomId, date);

  const open = toMin(OPERATING_HOURS.open);
  const close = toMin(OPERATING_HOURS.close);

  const booked = useMemo(
    () => (data?.booked_slots ?? []).map((s) => ({ from: toMin(s.start_time), to: toMin(s.end_time) })),
    [data]
  );

  const startOptions = useMemo(() => {
    const out: number[] = [];
    for (let t = open; t <= close - STEP_MINUTES; t += STEP_MINUTES) out.push(t);
    return out;
  }, [open, close]);

  /** Jam mulai tidak bisa dipilih kalau jatuh di dalam booking yang sudah ada. */
  const isStartBlocked = (min: number) => booked.some((b) => min >= b.from && min < b.to);

  /** Batas akhir yang masih bebas dari sebuah jam mulai: awal booking berikutnya, atau tutup. */
  const limitFrom = (startMin: number) => {
    const nextBooked = booked.filter((b) => b.from > startMin).map((b) => b.from);
    return nextBooked.length > 0 ? Math.min(...nextBooked, close) : close;
  };

  const startMin = start ? toMin(start) : null;
  const endMin = end ? toMin(end) : null;
  const maxEnd = startMin !== null ? limitFrom(startMin) : close;
  const selectedDuration = startMin !== null && endMin !== null ? endMin - startMin : null;

  const endOptions = useMemo(() => {
    if (startMin === null) return [];
    const out: number[] = [];
    for (let t = startMin + STEP_MINUTES; t <= maxEnd; t += STEP_MINUTES) out.push(t);
    return out;
  }, [startMin, maxEnd]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: number[] }[] = [];
    for (const min of startOptions) {
      const label = periodOf(min);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(min);
      else groups.push({ label, items: [min] });
    }
    return groups;
  }, [startOptions]);

  const pickStart = (min: number) => {
    setCustomEnd(false);
    // Jam selesai lama hampir pasti tidak lagi cocok dengan jam mulai yang baru — reset.
    onChange(toHM(min), '');
  };

  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-medium text-foreground block">{label}</label>}

      {roomId && date && <BookedSlotsTimeline date={date} roomId={roomId} />}

      {/* Ringkasan pilihan */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
          start && end ? 'border-primary/40 bg-primary/5 text-foreground' : 'text-muted-foreground'
        )}
      >
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
        {start && end ? (
          <span className="font-medium">
            {start} – {end}
            {selectedDuration ? <span className="font-normal text-muted-foreground"> · {durationLabel(selectedDuration)}</span> : null}
          </span>
        ) : start ? (
          <span>Mulai {start} — pilih durasi di bawah</span>
        ) : (
          <span>Pilih jam mulai</span>
        )}
      </div>

      {isLoading && roomId && date ? (
        <p className="text-xs text-muted-foreground">Memeriksa jam yang sudah terpesan...</p>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Jam mulai</p>
            {grouped.map((group) => (
              <div key={group.label}>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground/70">{group.label}</p>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                  {group.items.map((min) => {
                    const blocked = isStartBlocked(min);
                    const isSelected = startMin === min;
                    return (
                      <button
                        key={min}
                        type="button"
                        disabled={blocked}
                        onClick={() => pickStart(min)}
                        title={blocked ? 'Sudah terpesan' : undefined}
                        className={cn(
                          'rounded-md border px-1 py-1.5 text-xs font-medium transition-colors',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : blocked
                              ? 'cursor-not-allowed border-transparent bg-muted text-muted-foreground/40 line-through'
                              : 'border-input bg-background text-foreground hover:bg-accent'
                        )}
                      >
                        {toHM(min)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {startMin !== null && (
            <div className="space-y-2 rounded-lg border border-dashed p-3">
              <p className="text-xs font-medium text-muted-foreground">Durasi</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_DURATIONS.map((dur) => {
                  const fits = startMin + dur <= maxEnd;
                  const isSelected = !customEnd && selectedDuration === dur;
                  return (
                    <button
                      key={dur}
                      type="button"
                      disabled={!fits}
                      onClick={() => { setCustomEnd(false); onChange(toHM(startMin), toHM(startMin + dur)); }}
                      title={fits ? undefined : 'Bentrok dengan booking lain atau melewati jam operasional'}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : fits
                            ? 'border-input bg-background text-foreground hover:bg-accent'
                            : 'cursor-not-allowed border-transparent bg-muted text-muted-foreground/40'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {durationLabel(dur)}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCustomEnd((v) => !v)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    customEnd
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background text-foreground hover:bg-accent'
                  )}
                >
                  Lainnya
                </button>
              </div>

              {customEnd && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs font-medium text-muted-foreground">Jam selesai</p>
                  {endOptions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Tidak ada jam selesai yang tersedia dari jam mulai ini — pilih jam mulai lain.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                      {endOptions.map((min) => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => onChange(toHM(startMin), toHM(min))}
                          className={cn(
                            'rounded-md border px-1 py-1.5 text-xs font-medium transition-colors',
                            endMin === min
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-input bg-background text-foreground hover:bg-accent'
                          )}
                        >
                          {toHM(min)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
