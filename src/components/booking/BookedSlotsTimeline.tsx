'use client';

import { useDayAvailability } from '@/hooks/useRooms';
import { OPERATING_HOURS } from '@/lib/constants';
import { Spinner } from '@/components/ui/spinner';

function toMin(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

interface Props {
  date: string;
  roomId: string;
  /** Dipanggil saat user mengklik slot bebas untuk mengisi jam. */
  onPickSlot?: (start: string, end: string) => void;
}

/**
 * Timeline horizontal jam operasional (06:00–22:00) menampilkan blok terpesan
 * (merah) dan slot bebas (hijau, dapat diklik) untuk satu ruangan pada satu tanggal.
 */
export function BookedSlotsTimeline({ date, roomId, onPickSlot }: Props) {
  const { data, isLoading } = useDayAvailability(roomId, date);

  const open = toMin(OPERATING_HOURS.open);
  const close = toMin(OPERATING_HOURS.close);
  const span = close - open;

  if (isLoading) return <Spinner center />;
  if (!data) return null;

  const pct = (min: number) => ((min - open) / span) * 100;

  const ticks: number[] = [];
  for (let t = open; t <= close; t += 120) ticks.push(t);

  return (
    <div className="space-y-2">
      <div className="relative h-10 rounded-md bg-green-50 border border-border overflow-hidden">
        {data.free_slots.map((s, i) => {
          const left = pct(toMin(s.start_time));
          const width = pct(toMin(s.end_time)) - left;
          return (
            <button
              key={`free-${i}`}
              type="button"
              onClick={() => onPickSlot?.(s.start_time, s.end_time)}
              title={`Tersedia ${s.start_time}–${s.end_time}`}
              className="absolute top-0 h-full bg-green-200/70 hover:bg-green-300 transition-colors"
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}
        {data.booked_slots.map((s, i) => {
          const left = pct(toMin(s.start_time));
          const width = pct(toMin(s.end_time)) - left;
          return (
            <div
              key={`booked-${i}`}
              title={`${s.title ?? 'Terpesan'} (${s.start_time}–${s.end_time})`}
              className="absolute top-0 h-full bg-red-400/80 border-x border-red-500 flex items-center overflow-hidden"
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              <span className="text-[9px] text-white font-medium truncate px-1">{s.start_time}</span>
            </div>
          );
        })}
      </div>

      <div className="relative h-4">
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute -translate-x-1/2 text-[10px] text-muted-foreground"
            style={{ left: `${pct(t)}%` }}
          >
            {String(Math.floor(t / 60)).padStart(2, '0')}:00
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-200 inline-block" /> Tersedia
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Terpesan
        </span>
        {onPickSlot && data.free_slots.length > 0 && (
          <span className="ml-auto italic">Klik slot hijau untuk mengisi jam</span>
        )}
      </div>
    </div>
  );
}
