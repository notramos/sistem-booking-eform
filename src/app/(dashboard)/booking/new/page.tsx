'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import { useRoom, useRoomRecommendations } from '@/hooks/useRooms';
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
import { Spinner } from '@/components/ui/spinner';
import { RoomRecommendationList } from '@/components/booking/RoomRecommendationList';
import { BookedSlotsTimeline } from '@/components/booking/BookedSlotsTimeline';
import { OPERATING_HOURS, BOOKING_MIN_ADVANCE_DAYS, BOOKING_MAX_ADVANCE_DAYS } from '@/lib/constants';
import { CalendarDays, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { roomsApi } from '@/lib/api/rooms';

function dateBounds() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const min = new Date(t);
  min.setDate(min.getDate() + BOOKING_MIN_ADVANCE_DAYS);
  const max = new Date(t);
  max.setDate(max.getDate() + BOOKING_MAX_ADVANCE_DAYS);
  return { min, max };
}

const bookingSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(255),
  description: z.string().optional(),
  bookingDate: z.date({ message: 'Tanggal wajib dipilih' }).superRefine((date, ctx) => {
    const { min, max } = dateBounds();
    if (date < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Booking minimal H+${BOOKING_MIN_ADVANCE_DAYS} (paling cepat ${format(min, 'd MMM yyyy', { locale: idLocale })})`,
      });
    }
    if (date > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Tanggal maksimal H+${BOOKING_MAX_ADVANCE_DAYS} dari hari ini`,
      });
    }
  }),
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
  const preDate = searchParams.get('date');
  const preRoomId = searchParams.get('roomId'); // dukungan link legacy

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(preRoomId);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const createBooking = useCreateBooking();

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
  const watchedAttendees = watch('expectedAttendees');

  const debouncedStart = useDebounce(watchedStart, 500);
  const debouncedEnd = useDebounce(watchedEnd, 500);

  const attendeesNum = parseInt(watchedAttendees || '0', 10) || 0;
  const debouncedAttendees = useDebounce(attendeesNum, 500);

  const dateStr = watchedDate ? format(watchedDate, 'yyyy-MM-dd') : undefined;

  // Batas tanggal yang boleh dipesan (H+7 s/d H+30), mengikuti backend.
  const { min: minDate, max: maxDate } = useMemo(() => dateBounds(), []);

  const { data: recommendations, isFetching: loadingRecommendations } = useRoomRecommendations(dateStr, debouncedAttendees);
  const { data: selectedRoom } = useRoom(selectedRoomId || '');

  const overCapacity = !!selectedRoom && attendeesNum > 0 && attendeesNum > selectedRoom.capacity;

  // Redirect ke kalender bila tak ada konteks tanggal maupun ruangan.
  useEffect(() => {
    if (!preDate && !preRoomId) {
      router.replace('/booking/calendar');
    }
  }, [preDate, preRoomId, router]);

  useEffect(() => {
    if (!preDate) return;
    const parsed = new Date(preDate + 'T00:00:00');
    const clamped = parsed < minDate ? minDate : parsed > maxDate ? maxDate : parsed;
    setValue('bookingDate', clamped);
    if (clamped.getTime() !== parsed.getTime()) {
      toast.info(`Tanggal pada tautan di luar rentang pemesanan, disesuaikan ke ${format(clamped, 'd MMMM yyyy', { locale: idLocale })}.`);
    }
  }, [preDate, minDate, maxDate, setValue]);

  // Reset status ketersediaan saat ruangan/tanggal berganti.
  useEffect(() => {
    setIsAvailable(null);
  }, [selectedRoomId, dateStr]);

  useEffect(() => {
    const check = async () => {
      if (!selectedRoomId || !watchedDate || !debouncedStart || !debouncedEnd) {
        setIsAvailable(null);
        return;
      }
      setCheckingAvailability(true);
      try {
        const res = await roomsApi.availability(selectedRoomId, format(watchedDate, 'yyyy-MM-dd'), debouncedStart, debouncedEnd);
        setIsAvailable(res.data.data.available);
      } catch {
        setIsAvailable(null);
      } finally {
        setCheckingAvailability(false);
      }
    };
    check();
  }, [selectedRoomId, watchedDate, debouncedStart, debouncedEnd]);

  const onSubmit = async (data: BookingForm) => {
    if (!selectedRoomId) return;
    await createBooking.mutateAsync({
      room_id: selectedRoomId,
      title: data.title,
      description: data.description || undefined,
      booking_date: format(data.bookingDate, 'yyyy-MM-dd'),
      start_time: data.startTime,
      end_time: data.endTime,
      purpose_type: data.purposeType || undefined,
      expected_attendees: attendeesNum || undefined,
      notes: data.notes || undefined,
    });
    router.push('/my-bookings');
  };

  return (
    <div className="space-y-6">
      <Link href="/booking/calendar" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Kalender
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Booking Ruangan</h1>
        <p className="text-muted-foreground mt-1">Isi detail kegiatan, lalu pilih ruangan yang sesuai jumlah peserta</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 1. Detail kegiatan */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Kegiatan</CardTitle>
            <CardDescription>Judul, tanggal, dan tujuan peminjaman</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input id="title" label="Judul Peminjaman *" placeholder="Contoh: Ibadah Keluarga" {...register('title')} />
              {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
            </div>

            <Textarea id="description" label="Deskripsi" placeholder="Deskripsi kegiatan..." rows={3} {...register('description')} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Controller
                  name="bookingDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker label="Tanggal *" value={field.value} onChange={field.onChange} fromDate={minDate} toDate={maxDate} />
                  )}
                />
                {errors.bookingDate && <p className="text-destructive text-xs mt-1">{errors.bookingDate.message}</p>}
              </div>
              <div>
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
          </CardContent>
        </Card>

        {/* 2. Jumlah peserta → rekomendasi ruangan */}
        <Card>
          <CardHeader>
            <CardTitle>Ruangan</CardTitle>
            <CardDescription>Masukkan jumlah peserta untuk melihat rekomendasi ruangan yang sesuai</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="expected_attendees"
              label="Perkiraan Jumlah Peserta *"
              type="number"
              min="1"
              placeholder="Jumlah peserta"
              {...register('expectedAttendees')}
            />

            {attendeesNum > 0 && dateStr ? (
              <RoomRecommendationList
                items={recommendations ?? []}
                attendees={attendeesNum}
                selectedRoomId={selectedRoomId}
                onSelect={setSelectedRoomId}
                loading={loadingRecommendations}
              />
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                Isi jumlah peserta terlebih dahulu untuk melihat rekomendasi ruangan.
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Jam & ketersediaan (muncul setelah ruangan dipilih) */}
        {selectedRoomId && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>Waktu Peminjaman</CardTitle>
                  <CardDescription>Jam terpesan ditandai merah, slot hijau masih tersedia (06:00–22:00)</CardDescription>
                </div>
                {selectedRoom && (
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <Users className="w-3 h-3" /> {selectedRoom.name} · {selectedRoom.capacity} org
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {dateStr && (
                <BookedSlotsTimeline
                  date={dateStr}
                  roomId={selectedRoomId}
                  onPickSlot={(start, end) => {
                    setValue('startTime', start);
                    setValue('endTime', end);
                  }}
                />
              )}

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
                        minTime={OPERATING_HOURS.open}
                        maxTime={OPERATING_HOURS.close}
                      />
                    )}
                  />
                )}
              />

              {overCapacity && (
                <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
                  Jumlah peserta ({attendeesNum}) melebihi kapasitas ruangan ({selectedRoom?.capacity} orang). Pilih ruangan lain.
                </div>
              )}

              {isAvailable !== null && !checkingAvailability && (
                <div className={`p-3 rounded-lg text-sm ${isAvailable ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {isAvailable ? 'Ruangan tersedia pada waktu tersebut' : 'Ruangan tidak tersedia pada waktu tersebut'}
                </div>
              )}
              {checkingAvailability && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Spinner size="sm" /> Memeriksa ketersediaan...
                </p>
              )}

              <Textarea id="notes" label="Catatan" placeholder="Catatan tambahan..." rows={2} {...register('notes')} />
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/booking/calendar')}>Batal</Button>
          <Button
            type="submit"
            loading={createBooking.isPending}
            disabled={!selectedRoomId || isAvailable === false || checkingAvailability || overCapacity}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Ajukan Booking
          </Button>
        </div>
      </form>
    </div>
  );
}
