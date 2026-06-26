'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useRoom } from '@/hooks/useRooms';
import { useCreateBooking } from '@/hooks/useBookings';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { TimeRangePicker } from '@/components/ui/time-range-picker';
import { CalendarDays, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { roomsApi } from '@/lib/api/rooms';

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const preDate = searchParams.get('date');

  const { data: room } = useRoom(roomId || '');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bookingDate, setBookingDate] = useState<Date | undefined>(preDate ? new Date(preDate + 'T00:00:00') : undefined);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [purposeType, setPurposeType] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState('');
  const [notes, setNotes] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const createBooking = useCreateBooking();

  useEffect(() => {
    if (preDate) setBookingDate(new Date(preDate + 'T00:00:00'));
  }, [preDate]);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!roomId || !bookingDate || !startTime || !endTime) {
        setIsAvailable(null);
        return;
      }
      setCheckingAvailability(true);
      try {
        const dateStr = format(bookingDate, 'yyyy-MM-dd');
        const res = await roomsApi.availability(roomId, dateStr, startTime, endTime);
        setIsAvailable(res.data.data.available);
      } catch {
        setIsAvailable(null);
      } finally {
        setCheckingAvailability(false);
      }
    };
    checkAvailability();
  }, [roomId, bookingDate, startTime, endTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !bookingDate) return;

    try {
      await createBooking.mutateAsync({
        room_id: roomId,
        title,
        description: description || undefined,
        booking_date: format(bookingDate, 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: endTime,
        purpose_type: purposeType || undefined,
        expected_attendees: expectedAttendees ? parseInt(expectedAttendees) : undefined,
        notes: notes || undefined,
      });
      router.push('/my-bookings');
    } catch {
      // handled by react-query + toast
    }
  };

  if (!roomId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Silakan pilih ruangan terlebih dahulu</p>
        <Link href="/rooms">
          <Button>Lihat Ruangan</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/rooms" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Booking Ruangan</h1>
        <p className="text-muted-foreground mt-1">Isi detail peminjaman ruangan</p>
      </div>

      {room && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{room.name}</p>
              <p className="text-sm text-muted-foreground">{room.category?.name} | Kapasitas: {room.capacity} orang</p>
            </div>
            <Badge variant="success">Tersedia</Badge>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Form Peminjaman</CardTitle>
          <CardDescription>Lengkapi data peminjaman ruangan</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="title"
              label="Judul Peminjaman *"
              placeholder="Contoh: Ibadah Keluarga"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Textarea
              id="description"
              label="Deskripsi"
              placeholder="Deskripsi kegiatan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <DatePicker
                  label="Tanggal *"
                  value={bookingDate}
                  onChange={setBookingDate}
                />
              </div>
              <div className="lg:col-span-2">
                <Select label="Tujuan Penggunaan" value={purposeType} onChange={(e) => setPurposeType(e.target.value)}>
                  <option value="">Pilih tujuan</option>
                  <option value="ibadah">Ibadah & Persekutuan</option>
                  <option value="acara_keluarga">Acara Keluarga</option>
                  <option value="latihan_musik">Latihan Musik</option>
                  <option value="pembinaan">Pembinaan</option>
                  <option value="rapat">Rapat Pelayanan</option>
                  <option value="seminar">Seminar & Training</option>
                  <option value="publik">Acara Publik</option>
                </Select>
              </div>
            </div>

            <TimeRangePicker
              label="Waktu Peminjaman *"
              start={startTime}
              end={endTime}
              onStartChange={setStartTime}
              onEndChange={setEndTime}
            />

            <Input
              id="expected_attendees"
              label="Perkiraan Peserta"
              type="number"
              min="1"
              placeholder="Jumlah peserta"
              value={expectedAttendees}
              onChange={(e) => setExpectedAttendees(e.target.value)}
            />

            {isAvailable !== null && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  isAvailable
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {checkingAvailability
                  ? 'Memeriksa ketersediaan...'
                  : isAvailable
                    ? 'Ruangan tersedia pada waktu tersebut'
                    : 'Ruangan tidak tersedia pada waktu tersebut'}
              </div>
            )}

            <Textarea
              id="notes"
              label="Catatan"
              placeholder="Catatan tambahan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />

            <div className="flex items-center gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
              <Button
                type="submit"
                loading={createBooking.isPending}
                disabled={!title || !bookingDate || !startTime || !endTime || isAvailable === false}
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Ajukan Booking
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
