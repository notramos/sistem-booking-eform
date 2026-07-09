'use client';

import { useRef, useEffect, useState, useMemo, KeyboardEvent } from 'react';
import { Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as Popover from '@radix-ui/react-popover';

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const PERIODS: { label: string; test: (hour: number) => boolean }[] = [
  { label: 'Pagi', test: (h) => h >= 0 && h < 11 },
  { label: 'Siang', test: (h) => h >= 11 && h < 15 },
  { label: 'Sore', test: (h) => h >= 15 && h < 18 },
  { label: 'Malam', test: (h) => h >= 18 },
];

function periodFor(time: string): string {
  const hour = Number(time.slice(0, 2));
  return PERIODS.find((p) => p.test(hour))?.label ?? '';
}

function nearestTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(Math.floor(date.getMinutes() / 30) * 30).padStart(2, '0');
  return `${h}:${m}`;
}

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  /** Batasi daftar jam (mis. jam operasional 06:00–22:00). Format 'HH:MM'. */
  minTime?: string;
  maxTime?: string;
}

export function TimePicker({
  value, onChange, label, error,
  placeholder = 'Pilih jam',
  minTime, maxTime,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);

  const times = useMemo(
    () => TIMES.filter((t) => (!minTime || t >= minTime) && (!maxTime || t <= maxTime)),
    [minTime, maxTime]
  );

  return (
    <div>
      {label && (
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          {label}
        </label>
      )}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
              value && 'font-medium',
              open && 'ring-1 ring-ring',
              error && 'border-destructive focus-visible:ring-destructive'
            )}
          >
            <Clock className="w-4 h-4 mr-2 shrink-0 text-muted-foreground" />
            <span className="truncate">{value || placeholder}</span>
            {value && (
              <span
                role="button"
                aria-label="Hapus waktu"
                className="ml-auto p-0.5 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            align="start"
            sideOffset={4}
            className="z-50 w-44 rounded-lg border bg-popover p-2 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          >
            <p className="px-1 pb-1.5 text-xs font-medium text-muted-foreground">
              Pilih waktu
            </p>
            <TimeList
              values={times}
              selected={value}
              onSelect={(v) => {
                onChange(v);
                setOpen(false);
              }}
            />
            <div className="flex gap-1 mt-2 pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  let t = nearestTime(new Date());
                  if (minTime && t < minTime) t = minTime;
                  if (maxTime && t > maxTime) t = maxTime;
                  onChange(t);
                  setOpen(false);
                }}
              >
                Sekarang
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive"
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  Hapus
                </Button>
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}

function TimeList({
  values, selected, onSelect,
}: {
  values: string[];
  selected: string;
  onSelect: (val: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const nowTime = useMemo(() => nearestTime(new Date()), []);
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = values.indexOf(selected);
    return idx >= 0 ? idx : 0;
  });
  const typeaheadRef = useRef('');
  const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
  }, []);

  const grouped = useMemo(() => {
    const groups: { label: string; items: string[] }[] = [];
    for (const time of values) {
      const label = periodFor(time);
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.items.push(time);
      } else {
        groups.push({ label, items: [time] });
      }
    }
    return groups;
  }, [values]);

  const moveActive = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(values.length - 1, nextIndex));
    setActiveIndex(clamped);
    const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-index="${clamped}"]`);
    el?.scrollIntoView({ block: 'nearest' });
    el?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveActive(activeIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveActive(activeIndex - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      moveActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      moveActive(values.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(values[activeIndex]);
    } else if (/^[0-9]$/.test(e.key)) {
      typeaheadRef.current += e.key;
      clearTimeout(typeaheadTimer.current);
      typeaheadTimer.current = setTimeout(() => {
        typeaheadRef.current = '';
      }, 600);
      const query = typeaheadRef.current.padEnd(2, '0');
      const match = values.findIndex((t) => t.startsWith(query));
      if (match >= 0) moveActive(match);
    }
  };

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="Daftar waktu"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="h-60 overflow-y-auto space-y-0.5 py-1 pr-1 scrollbar-thin focus:outline-none"
    >
      {grouped.map((group) => (
        <div key={group.label}>
          <p className="sticky top-0 z-10 bg-popover px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
            {group.label}
          </p>
          {group.items.map((val) => {
            const index = values.indexOf(val);
            const isSelected = val === selected;
            const isNow = val === nowTime;
            return (
              <button
                key={val}
                data-index={index}
                ref={isSelected ? selectedRef : undefined}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                className={cn(
                  'w-full px-3 py-2 text-sm rounded-md text-center transition-colors focus:outline-none',
                  isSelected
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-foreground hover:bg-accent',
                  !isSelected && index === activeIndex && 'ring-1 ring-ring',
                  !isSelected && isNow && 'text-primary font-semibold'
                )}
                onClick={() => onSelect(val)}
                onFocus={() => setActiveIndex(index)}
              >
                {val}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
