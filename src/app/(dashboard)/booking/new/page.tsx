'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import { useRoom, useRoomRecommendations } from '@/hooks/useRooms';
import { useCreateBooking, useCreateRecurringBooking, usePreviewRecurringBooking, useBooking, useUpdateBooking } from '@/hooks/useBookings';
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
import { Checkbox } from '@/components/ui/checkbox';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { RoomRecommendationList } from '@/components/booking/RoomRecommendationList';
import { BookedSlotsTimeline } from '@/components/booking/BookedSlotsTimeline';
import { OPERATING_HOURS, BOOKING_MIN_ADVANCE_DAYS, BOOKING_MAX_ADVANCE_DAYS, RECURRING_DURATION_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { CalendarDays, ArrowLeft, Users, Repeat, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { roomsApi } from '@/lib/api/rooms';

const BOOKING_TYPE_OPTIONS = [
  { value: 'reguler', label: 'Tidak Rutin' },
  { value: 'rutin', label: 'Rutin' },
];

const PATTERN_OPTIONS = [
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
];

interface RecurringDateEntry {
  date: string;
  available: boolean;
  reason: 'conflict' | 'maintenance' | null;
  /** Tanggal pengganti yang SUDAH dikonfirmasi tersedia — dipakai saat submit. */
  replacementDate?: string;
  /** Tanggal terakhir yang dicoba (dipakai buat mengisi DatePicker), termasuk saat gagal. */
  replacementAttempt?: string;
  replacementChecking?: boolean;
  replacementError?: string;
}

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
  bookingType: z.enum(['reguler', 'rutin']),
  bookingDate: z.date({ message: 'Tanggal wajib dipilih' }),
  pattern: z.enum(['weekly', 'monthly']).optional(),
  durationMonths: z.number().optional(),
  startTime: z.string().min(1, 'Waktu mulai wajib diisi'),
  endTime: z.string().min(1, 'Waktu selesai wajib diisi'),
  purposeType: z.string().optional(),
  expectedAttendees: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  const { min, max } = dateBounds();

  if (data.bookingDate < min) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['bookingDate'],
      message: `Booking minimal H+${BOOKING_MIN_ADVANCE_DAYS} (paling cepat ${format(min, 'd MMM yyyy', { locale: idLocale })})`,
    });
  }

  if (data.bookingType === 'reguler' && data.bookingDate > max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['bookingDate'],
      message: `Tanggal maksimal H+${BOOKING_MAX_ADVANCE_DAYS} dari hari ini`,
    });
  }

  if (data.bookingType === 'rutin') {
    if (!data.pattern) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pattern'], message: 'Pola pengulangan wajib dipilih' });
    }
    if (!data.durationMonths) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['durationMonths'], message: 'Durasi wajib dipilih' });
    }
  }
});
type BookingForm = z.infer<typeof bookingSchema>;

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preDate = searchParams.get('date');
  const preRoomId = searchParams.get('roomId'); // dukungan link legacy
  const editId = searchParams.get('edit'); // mode edit & ajukan ulang setelah revisi

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(preRoomId);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [recurringResult, setRecurringResult] = useState<{
    bookingId: string;
    occurrenceCount: number;
    skipped_count: number;
    skipped: { date: string; reason: 'conflict' | 'maintenance' }[];
  } | null>(null);

  const [datePreview, setDatePreview] = useState<RecurringDateEntry[] | null>(null);
  const [activeReplacementFor, setActiveReplacementFor] = useState<string | null>(null);

  const createBooking = useCreateBooking();
  const createRecurringBooking = useCreateRecurringBooking();
  const previewRecurring = usePreviewRecurringBooking();
  const updateBooking = useUpdateBooking();
  const { data: editBooking, isLoading: loadingEditBooking } = useBooking(editId ?? '');

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      startTime: '09:00',
      endTime: '10:00',
      bookingType: 'reguler',
      bookingDate: preDate ? new Date(preDate + 'T00:00:00') : undefined,
    },
  });

  const watchedDate = watch('bookingDate');
  const watchedStart = watch('startTime');
  const watchedEnd = watch('endTime');
  const watchedAttendees = watch('expectedAttendees');
  const watchedBookingType = watch('bookingType');
  const watchedPattern = watch('pattern');
  const watchedDuration = watch('durationMonths');

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

  // Redirect ke kalender bila tak ada konteks tanggal, ruangan, maupun mode edit.
  useEffect(() => {
    if (!preDate && !preRoomId && !editId) {
      router.replace('/booking/calendar');
    }
  }, [preDate, preRoomId, editId, router]);

  useEffect(() => {
    if (!preDate || editId) return;
    const parsed = new Date(preDate + 'T00:00:00');
    const clamped = parsed < minDate ? minDate : parsed > maxDate ? maxDate : parsed;
    setValue('bookingDate', clamped);
    if (clamped.getTime() !== parsed.getTime()) {
      toast.info(`Tanggal pada tautan di luar rentang pemesanan, disesuaikan ke ${format(clamped, 'd MMMM yyyy', { locale: idLocale })}.`);
    }
  }, [preDate, editId, minDate, maxDate, setValue]);

  // Mode edit & ajukan ulang: isi form dengan data booking yang sedang direvisi.
  useEffect(() => {
    if (!editBooking || prefilled) return;
    setValue('title', editBooking.title);
    setValue('description', editBooking.description ?? undefined);
    // booking_date dari API bisa berupa ISO penuh (mis. "2026-07-22T00:00:00.000000Z")
    // atau tanggal polos — ambil 10 karakter pertama ("YYYY-MM-DD") sebelum
    // ditempeli "T00:00:00" agar selalu jadi tengah malam waktu lokal, bukan Invalid Date.
    setValue('bookingDate', new Date(editBooking.booking_date.substring(0, 10) + 'T00:00:00'));
    setValue('startTime', editBooking.start_time.substring(0, 5));
    setValue('endTime', editBooking.end_time.substring(0, 5));
    setValue('purposeType', editBooking.purpose_type ?? undefined);
    setValue('expectedAttendees', editBooking.expected_attendees ? String(editBooking.expected_attendees) : undefined);
    setValue('notes', editBooking.notes ?? undefined);
    setSelectedRoomId(editBooking.room_id);
    setPrefilled(true);
  }, [editBooking, prefilled, setValue]);

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
        const res = await roomsApi.availability(selectedRoomId, format(watchedDate, 'yyyy-MM-dd'), debouncedStart, debouncedEnd, editId ?? undefined);
        setIsAvailable(res.data.data.available);
      } catch {
        setIsAvailable(null);
      } finally {
        setCheckingAvailability(false);
      }
    };
    check();
  }, [selectedRoomId, watchedDate, debouncedStart, debouncedEnd, editId]);

  // Cek ketersediaan tiap tanggal occurrence booking rutin ke backend (bukan cuma
  // hitung tanggal di client) — supaya tanggal yang bentrok bisa langsung ditawari
  // penggantian sebelum submit.
  useEffect(() => {
    if (watchedBookingType !== 'rutin' || !selectedRoomId || !watchedDate || !watchedPattern || !watchedDuration || !debouncedStart || !debouncedEnd) {
      setDatePreview(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await previewRecurring.mutateAsync({
          room_id: selectedRoomId,
          first_date: format(watchedDate, 'yyyy-MM-dd'),
          start_time: debouncedStart,
          end_time: debouncedEnd,
          pattern: watchedPattern,
          duration_months: watchedDuration,
        });
        if (cancelled) return;
        setDatePreview(res.data.data.dates.map((d) => ({ date: d.date, available: d.available, reason: d.reason })));
      } catch {
        if (!cancelled) setDatePreview(null);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedBookingType, selectedRoomId, watchedDate, watchedPattern, watchedDuration, debouncedStart, debouncedEnd]);

  const hasUnresolvedRecurringConflicts = !!datePreview?.some((e) => !e.available && !e.replacementDate);
  const resolvedRecurringDates = useMemo(
    () => datePreview?.map((e) => e.replacementDate ?? e.date) ?? [],
    [datePreview]
  );

  async function handlePickReplacement(originalDate: string, newDate: Date | undefined) {
    if (!newDate || !selectedRoomId) return;
    const newDateStr = format(newDate, 'yyyy-MM-dd');

    setDatePreview((prev) =>
      prev?.map((e) => (e.date === originalDate ? { ...e, replacementAttempt: newDateStr, replacementChecking: true, replacementError: undefined } : e)) ?? prev
    );

    try {
      const res = await roomsApi.availability(selectedRoomId, newDateStr, debouncedStart, debouncedEnd);
      setDatePreview((prev) =>
        prev?.map((e) => {
          if (e.date !== originalDate) return e;
          if (res.data.data.available) {
            return { ...e, replacementDate: newDateStr, replacementChecking: false, replacementError: undefined };
          }
          return { ...e, replacementChecking: false, replacementError: 'Tanggal ini juga tidak tersedia, coba tanggal lain.' };
        }) ?? prev
      );
    } catch {
      setDatePreview((prev) =>
        prev?.map((e) => (e.date === originalDate ? { ...e, replacementChecking: false, replacementError: 'Gagal memeriksa ketersediaan.' } : e)) ?? prev
      );
    }
  }

  const onSubmit = async (data: BookingForm) => {
    if (!selectedRoomId) return;

    if (editId) {
      await updateBooking.mutateAsync({
        id: editId,
        data: {
          room_id: selectedRoomId,
          title: data.title,
          description: data.description || undefined,
          booking_date: format(data.bookingDate, 'yyyy-MM-dd'),
          start_time: data.startTime,
          end_time: data.endTime,
          notes: data.notes || undefined,
        },
      });
      router.push(`/booking/${editId}`);
      return;
    }

    if (data.bookingType === 'rutin') {
      if (hasUnresolvedRecurringConflicts || resolvedRecurringDates.length === 0) return;

      const res = await createRecurringBooking.mutateAsync({
        room_id: selectedRoomId,
        title: data.title,
        description: data.description || undefined,
        dates: resolvedRecurringDates,
        start_time: data.startTime,
        end_time: data.endTime,
        purpose_type: data.purposeType || undefined,
        expected_attendees: attendeesNum || undefined,
        notes: data.notes || undefined,
        pattern: data.pattern!,
      });
      setRecurringResult({
        bookingId: res.data.data.booking.id,
        occurrenceCount: res.data.data.booking.recurring_dates?.length ?? 0,
        skipped_count: res.data.data.skipped_count,
        skipped: res.data.data.skipped,
      });
      return;
    }

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

  if (editId && loadingEditBooking) {
    return <Spinner size="lg" center label="Memuat data booking..." />;
  }

  if (recurringResult) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Booking Rutin Berhasil Diajukan</h1>
          <p className="text-muted-foreground mt-1">Ringkasan pengajuan jadwal rutin Anda</p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <span>
                1 pengajuan booking rutin berhasil dibuat dengan{' '}
                <strong>{recurringResult.occurrenceCount}</strong> tanggal, menunggu persetujuan sekaligus untuk seluruh jadwal.
              </span>
            </div>

            {recurringResult.skipped_count > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <XCircle className="w-4 h-4 shrink-0" />
                  {recurringResult.skipped_count} tanggal dilewati (tidak ikut diajukan):
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 pl-6 list-disc">
                  {recurringResult.skipped.map((s) => (
                    <li key={s.date}>
                      {format(new Date(s.date + 'T00:00:00'), 'd MMMM yyyy', { locale: idLocale })} —{' '}
                      {s.reason === 'conflict' ? 'Bertabrakan dengan booking lain' : 'Jadwal perbaikan ruangan'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={() => router.push(`/booking/${recurringResult.bookingId}`)}>Lihat Detail Booking</Button>
              <Button variant="outline" onClick={() => router.push('/my-bookings')}>Lihat Booking Saya</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={editId ? `/booking/${editId}` : '/booking/calendar'} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> {editId ? 'Kembali ke Detail Booking' : 'Kembali ke Kalender'}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{editId ? 'Edit & Ajukan Ulang Booking' : 'Booking Ruangan'}</h1>
        <p className="text-muted-foreground mt-1">
          {editId ? 'Perbaiki data sesuai catatan revisi, lalu ajukan ulang.' : 'Isi detail kegiatan, lalu pilih ruangan yang sesuai jumlah peserta'}
        </p>
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

            {!editId && (
              <div>
                <label className="text-sm font-medium leading-none mb-1.5 block">Tipe Booking</label>
                <Controller
                  name="bookingType"
                  control={control}
                  render={({ field }) => (
                    <SegmentedControl options={BOOKING_TYPE_OPTIONS} value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Controller
                  name="bookingDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label={watchedBookingType === 'rutin' ? 'Tanggal Pertama *' : 'Tanggal *'}
                      value={field.value}
                      onChange={field.onChange}
                      fromDate={minDate}
                      toDate={watchedBookingType === 'rutin' ? undefined : maxDate}
                    />
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

            {watchedBookingType === 'rutin' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 rounded-lg border border-dashed p-4">
                <div>
                  <label className="text-sm font-medium leading-none mb-1.5 block">Pola Pengulangan *</label>
                  <Controller
                    name="pattern"
                    control={control}
                    render={({ field }) => (
                      <SegmentedControl options={PATTERN_OPTIONS} value={field.value ?? ''} onChange={field.onChange} />
                    )}
                  />
                  {errors.pattern && <p className="text-destructive text-xs mt-1">{errors.pattern.message}</p>}
                </div>
                <div>
                  <Controller
                    name="durationMonths"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Durasi *"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      >
                        <option value="">Pilih durasi</option>
                        {RECURRING_DURATION_OPTIONS.map((m) => (
                          <option key={m} value={m}>{m === 12 ? '1 Tahun' : `${m} Bulan`}</option>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.durationMonths && <p className="text-destructive text-xs mt-1">{errors.durationMonths.message}</p>}
                </div>

                {!selectedRoomId && watchedPattern && watchedDuration && (
                  <p className="lg:col-span-2 text-xs text-muted-foreground">
                    Pilih ruangan terlebih dahulu untuk memeriksa ketersediaan tiap tanggal.
                  </p>
                )}

                {previewRecurring.isPending && (
                  <p className="lg:col-span-2 text-xs text-muted-foreground flex items-center gap-1.5">
                    <Spinner size="sm" /> Memeriksa ketersediaan tiap tanggal...
                  </p>
                )}

                {datePreview && datePreview.length > 0 && (
                  <div className="lg:col-span-2 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5" /> {datePreview.length} tanggal akan diajukan
                      {hasUnresolvedRecurringConflicts && ' — selesaikan tanggal yang bentrok dulu sebelum mengajukan:'}
                    </p>
                    <div className="space-y-1.5 max-h-72 overflow-y-auto">
                      {datePreview.map((entry) => {
                        const original = new Date(entry.date + 'T00:00:00');
                        const resolved = !!entry.replacementDate;
                        const blocked = !entry.available && !resolved;

                        return (
                          <div
                            key={entry.date}
                            className={cn(
                              'flex flex-wrap items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs',
                              blocked ? 'border-red-200 bg-red-50' : 'border-border'
                            )}
                          >
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={cn(blocked && 'line-through text-muted-foreground')}>
                                {format(original, 'd MMM yyyy', { locale: idLocale })}
                              </span>
                              {resolved && (
                                <>
                                  <span className="text-muted-foreground">&rarr;</span>
                                  <span className="font-medium text-green-700">
                                    {format(new Date(entry.replacementDate + 'T00:00:00'), 'd MMM yyyy', { locale: idLocale })}
                                  </span>
                                </>
                              )}
                              {blocked && (
                                <span className="text-red-700">
                                  {entry.reason === 'conflict' ? 'Bertabrakan' : 'Jadwal perbaikan'}
                                </span>
                              )}
                            </div>

                            {blocked ? (
                              activeReplacementFor === entry.date ? (
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <DatePicker
                                      value={entry.replacementAttempt ? new Date(entry.replacementAttempt + 'T00:00:00') : undefined}
                                      onChange={(d) => handlePickReplacement(entry.date, d)}
                                      fromDate={startOfMonth(original) < minDate ? minDate : startOfMonth(original)}
                                      toDate={endOfMonth(original)}
                                      placeholder="Klik untuk pilih tanggal"
                                    />
                                    {entry.replacementChecking && <Spinner size="sm" />}
                                  </div>
                                  {entry.replacementError && (
                                    <p className="text-destructive text-[11px]">{entry.replacementError}</p>
                                  )}
                                </div>
                              ) : (
                                <Button type="button" size="sm" variant="outline" onClick={() => setActiveReplacementFor(entry.date)}>
                                  Pilih tanggal lain
                                </Button>
                              )
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
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

        {selectedRoomId && (
          <Checkbox
            id="consent-booking"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            label="Saya menyatakan bahwa data yang diisi sudah benar dan bersedia bertanggung jawab atas pengajuan ini."
          />
        )}

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(editId ? `/booking/${editId}` : '/booking/calendar')}>Batal</Button>
          <Button
            type="submit"
            loading={editId ? updateBooking.isPending : watchedBookingType === 'rutin' ? createRecurringBooking.isPending : createBooking.isPending}
            disabled={
              !selectedRoomId || overCapacity || !consentChecked ||
              (watchedBookingType === 'rutin'
                ? !editId && (previewRecurring.isPending || !datePreview || datePreview.length === 0 || hasUnresolvedRecurringConflicts)
                : isAvailable === false || checkingAvailability)
            }
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            {editId ? 'Ajukan Ulang' : watchedBookingType === 'rutin' ? 'Ajukan Jadwal Rutin' : 'Ajukan Booking'}
          </Button>
        </div>
      </form>
    </div>
  );
}
