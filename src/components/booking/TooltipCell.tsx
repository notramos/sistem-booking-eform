'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import type { CalendarEvent } from '@/types';

/** Chip event pada sel kalender (bar berwarna + label singkat), menampilkan detail saat hover/klik. */
export function TooltipCell({ event }: { event: CalendarEvent }) {
  const [show, setShow] = useState(false);
  const color = event.backgroundColor || 'hsl(var(--muted-foreground))';

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div
        className="flex items-center gap-1 rounded px-1 py-0.5 cursor-pointer hover:brightness-95 dark:hover:brightness-125 transition-[filter]"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)` }}
        onClick={(e) => {
          e.stopPropagation();
          setShow((prev) => !prev);
        }}
      >
        <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden />
        <span className="text-[10px] font-medium leading-tight truncate" style={{ color }}>
          {event.start_time} {event.title}
        </span>
      </div>
      {show && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 min-w-[180px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-popover text-popover-foreground rounded-lg border shadow-lg p-3 text-xs space-y-1.5">
            <p className="font-semibold text-sm">{event.title}</p>
            <p className="text-muted-foreground">
              {event.start_time} - {event.end_time}
            </p>
            <p className="text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {event.room}
            </p>
            <Badge className={getStatusColor(event.status)}>
              {event.extendedProps?.status_label ?? getStatusLabel(event.status)}
            </Badge>
            <Link
              href={`/booking/${event.booking_id ?? event.id}`}
              className="block text-center text-primary hover:underline pt-1"
            >
              Lihat Detail
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
