'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as Popover from '@radix-ui/react-popover';

export interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  label?: string;
  fromDate?: Date;
  toDate?: Date;
  placeholder?: string;
  error?: string;
}

export function DateRangePicker({
  value, onChange, label, fromDate, toDate,
  placeholder = 'Pilih rentang tanggal', error,
}: DateRangePickerProps) {
  const displayText = () => {
    if (!value?.from) return placeholder;
    if (!value.to) return `${format(value.from, 'd MMM yyyy', { locale: id })} — ...`;
    return `${format(value.from, 'd MMM yyyy', { locale: id })} — ${format(value.to, 'd MMM yyyy', { locale: id })}`;
  };

  return (
    <div>
      {label && (
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          {label}
        </label>
      )}
      <Popover.Root>
        <Popover.Trigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value?.from && 'text-muted-foreground',
              error && 'border-destructive focus-visible:ring-destructive'
            )}
          >
            <CalendarDays className="w-4 h-4 mr-2 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayText()}</span>
            {value?.from && (
              <span
                className="ml-auto p-0.5 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined);
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
            className="z-50 w-auto rounded-lg border bg-popover p-3 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          >
            <DayPicker
              mode="range"
              selected={value}
              onSelect={(range) => onChange(range)}
              locale={id}
              fromDate={fromDate}
              toDate={toDate}
              components={{
                IconLeft: () => <ChevronLeft className="w-4 h-4" />,
                IconRight: () => <ChevronRight className="w-4 h-4" />,
              }}
              classNames={{
                month: 'space-y-2',
                caption: 'flex justify-center relative items-center mb-2',
                caption_label: 'text-sm font-semibold text-foreground',
                nav: 'flex items-center justify-between absolute w-full',
                nav_button: 'h-7 w-7 bg-transparent p-0 text-muted-foreground hover:text-foreground',
                table: 'w-full border-collapse',
                head_row: 'flex w-full',
                head_cell: 'w-9 text-xs text-muted-foreground text-center font-medium',
                row: 'flex w-full mt-1',
                cell: 'w-9 h-9 text-sm text-center p-0 relative',
                day: 'w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent text-foreground cursor-pointer',
                day_today: 'font-bold text-primary',
                day_selected: 'bg-primary text-primary-foreground hover:bg-primary',
                day_range_middle: 'bg-primary/20 text-foreground rounded-none',
                day_range_end: 'bg-primary text-primary-foreground rounded-r-full',
                day_range_start: 'bg-primary text-primary-foreground rounded-l-full',
                day_outside: 'text-muted-foreground/40',
                day_disabled: 'text-muted-foreground/30 cursor-not-allowed',
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
