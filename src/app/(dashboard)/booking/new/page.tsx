'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useRoom } from '@/hooks/useRooms';
import { useCreateBooking } from '@/hooks/useBookings';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { TimeRangePicker } from '@/components/ui/time-range-picker';
import { CalendarDays, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { roomsApi } from '@/lib/api/rooms';

const bookingSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(255),
  description: z.string().optional(),
  bookingDate: z.date({ required_error: 'Tanggal wajib dipilih' }),
  startTime: z.string().min(1, 'Waktu mulai wajib diisi'),
  endTime: z.string().min(1, 'Waktu selesai wajib diisi'),
  purposeType: z.string().optional(),
  expectedAttendees: z.string().optional(),
  notes: z.string().optional(),
});
type BookingForm = z.infer<typeof bookingSchema>;

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const preDate = searchParams.get('date');

  const { data: room } = useRoom(roomId || '');
  const createBooking = useCreateBooking();

  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      startTime: '09:00',
      endTime: '10:00',
      bookingDate: preDate ? new Date(preDate + 'T00:00:00') : undefined,
    },
  });

  const watchedDate = watch('bookingDate');
  const watchedStart = watch('startTime');
  const watchedEnd = watch('endTime');

  const debouncedStart = useDebounce(watchedStart, 500);
  const debouncedEnd = useDebounce(watchedEnd, 500);

  useEffect(() => {
    if (preDate) setValue('bookingDate', new Date(preDate + 'T00:00:00'));
  }, [preDate, setValue]);

  useEffect(() => {
    const check = async () => {
      if (!roomId || !watchedDate || !debouncedStart || !debouncedEnd) {
        setIsAvailable(null);
        return;
      }
      setCheckingAvailability(true);
      try {
        const res = await roomsApi.availability(roomId, format(watchedDate, 'yyyy-MM-dd'), debouncedStart, debouncedEnd);
        setIsAvailable(res.data.data.available);
      } catch {
        setIsAvailable(null);
      } finally {
        setCheckingAvailability(false);
      }
    };
    check();
  }, [roomId, watchedDate, debouncedStart, debouncedEnd]);

  const onSubmit = async (data: BookingForm) => {
    if (!roomId) return;
    await createBooking.mutateAsync({
      room_id: roomId,
      title: data.title,
      description: data.description || undefined,
      booking_date: format(data.bookingDate, 'yyyy-MM-dd'),
      start_time: data.startTime,
      end_time: data.endTime,
      purpose_type: data.purposeType || undefined,
      expected_attendees: data.expectedAttendees ? parseInt(data.expectedAttendees) : undefined,
      notes: data.notes || undefined,
    });
    router.push('/my-bookings');
  };

  if (!roomId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Silakan pilih ruangan terlebih dahulu</p>
        <Link href="/rooms"><Button>Lihat Ruangan</Button></Link>
      </div>
    );
  }

  const roomBadge = () => {
    if (checkingAvailability) return <Badge variant="secondary"><Loader2 className="w-3 h-3 animate-spin mr-1" />Memeriksa...</Badge>;
    if (isAvailable === true) return <Badge variant="success">Tersedia</Badge>;
    if (isAvailable === false) return <Badge variant="destructive">Tidak Tersedia</Badge>;
    return <Badge variant="secondary">{room?.status === 'available' ? 'Tersedia' : 'Tidak Tersedia'}</Badge>;
  };

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
            {roomBadge()}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Form Peminjaman</CardTitle>
          <CardDescription>Lengkapi data peminjaman ruangan</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input id="title" label="Judul Peminjaman *" placeholder="Contoh: Ibadah Keluarga" {...register('title')} />
              {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
            </div>

            <Textarea id="description" label="Deskripsi" placeholder="Deskripsi kegiatan..." rows={3} {...register('description')} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <Controller
                  name="bookingDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker label="Tanggal *" value={field.value} onChange={field.onChange} />
                  )}
                />
                {errors.bookingDate && <p className="text-destructive text-xs mt-1">{errors.bookingDate.message}</p>}
              </div>
              <div className="lg:col-span-2">
                <Select label="Tujuan Penggunaan" {...register('purposeType')}>
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

            <Controller
              name="startTime"
              control={control}
              render={({ field: startField }) => (
                <Controller
                  name="endTime"
                  control={control}
                  render={({ field: endField }) => (
                    <TimeRangePicker
                      label="Waktu Peminjaman *"
                      start={startField.value}
                      end={endField.value}
                      onStartChange={startField.onChange}
                      onEndChange={endField.onChange}
                    />
                  )}
                />
              )}
            />

            <Input id="expected_attendees" label="Perkiraan Peserta" type="number" min="1" placeholder="Jumlah peserta" {...register('expectedAttendees')} />

            {isAvailable !== null && !checkingAvailability && (
              <div className={`p-3 rounded-lg text-sm ${isAvailable ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {isAvailable ? 'Ruangan tersedia pada waktu tersebut' : 'Ruangan tidak tersedia pada waktu tersebut'}
              </div>
            )}

            <Textarea id="notes" label="Catatan" placeholder="Catatan tambahan..." rows={2} {...register('notes')} />

            <div className="flex items-center gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
              <Button
                type="submit"
                loading={createBooking.isPending}
                disabled={isAvailable === false || checkingAvailability}
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
