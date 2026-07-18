'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { PencilLine } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { TimeRangePicker } from '@/components/ui/time-range-picker';
import { Button } from '@/components/ui/button';
import { OPERATING_HOURS } from '@/lib/constants';
import { useRooms } from '@/hooks/useRooms';
import { useUpdateBooking } from '@/hooks/useBookings';
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

        <DatePicker label="Tanggal" value={date} onChange={setDate} />

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
