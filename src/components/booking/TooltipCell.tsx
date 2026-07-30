'use client';

import Link from 'next/link';
import * as Popover from '@radix-ui/react-popover';
import { Badge } from '@/components/ui/badge';
import { MapPin, User as UserIcon, Repeat } from 'lucide-react';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import type { CalendarEvent } from '@/types';

/**
 * Chip event pada sel kalender (bar berwarna + label singkat), menampilkan
 * detail saat diklik. Memakai Radix Popover — bukan posisi absolut manual —
 * supaya popover tidak terpotong di baris teratas/tepi grid, tertutup saat
 * klik di luar, dan hanya satu yang terbuka pada satu waktu.
 */
export function TooltipCell({ event }: { event: CalendarEvent }) {
  const color = event.backgroundColor || 'hsl(var(--muted-foreground))';
  const isRecurring = event.extendedProps?.is_recurring;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <div
          className="flex items-center gap-1 rounded px-1 py-0.5 cursor-pointer hover:brightness-95 dark:hover:brightness-125 transition-[filter]"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)` }}
          // Jangan sampai klik chip ikut membuka Sheet agenda milik sel tanggalnya.
          onClick={(e) => e.stopPropagation()}
        >
          <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden />
          <span className="text-[10px] font-medium leading-tight truncate" style={{ color }}>
            {event.start_time} {event.title}
          </span>
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="center"
          sideOffset={6}
          collisionPadding={8}
          onClick={(e) => e.stopPropagation()}
          className="z-50 min-w-[200px] max-w-[260px] rounded-lg border bg-popover p-3 text-xs text-popover-foreground shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm">{event.title}</p>
              {isRecurring && (
                <Badge variant="outline" className="gap-1 shrink-0 text-[10px]">
                  <Repeat className="w-2.5 h-2.5" /> Rutin
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {event.start_time} - {event.end_time}
            </p>
            <p className="text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" /> {event.room}
            </p>
            {event.user && (
              <p className="text-muted-foreground flex items-center gap-1">
                <UserIcon className="w-3 h-3 shrink-0" /> {event.user}
              </p>
            )}
            {event.extendedProps?.description && (
              <p className="text-muted-foreground line-clamp-3">{event.extendedProps.description}</p>
            )}
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
          <Popover.Arrow className="fill-popover" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
