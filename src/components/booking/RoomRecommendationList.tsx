'use client';

import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Users, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoomRecommendation } from '@/types';

interface Props {
  items: RoomRecommendation[];
  attendees: number;
  selectedRoomId: string | null;
  onSelect: (roomId: string) => void;
  loading?: boolean;
}

export function RoomRecommendationList({ items, attendees, selectedRoomId, onSelect, loading }: Props) {
  if (loading) {
    return <Spinner center label="Mencari ruangan..." />;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
        Tidak ada ruangan dengan kapasitas ≥ {attendees} orang.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item, index) => {
        const room = item.room;
        const isSelected = selectedRoomId === room.id;
        const isTopPick = index === 0 && item.has_free_slot;

        return (
          <button
            key={room.id}
            type="button"
            onClick={() => onSelect(room.id)}
            aria-pressed={isSelected}
            className={cn(
              'text-left rounded-lg border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isSelected ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border hover:border-primary/50',
              item.fully_booked && 'opacity-70'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{room.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {room.category?.name}
                  {room.building ? ` · ${room.building}` : ''}
                </p>
              </div>
              {isSelected && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
            </div>

            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" /> Kapasitas {room.capacity} orang
            </div>

            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {isTopPick && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="w-3 h-3" /> Rekomendasi terbaik
                </Badge>
              )}
              {item.has_free_slot ? (
                <Badge variant="success">Tersedia</Badge>
              ) : (
                <Badge variant="destructive">Penuh hari ini</Badge>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
