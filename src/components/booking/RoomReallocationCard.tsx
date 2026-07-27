'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { PencilLine } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { TimeRangePicker } from '@/components/ui/time-range-picker';
import { Button } from '@/components/ui/button';
import { OPERATING_HOURS, BOOKING_MIN_ADVANCE_DAYS } from '@/lib/constants';
import { useRooms, useDayAvailability } from '@/hooks/useRooms';
import { useUpdateBooking } from '@/hooks/useBookings';
import { formatTime, getMaxBookableDate } from '@/lib/utils';
import { Info } from 'lucide-react';
import type { Booking } from '@/types';

/**
 * Form realokasi ruangan/waktu untuk sekretariat saat booking berstatus
 * sekretariat_review. Sengaja sederhana (dropdown ruangan langsung, bukan
 * rekomendasi kapasitas) — itu untuk jemaat di form pengajuan, staf di sini
 * biasanya sudah tahu ruangan mana yang ingin dipakai.
 */
export function RoomReallocationCard({ booking }: { booking: Booking }) {
  const { data: roomsData } = useRooms({ per_page: 100 });
  const updateBooking = useUpdateBooking();

  const [roomId, setRoomId] = useState(booking.room_id);
  const [date, setDate] = useState<Date | undefined>(new Date(booking.booking_date + 'T00:00:00'));
  const [startTime, setStartTime] = useState(booking.start_time.substring(0, 5));
  const [endTime, setEndTime] = useState(booking.end_time.substring(0, 5));

  const rooms = roomsData?.data ?? [];

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + BOOKING_MIN_ADVANCE_DAYS);

  const dateStr = date ? format(date, 'yyyy-MM-dd') : undefined;
  const { data: dayAvailability } = useDayAvailability(roomId, dateStr);
  const bookedSlots = dayAvailability?.booked_slots ?? [];

  const hasChanges = roomId !== booking.room_id
    || (date && format(date, 'yyyy-MM-dd') !== booking.booking_date)
    || startTime !== booking.start_time.substring(0, 5)
    || endTime !== booking.end_time.substring(0, 5);

  const handleSave = () => {
    if (!date) return;
    updateBooking.mutate({
      id: booking.id,
      data: {
        room_id: roomId,
        booking_date: format(date, 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: endTime,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <PencilLine className="h-5 w-5 text-primary" /> Realokasi Ruangan / Waktu
        </CardTitle>
        <CardDescription>Ubah ruangan atau jadwal sebelum diteruskan ke tahap Admin, bila diperlukan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select label="Ruangan" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>{room.name} · {room.capacity} orang</option>
          ))}
        </Select>

        <DatePicker label="Tanggal" value={date} onChange={setDate} fromDate={minDate} toDate={getMaxBookableDate()} />

        {dateStr && bookedSlots.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground mb-1">Sudah ada booking di ruangan ini pada tanggal tersebut:</p>
              <ul className="space-y-0.5">
                {bookedSlots.map((slot, i) => (
                  <li key={i}>
                    {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                    {slot.title && <span className="text-muted-foreground/70"> · {slot.title}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <TimeRangePicker
          label="Waktu"
          start={startTime}
          end={endTime}
          onStartChange={setStartTime}
          onEndChange={setEndTime}
          minTime={OPERATING_HOURS.open}
          maxTime={OPERATING_HOURS.close}
        />

        <Button onClick={handleSave} disabled={!hasChanges} loading={updateBooking.isPending}>
          Simpan Perubahan
        </Button>
      </CardContent>
    </Card>
  );
}
