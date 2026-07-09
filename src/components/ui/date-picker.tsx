'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as Popover from '@radix-ui/react-popover';
import { useRef } from 'react';

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: string;
  fromDate?: Date;
  toDate?: Date;
  placeholder?: string;
  error?: string;
}

export function DatePicker({
  value, onChange, label, fromDate, toDate,
  placeholder = 'Pilih tanggal', error,
}: DatePickerProps) {
  const openRef = useRef(false);

  const now = new Date();
  const clampedToday = fromDate && now < fromDate ? fromDate : toDate && now > toDate ? toDate : now;
  const isTodayOutOfRange = !!fromDate && now < fromDate;

  return (
    <div>
      {label && (
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          {label}
        </label>
      )}
      <Popover.Root onOpenChange={(o) => { openRef.current = o; }}>
        <Popover.Trigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
              error && 'border-destructive focus-visible:ring-destructive'
            )}
          >
            <CalendarDays className="w-4 h-4 mr-2 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {value ? format(value, 'EEEE, d MMMM yyyy', { locale: id }) : placeholder}
            </span>
            {value && (
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
              mode="single"
              selected={value}
              onSelect={(date) => {
                onChange(date);
              }}
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
                day_outside: 'text-muted-foreground/40',
                day_disabled: 'text-muted-foreground/30 cursor-not-allowed',
              }}
            />
            <div className="flex gap-1 mt-2 pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  onChange(clampedToday);
                }}
              >
                {isTodayOutOfRange ? 'Tanggal Terdekat' : 'Hari Ini'}
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive"
                  onClick={() => {
                    onChange(undefined);
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
