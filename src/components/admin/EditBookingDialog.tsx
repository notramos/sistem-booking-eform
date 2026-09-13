'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker';
import { useRooms } from '@/hooks/useRooms';
import { useAdminUpdateBooking } from '@/hooks/useBookings';
import { getRoomDisplayLabel } from '@/lib/utils';
import type { Booking } from '@/types';
import { Pencil } from 'lucide-react';

export function EditBookingDialog({ booking }: { booking: Booking }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(booking.title);
  const [description, setDescription] = useState(booking.description ?? '');
  const [roomId, setRoomId] = useState(booking.room_id);
  const [date, setDate] = useState<Date | undefined>(new Date(`${booking.booking_date}T00:00:00`));
  const [startTime, setStartTime] = useState(booking.start_time.slice(0, 5));
  const [endTime, setEndTime] = useState(booking.end_time.slice(0, 5));
  const [contact, setContact] = useState(booking.contact_person ?? '');
  const [attendees, setAttendees] = useState(booking.expected_attendees?.toString() ?? '');
  const [status, setStatus] = useState(booking.status);
  const { data } = useRooms({ per_page: 100, sort_by: 'name' });
  const update = useAdminUpdateBooking();

  const save = () => {
    if (!title.trim() || !roomId || !date || !startTime || !endTime) return;
    update.mutate({ id: booking.id, data: {
      title: title.trim(), description: description.trim() || null, room_id: roomId,
      booking_date: format(date, 'yyyy-MM-dd'), start_time: startTime, end_time: endTime,
      contact_person: contact.trim() || null, expected_attendees: attendees ? Number(attendees) : null, status,
    } }, { onSuccess: () => setOpen(false) });
  };

  return <>
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit booking" onClick={() => setOpen(true)}><Pencil className="h-4 w-4" /></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Edit Peminjaman</DialogTitle><DialogDescription>Perubahan dari halaman Data Booking. Riwayat booking tetap tersimpan.</DialogDescription></DialogHeader>
      <div className="space-y-3 py-2">
        <Input label="Peminjam *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Kegiatan / Deskripsi" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        <Select label="Ruangan *" value={roomId} onChange={(e) => setRoomId(e.target.value)}>{(data?.data ?? []).map((r) => <option key={r.id} value={r.id}>{getRoomDisplayLabel(r)} ({r.capacity})</option>)}</Select>
        <DatePicker label="Tanggal *" value={date} onChange={setDate} />
        <TimeSlotPicker label="Waktu *" start={startTime} end={endTime} onChange={(s, e) => { setStartTime(s); setEndTime(e); }} roomId={roomId} date={date ? format(date, 'yyyy-MM-dd') : undefined} />
        <div className="grid grid-cols-2 gap-3"><Input label="Kontak" value={contact} onChange={(e) => setContact(e.target.value)} /><Input label="Jumlah Peserta" type="number" value={attendees} onChange={(e) => setAttendees(e.target.value)} /></div>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as Booking['status'])}>{['pending','sekretariat_review','admin_review','approved','rejected','cancelled','completed'].map((s) => <option key={s} value={s}>{s}</option>)}</Select>
      </div>
      <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button><Button onClick={save} loading={update.isPending}>Simpan</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}
