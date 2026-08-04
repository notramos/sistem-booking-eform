'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker';
import { useRooms } from '@/hooks/useRooms';
import { useCreateManualBooking } from '@/hooks/useBookings';
import { Plus } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'approved', label: 'Disetujui' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'sekretariat_review', label: 'Ditinjau Sekretariat' },
  { value: 'admin_review', label: 'Ditinjau Admin' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'cancelled', label: 'Dibatalkan' },
  { value: 'completed', label: 'Selesai' },
];

/**
 * Tambah booking langsung tanpa lewat alur pengajuan biasa — untuk data
 * historis/pra-sepakat di luar sistem (mis. catatan lama sekretariat) yang
 * tidak cocok dengan form booking umat (form itu mewajibkan H+7 dan selalu
 * berstatus "Menunggu"). Status bisa langsung diisi "Disetujui".
 */
export function ManualBookingDialog() {
  const [open, setOpen] = useState(false);
  const { data: roomsData } = useRooms({ per_page: 100, sort_by: 'name' });
  const rooms = roomsData?.data ?? [];
  const createManual = useCreateManualBooking();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roomId, setRoomId] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState('');
  const [status, setStatus] = useState('approved');

  const dateStr = date ? format(date, 'yyyy-MM-dd') : undefined;
  const isValid = title.trim() && roomId && dateStr && startTime && endTime;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setRoomId('');
    setDate(undefined);
    setStartTime('');
    setEndTime('');
    setContactPerson('');
    setExpectedAttendees('');
    setStatus('approved');
  };

  const handleSubmit = () => {
    if (!isValid || !dateStr) return;
    createManual.mutate(
      {
        room_id: roomId,
        title: title.trim(),
        description: description.trim() || undefined,
        booking_date: dateStr,
        start_time: startTime,
        end_time: endTime,
        status,
        contact_person: contactPerson.trim() || undefined,
        expected_attendees: expectedAttendees ? Number(expectedAttendees) : undefined,
      },
      { onSuccess: () => { setOpen(false); resetForm(); } }
    );
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-1.5" /> Tambah Manual
      </Button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Booking Manual</DialogTitle>
            <DialogDescription>
              Untuk data historis atau yang sudah disepakati di luar sistem — tidak melalui alur pengajuan biasa, dan tidak terikat batas H+7.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input label="Peminjam *" placeholder="Nama peminjam/kelompok" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea label="Deskripsi" rows={2} placeholder="Nama kegiatan, keterangan tambahan..." value={description} onChange={(e) => setDescription(e.target.value)} />

            <Select label="Ruangan *" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              <option value="">Pilih ruangan</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}{room.building ? ` — ${room.building}` : ''} ({room.capacity} orang)
                </option>
              ))}
            </Select>

            <DatePicker label="Tanggal *" value={date} onChange={setDate} placeholder="Pilih tanggal (tanpa batas H+7)" />

            <TimeSlotPicker
              label="Waktu *"
              start={startTime}
              end={endTime}
              onChange={(s, e) => { setStartTime(s); setEndTime(e); }}
              roomId={roomId || undefined}
              date={dateStr}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input label="Kontak" placeholder="Nomor HP" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
              <Input label="Jumlah Peserta" type="number" min="1" placeholder="Opsional" value={expectedAttendees} onChange={(e) => setExpectedAttendees(e.target.value)} />
            </div>

            <Select label="Status *" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={!isValid} loading={createManual.isPending}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
