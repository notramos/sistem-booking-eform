'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

interface TimePickerDropdownProps {
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
}

function TimePickerDropdown({ value, onChange, onClose }: TimePickerDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hour, minute] = value.split(':');

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute z-50 mt-1 bg-popover border rounded-lg shadow-lg p-2 flex gap-1">
      <div className="h-48 overflow-y-auto space-y-0.5 pr-1">
        {HOURS.map((h) => (
          <button
            key={h}
            type="button"
            className={`w-14 px-2 py-1 text-sm rounded text-center hover:bg-accent ${
              h === hour ? 'bg-primary text-primary-foreground hover:bg-primary' : 'text-foreground'
            }`}
            onClick={() => onChange(`${h}:${minute}`)}
          >
            {h}
          </button>
        ))}
      </div>
      <span className="flex items-center text-foreground font-medium text-sm pt-20">:</span>
      <div className="h-48 overflow-y-auto space-y-0.5 pl-1">
        {MINUTES.map((m) => (
          <button
            key={m}
            type="button"
            className={`w-14 px-2 py-1 text-sm rounded text-center hover:bg-accent ${
              m === minute ? 'bg-primary text-primary-foreground hover:bg-primary' : 'text-foreground'
            }`}
            onClick={() => onChange(`${hour}:${m}`)}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

interface TimeRangePickerProps {
  start: string;
  end: string;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
  label?: string;
}

export function TimeRangePicker({ start, end, onStartChange, onEndChange, label }: TimeRangePickerProps) {
  const [openField, setOpenField] = useState<'start' | 'end' | null>(null);

  return (
    <div>
      {label && <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal"
            onClick={() => setOpenField(openField === 'start' ? null : 'start')}
          >
            <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
            {start}
          </Button>
          {openField === 'start' && (
            <TimePickerDropdown
              value={start}
              onChange={onStartChange}
              onClose={() => setOpenField(null)}
            />
          )}
        </div>
        <span className="text-muted-foreground text-sm">—</span>
        <div className="relative flex-1">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal"
            onClick={() => setOpenField(openField === 'end' ? null : 'end')}
          >
            <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
            {end}
          </Button>
          {openField === 'end' && (
            <TimePickerDropdown
              value={end}
              onChange={onEndChange}
              onClose={() => setOpenField(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
