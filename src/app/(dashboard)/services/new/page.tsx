'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRooms } from '@/hooks/useRooms';
import { useCreateServiceBooking } from '@/hooks/useBookings';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { TimeRangePicker } from '@/components/ui/time-range-picker';
import { format } from 'date-fns';
import {
  Church, ArrowLeft, Mic, Monitor, Table2, ArmchairIcon, Cable, Music,
  CheckSquare, Heart, Users, Baby, Cross, Sparkles, Star, Bookmark,
} from 'lucide-react';
import Link from 'next/link';

interface ServiceTypeConfig {
  value: string;
  label: string;
  icon: typeof Heart;
  description: string;
  fields: { key: string; label: string; type: 'text' | 'number'; placeholder: string; required?: boolean }[];
}

const SERVICE_TYPES: ServiceTypeConfig[] = [
  {
    value: 'ibadah_minggu', label: 'Ibadah Minggu', icon: Heart,
    description: 'Ibadah mingguan jemaat',
    fields: [
      { key: 'theme', label: 'Tema Ibadah', type: 'text', placeholder: 'Tema ibadah minggu ini' },
      { key: 'worship_leader', label: 'Pemimpin Pujian', type: 'text', placeholder: 'Nama pemimpin pujian' },
    ],
  },
  {
    value: 'pernikahan', label: 'Pernikahan', icon: Heart,
    description: 'Pemberkatan pernikahan',
    fields: [
      { key: 'groom_name', label: 'Nama Mempelai Pria *', type: 'text', placeholder: 'Nama lengkap mempelai pria', required: true },
      { key: 'bride_name', label: 'Nama Mempelai Wanita *', type: 'text', placeholder: 'Nama lengkap mempelai wanita', required: true },
      { key: 'marriage_cert_number', label: 'Nomor Surat Pemberkatan', type: 'text', placeholder: 'Nomor surat dari gereja' },
      { key: 'guest_count', label: 'Jumlah Tamu Undangan', type: 'number', placeholder: 'Perkiraan jumlah tamu' },
    ],
  },
  {
    value: 'baptisan', label: 'Baptisan', icon: Baby,
    description: 'Pelayanan baptisan',
    fields: [
      { key: 'baptized_name', label: 'Nama yang Dibaptis *', type: 'text', placeholder: 'Nama lengkap yang akan dibaptis', required: true },
      { key: 'baptism_officiant', label: 'Pendeta Pembaptis', type: 'text', placeholder: 'Nama pendeta' },
      { key: 'parent_count', label: 'Jumlah Orang Tua', type: 'number', placeholder: 'Jumlah orang tua yang hadir' },
    ],
  },
  {
    value: 'pemakaman', label: 'Pemakaman', icon: Cross,
    description: 'Pemakaman atau peringatan',
    fields: [
      { key: 'deceased_name', label: 'Nama Almarhum *', type: 'text', placeholder: 'Nama lengkap almarhum', required: true },
      { key: 'burial_place', label: 'Tempat Pemakaman', type: 'text', placeholder: 'Lokasi pemakaman' },
      { key: 'family_contact', label: 'Kontak Keluarga *', type: 'text', placeholder: 'Nomor telepon keluarga', required: true },
    ],
  },
  {
    value: 'natal', label: 'Natal', icon: Sparkles,
    description: 'Perayaan Natal',
    fields: [
      { key: 'event_title', label: 'Judul Acara', type: 'text', placeholder: 'Contoh: Natal Jemaat 2026' },
      { key: 'participant_count', label: 'Jumlah Peserta', type: 'number', placeholder: 'Perkiraan peserta' },
      { key: 'committee', label: 'Panitia Pelaksana', type: 'text', placeholder: 'Nama ketua panitia' },
      { key: 'coordinator', label: 'Koordinator', type: 'text', placeholder: 'Nama koordinator acara' },
    ],
  },
  {
    value: 'paskah', label: 'Paskah', icon: Star,
    description: 'Perayaan Paskah',
    fields: [
      { key: 'event_title', label: 'Judul Acara', type: 'text', placeholder: 'Contoh: Paskah Jemaat 2026' },
      { key: 'participant_count', label: 'Jumlah Peserta', type: 'number', placeholder: 'Perkiraan peserta' },
      { key: 'committee', label: 'Panitia Pelaksana', type: 'text', placeholder: 'Nama ketua panitia' },
      { key: 'coordinator', label: 'Koordinator', type: 'text', placeholder: 'Nama koordinator acara' },
    ],
  },
  {
    value: 'syukuran', label: 'Syukuran', icon: Star,
    description: 'Acara syukuran keluarga',
    fields: [
      { key: 'family_name', label: 'Nama Keluarga *', type: 'text', placeholder: 'Nama keluarga', required: true },
      {
        key: 'occasion', label: 'Acara Syukuran Untuk *', type: 'text',
        placeholder: 'Contoh: Kelahiran, Ulang Tahun, Rumah Baru, dll', required: true,
      },
    ],
  },
  {
    value: 'lainnya', label: 'Lainnya', icon: Bookmark,
    description: 'Pelayanan lainnya',
    fields: [
      { key: 'custom_description', label: 'Deskripsi Pelayanan *', type: 'text', placeholder: 'Jelaskan pelayanan yang dimohon', required: true },
    ],
  },
];

const EQUIPMENT_OPTIONS = [
  { value: 'sound_system', label: 'Sound System', icon: Mic },
  { value: 'lcd_projector', label: 'LCD Proyektor', icon: Monitor },
  { value: 'meja', label: 'Meja', icon: Table2 },
  { value: 'kursi_tambahan', label: 'Kursi Tambahan', icon: ArmchairIcon },
  { value: 'kabel_extension', label: 'Kabel Extension', icon: Cable },
  { value: 'panggung_portable', label: 'Panggung Portable', icon: Music },
];

export default function NewServicePage() {
  const router = useRouter();
  const { data: roomsData } = useRooms({ per_page: 100, sort_by: 'name' });
  const createService = useCreateServiceBooking();

  const [roomId, setRoomId] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  const [contact, setContact] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [otherEquipment, setOtherEquipment] = useState('');
  const [notes, setNotes] = useState('');

  const activeConfig = useMemo(
    () => SERVICE_TYPES.find((t) => t.value === serviceType),
    [serviceType]
  );

  const setDynamic = (key: string, value: string) => {
    setDynamicFields((prev) => ({ ...prev, [key]: value }));
  };

  const toggleEquipment = (val: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const isRequired = (key: string) =>
    activeConfig?.fields.find((f) => f.key === key)?.required ?? false;

  const isValid = useMemo(() => {
    if (!roomId || !bookingDate || !serviceType || !contact) return false;
    if (!activeConfig) return false;
    return activeConfig.fields.every((f) => {
      if (!f.required) return true;
      return dynamicFields[f.key]?.trim().length > 0;
    });
  }, [roomId, bookingDate, serviceType, contact, activeConfig, dynamicFields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      await createService.mutateAsync({
        room_id: roomId,
        booking_date: format(bookingDate!, 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: endTime,
        service_type: serviceType,
        contact,
        dynamic_fields: dynamicFields,
        equipment: selectedEquipment.length > 0 ? selectedEquipment : undefined,
        other_equipment: otherEquipment || undefined,
        notes: notes || undefined,
      });
      router.push('/my-bookings');
    } catch {
      // handled by hook
    }
  };

  const rooms = roomsData?.data ?? [];
  const Icon = activeConfig?.icon ?? Church;

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Church className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pelayanan Gereja</h1>
          <p className="text-muted-foreground mt-1">Ajukan permohonan pemakaian ruangan untuk pelayanan</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Permohonan Pelayanan</CardTitle>
          <CardDescription>Pilih jenis pelayanan untuk menyesuaikan form</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Select
                  label="Pilih Ruangan *"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  required
                >
                  <option value="">Pilih ruangan</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}{room.building ? ` - ${room.building}` : ''}
                    </option>
                  ))}
                </Select>
              </div>
              <DatePicker
                label="Tanggal *"
                value={bookingDate}
                onChange={setBookingDate}
              />
            </div>

            <TimeRangePicker
              label="Waktu Pelaksanaan *"
              start={startTime}
              end={endTime}
              onStartChange={setStartTime}
              onEndChange={setEndTime}
            />

            {/* Service Type Selection */}
            <div className="border-t pt-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Jenis Pelayanan *</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {SERVICE_TYPES.map((t) => {
                  const ItemIcon = t.icon;
                  const selected = serviceType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setServiceType(t.value);
                        setDynamicFields({});
                      }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-sm transition-all ${
                        selected
                          ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary'
                          : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      }`}
                    >
                      <ItemIcon className="w-6 h-6" />
                      <span className="font-medium text-xs text-center leading-tight">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Fields */}
            {activeConfig && (
              <div className="border-t pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">{activeConfig.label}</h3>
                  <span className="text-xs text-muted-foreground">— {activeConfig.description}</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activeConfig.fields.map((field) => (
                    <Input
                      key={field.key}
                      id={`field-${field.key}`}
                      label={field.label}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={dynamicFields[field.key] ?? ''}
                      onChange={(e) => setDynamic(field.key, e.target.value)}
                      required={field.required}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="border-t pt-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Kontak Penanggung Jawab *</h3>
              <Input
                id="contact"
                label="Nomor Telepon / Email"
                placeholder="Kontak yang bisa dihubungi"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </div>

            {/* Equipment */}
            <div className="border-t pt-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Perlengkapan Dibutuhkan</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {EQUIPMENT_OPTIONS.map((opt) => {
                  const EqIcon = opt.icon;
                  const selected = selectedEquipment.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleEquipment(opt.value)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${
                        selected
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <EqIcon className="w-4 h-4 shrink-0" />
                      <span>{opt.label}</span>
                      {selected && <CheckSquare className="w-4 h-4 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3">
                <Input
                  id="other_equipment"
                  label="Lainnya"
                  placeholder="Sebutkan perlengkapan lain..."
                  value={otherEquipment}
                  onChange={(e) => setOtherEquipment(e.target.value)}
                />
              </div>
            </div>

            <Textarea
              id="notes"
              label="Catatan Tambahan"
              placeholder="Informasi tambahan untuk pelayanan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />

            <div className="flex items-center gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Batal
              </Button>
              <Button
                type="submit"
                loading={createService.isPending}
                disabled={!isValid}
              >
                <Church className="w-4 h-4 mr-2" />
                Ajukan Pelayanan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
