'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { computeMisaScheduleOptions } from '@/lib/service-types';
import { useAdminUpdateCongregationService } from '@/hooks/useCongregationServices';
import type { CongregationService } from '@/types';
import { Pencil } from 'lucide-react';

export function EditIntensiMisaDialog({ service }: { service: CongregationService }) {
  const fields = service.dynamic_fields ?? {};
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(service.applicant_name);
  const [contact, setContact] = useState(service.contact);
  const [region, setRegion] = useState(service.region ?? '');
  const [neighborhood, setNeighborhood] = useState(service.neighborhood ?? '');
  const [date, setDate] = useState<Date | undefined>(fields.tanggal_misa ? new Date(`${String(fields.tanggal_misa)}T00:00:00`) : undefined);
  const [schedule, setSchedule] = useState(String(fields.jadwal_misa ?? ''));
  const [syukur, setSyukur] = useState(String(fields.ucapan_syukur ?? ''));
  const [arwah, setArwah] = useState(String(fields.doa_arwah ?? ''));
  const [lainnya, setLainnya] = useState(String(fields.permohonan_lainnya ?? ''));
  const [amount, setAmount] = useState(String(fields.stipendium_amount ?? ''));
  const [status, setStatus] = useState(service.status);
  const update = useAdminUpdateCongregationService();
  const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
  const options = useMemo(() => dateStr ? computeMisaScheduleOptions(dateStr) : [], [dateStr]);

  const save = () => {
    if (!name.trim() || !contact.trim() || !dateStr || !schedule) return;
    update.mutate({ id: service.id, data: { applicant_name: name.trim(), contact: contact.trim(), region: region || null, neighborhood: neighborhood || null, service_date: dateStr, status, dynamic_fields: { ...fields, tanggal_misa: dateStr, jadwal_misa: schedule, ucapan_syukur: syukur, doa_arwah: arwah, permohonan_lainnya: lainnya, stipendium_amount: amount } } }, { onSuccess: () => setOpen(false) });
  };

  return <>
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit intensi misa" onClick={() => setOpen(true)}><Pencil className="h-4 w-4" /></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Edit Intensi Misa</DialogTitle><DialogDescription>Perbarui data pemohon, jadwal, intensi, atau status.</DialogDescription></DialogHeader>
      <div className="space-y-3 py-2">
        <Input label="Nama Pemohon *" value={name} onChange={(e) => setName(e.target.value)} /><Input label="Kontak *" value={contact} onChange={(e) => setContact(e.target.value)} />
        <div className="grid grid-cols-2 gap-3"><Input label="Wilayah" value={region} onChange={(e) => setRegion(e.target.value)} /><Input label="Lingkungan" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} /></div>
        <DatePicker label="Tanggal Misa *" value={date} onChange={(d) => { setDate(d); setSchedule(''); }} />
        <Select label="Jadwal Misa *" value={schedule} onChange={(e) => setSchedule(e.target.value)} disabled={!dateStr}><option value="">Pilih jadwal</option>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
        <Textarea label="Ucapan Syukur" rows={2} value={syukur} onChange={(e) => setSyukur(e.target.value)} /><Textarea label="Doa Arwah" rows={2} value={arwah} onChange={(e) => setArwah(e.target.value)} /><Textarea label="Permohonan Lainnya" rows={2} value={lainnya} onChange={(e) => setLainnya(e.target.value)} />
        <Input label="Stipendium (Rp)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>{['pending','approved','rejected'].map((s) => <option key={s} value={s}>{s}</option>)}</Select>
      </div>
      <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button><Button onClick={save} loading={update.isPending}>Simpan</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}
