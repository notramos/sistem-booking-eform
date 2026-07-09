'use client';

import { TimePicker } from '@/components/ui/time-picker';

interface TimeRangePickerProps {
  start: string;
  end: string;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
  label?: string;
  startError?: string;
  endError?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  /** Batasi kedua picker ke rentang jam operasional. Format 'HH:MM'. */
  minTime?: string;
  maxTime?: string;
}

export function TimeRangePicker({
  start, end, onStartChange, onEndChange, label,
  startError, endError,
  startPlaceholder, endPlaceholder,
  minTime, maxTime,
}: TimeRangePickerProps) {
  return (
    <div>
      {label && (
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TimePicker
            value={start}
            onChange={onStartChange}
            placeholder={startPlaceholder || 'Mulai'}
            error={startError}
            minTime={minTime}
            maxTime={maxTime}
          />
        </div>
        <span className="text-muted-foreground text-sm shrink-0 mt-1.5">—</span>
        <div className="flex-1">
          <TimePicker
            value={end}
            onChange={onEndChange}
            placeholder={endPlaceholder || 'Selesai'}
            error={endError}
            minTime={minTime}
            maxTime={maxTime}
          />
        </div>
      </div>
    </div>
  );
}
