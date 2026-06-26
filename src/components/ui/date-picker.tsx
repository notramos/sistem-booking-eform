'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { id } from 'date-fns/locale';
import { format } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: string;
  fromDate?: Date;
}

export function DatePicker({ value, onChange, label, fromDate }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div>
      {label && <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>}
      <div className="relative" ref={ref}>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-left font-normal"
          onClick={() => setOpen(!open)}
        >
          <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
          {value ? format(value, 'EEEE, d MMMM yyyy', { locale: id }) : 'Pilih tanggal'}
        </Button>
        {value && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
            onClick={() => onChange(undefined)}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {open && (
          <div className="absolute z-50 mt-1 bg-popover border rounded-lg shadow-lg p-3">
            <DayPicker
              mode="single"
              selected={value}
              onSelect={(date) => {
                onChange(date);
                setOpen(false);
              }}
              locale={id}
              fromDate={fromDate ?? new Date()}
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
                  onChange(new Date());
                  setOpen(false);
                }}
              >
                Hari Ini
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive"
                  onClick={() => {
                    onChange(undefined);
                    setOpen(false);
                  }}
                >
                  Hapus
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
