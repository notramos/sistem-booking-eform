'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TimelineItem {
  icon: ReactNode;
  title: string;
  description?: string | null;
  meta?: string | null;
  tone?: 'default' | 'success' | 'danger' | 'muted';
}

/** Timeline vertikal untuk riwayat aktivitas / status. */
export function ActivityTimeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>;
  }

  return (
    <div>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                  item.tone === 'success' && 'border-green-200 bg-green-50 text-green-600',
                  item.tone === 'danger' && 'border-red-200 bg-red-50 text-red-600',
                  item.tone === 'muted' && 'border-border bg-muted text-muted-foreground',
                  (!item.tone || item.tone === 'default') && 'border-primary/20 bg-primary/10 text-primary'
                )}
              >
                {item.icon}
              </div>
              {!isLast && <div className="my-1 w-px flex-1 bg-border" />}
            </div>
            <div className={cn('flex-1', !isLast && 'pb-5')}>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
              )}
              {item.meta && <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
