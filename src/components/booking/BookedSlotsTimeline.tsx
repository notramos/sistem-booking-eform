'use client';

import { useDayAvailability } from '@/hooks/useRooms';
import { OPERATING_HOURS } from '@/lib/constants';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

function toMin(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

interface Props {
  date: string;
  roomId: string;
  /** Dipanggil saat user mengklik slot bebas untuk mengisi jam. */
  onPickSlot?: (start: string, end: string) => void;
  selectedStart?: string;
  selectedEnd?: string;
}

/**
 * Timeline horizontal jam operasional (06:00–22:00) menampilkan blok terpesan
 * (merah) dan slot bebas (hijau, dapat diklik) untuk satu ruangan pada satu tanggal.
 */
export function BookedSlotsTimeline({ date, roomId, onPickSlot, selectedStart, selectedEnd }: Props) {
  const { data, isLoading } = useDayAvailability(roomId, date);

  const open = toMin(OPERATING_HOURS.open);
  const close = toMin(OPERATING_HOURS.close);

  if (isLoading) return <Spinner center />;
  if (!data) return null;

  const step = 30;
  const segments: number[] = [];
  for (let t = open; t < close; t += step) segments.push(t);
  const isBooked = (from: number, to: number) =>
    data.booked_slots.some((s) => from < toMin(s.end_time) && to > toMin(s.start_time));
  const isFree = (from: number, to: number) =>
    data.free_slots.some((s) => from >= toMin(s.start_time) && to <= toMin(s.end_time));
  const formatTime = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  const selectedFrom = selectedStart ? toMin(selectedStart) : null;
  const selectedTo = selectedEnd ? toMin(selectedEnd) : null;

  return (
    <div className="space-y-2">
      <div className="relative h-14 overflow-hidden rounded-md border border-border bg-muted/30">
        <div className="absolute inset-0 flex">
          {segments.map((from) => {
            const to = from + step;
            const booked = isBooked(from, to);
            const free = !booked && isFree(from, to);
            const selected = selectedFrom !== null && selectedTo !== null && from >= selectedFrom && to <= selectedTo;
            const label = formatTime(from);
            return (
              <button
                key={`segment-${from}`}
                type="button"
                disabled={!free || !onPickSlot}
                onClick={() => onPickSlot?.(label, formatTime(to))}
                title={booked ? `Terpesan pada ${label}` : free ? `Pilih mulai ${label}` : `Tidak tersedia ${label}`}
                aria-label={booked ? `Terpesan pada ${label}` : free ? `Pilih mulai ${label}` : `Tidak tersedia ${label}`}
                className={cn(
                  'relative h-full min-w-0 flex-1 border-r border-border/70 transition-colors',
                  booked && 'cursor-not-allowed bg-red-400/80',
                  !booked && !free && 'cursor-not-allowed bg-muted/60',
                  free && !selected && 'cursor-pointer bg-green-200/75 hover:bg-green-400/80 hover:ring-2 hover:ring-inset hover:ring-green-600',
                  selected && 'z-10 cursor-pointer bg-primary/80 text-primary-foreground ring-2 ring-inset ring-primary'
                )}
              >
                {booked && from % 60 === 0 && <span className="pointer-events-none absolute inset-x-0 top-1 text-center text-[9px] font-medium text-white">Terpesan</span>}
                {free && selected && <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold">✓</span>}
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex">
          {segments.map((from) => (
            <span key={`label-${from}`} className="relative min-w-0 flex-1 text-[9px] text-muted-foreground">
              {from % 60 === 0 ? <span className="absolute left-1 bottom-0">{formatTime(from)}</span> : null}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-200 inline-block" /> Tersedia (30 menit)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Terpesan
        </span>
        {onPickSlot && data.free_slots.length > 0 && (
          <span className="ml-auto italic">Klik slot hijau untuk mengisi jam</span>
        )}
      </div>

      {data.booked_slots.length > 0 && (
        <div className="space-y-1.5 rounded-lg border bg-muted/20 p-2.5">
          <p className="text-xs font-medium text-foreground">Jadwal lain pada tanggal ini</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {data.booked_slots.map((slot, index) => (
              <div key={`booking-info-${index}`} className="flex items-center justify-between gap-2 rounded-md bg-background px-2.5 py-1.5 text-xs">
                <span className="truncate text-muted-foreground">{slot.title ?? 'Terpakai'}</span>
                <span className="shrink-0 font-medium text-foreground">{slot.start_time}–{slot.end_time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
