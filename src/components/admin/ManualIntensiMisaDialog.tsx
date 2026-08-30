'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useCreateManualCongregationService } from '@/hooks/useCongregationServices';
import { computeMisaScheduleOptions } from '@/lib/service-types';
import { angkaKeTerbilang } from '@/lib/terbilang';
import { Plus } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'approved', label: 'Disetujui' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'rejected', label: 'Ditolak' },
];

/**
 * Tambah permohonan Intensi Misa langsung tanpa lewat form wizard umat — untuk
 * permohonan yang datang lewat kertas/WA/telepon dan perlu dicatat sekretariat.
 * Mirip ManualBookingDialog: status bisa langsung diisi "Disetujui", tidak ada
 * notifikasi "permohonan baru" karena staf sendiri yang input.
 */
export function ManualIntensiMisaDialog() {
  const [open, setOpen] = useState(false);
  const createManual = useCreateManualCongregationService();

  const [applicantName, setApplicantName] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [contact, setContact] = useState('');
  const [tanggalMisa, setTanggalMisa] = useState<Date | undefined>(undefined);
  const [jadwalMisa, setJadwalMisa] = useState('');
  const [ucapanSyukur, setUcapanSyukur] = useState('');
  const [doaArwah, setDoaArwah] = useState('');
  const [permohonanLainnya, setPermohonanLainnya] = useState('');
  const [stipendiumAmount, setStipendiumAmount] = useState('');
  const [status, setStatus] = useState('approved');

  const tanggalStr = tanggalMisa ? format(tanggalMisa, 'yyyy-MM-dd') : undefined;
  const scheduleOptions = tanggalStr ? computeMisaScheduleOptions(tanggalStr) : [];
  const stipendiumTerbilang = (() => {
    const n = Number(stipendiumAmount);
    return stipendiumAmount && n > 0 ? `${angkaKeTerbilang(n)} Rupiah` : '';
  })();

  const hasIntensi = ucapanSyukur.trim() || doaArwah.trim() || permohonanLainnya.trim();
  const isValid = applicantName.trim() && contact.trim() && tanggalStr && jadwalMisa && hasIntensi && stipendiumAmount;

  const resetForm = () => {
    setApplicantName('');
    setNeighborhood('');
    setContact('');
    setTanggalMisa(undefined);
    setJadwalMisa('');
    setUcapanSyukur('');
    setDoaArwah('');
    setPermohonanLainnya('');
    setStipendiumAmount('');
    setStatus('approved');
  };

  const handleTanggalChange = (d: Date | undefined) => {
    setTanggalMisa(d);
    if (d) {
      const options = computeMisaScheduleOptions(format(d, 'yyyy-MM-dd'));
      if (options.length === 1) setJadwalMisa(options[0].value);
      else setJadwalMisa('');
    } else {
      setJadwalMisa('');
    }
  };

  const handleSubmit = () => {
    if (!isValid || !tanggalStr) return;
    createManual.mutate(
      {
        service_type: 'intensi_misa',
        applicant_name: applicantName.trim(),
        neighborhood: neighborhood.trim() || undefined,
        contact: contact.trim(),
        status: status as 'pending' | 'approved' | 'rejected',
        dynamic_fields: {
          tanggal_misa: tanggalStr,
          jadwal_misa: jadwalMisa,
          ...(ucapanSyukur.trim() ? { ucapan_syukur: ucapanSyukur.trim() } : {}),
          ...(doaArwah.trim() ? { doa_arwah: doaArwah.trim() } : {}),
          ...(permohonanLainnya.trim() ? { permohonan_lainnya: permohonanLainnya.trim() } : {}),
          stipendium_amount: stipendiumAmount,
          ...(stipendiumTerbilang ? { stipendium_terbilang: stipendiumTerbilang } : {}),
        },
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
            <DialogTitle>Tambah Intensi Misa Manual</DialogTitle>
            <DialogDescription>
              Untuk permohonan yang datang lewat kertas/WA/telepon dan perlu dicatat langsung — tidak melalui form wizard umat.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input label="Nama Pemohon *" placeholder="Nama lengkap pemohon" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Lingkungan" placeholder="Nama lingkungan" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
              <Input label="Kontak *" placeholder="Nomor HP" value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>

            <DatePicker label="Tanggal Misa *" value={tanggalMisa} onChange={handleTanggalChange} placeholder="Pilih tanggal misa" />

            <Select label="Jadwal Misa *" value={jadwalMisa} onChange={(e) => setJadwalMisa(e.target.value)} disabled={!tanggalStr}>
              <option value="">{tanggalStr ? 'Pilih jam' : 'Pilih tanggal dulu'}</option>
              {scheduleOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>

            <Textarea label="Ucapan Syukur atas" rows={2} placeholder="Opsional" value={ucapanSyukur} onChange={(e) => setUcapanSyukur(e.target.value)} />
            <Textarea label="Mohon Istirahat Kekal Bagi" rows={2} placeholder="Opsional" value={doaArwah} onChange={(e) => setDoaArwah(e.target.value)} />
            <Textarea label="Permohonan Lainnya" rows={2} placeholder="Opsional" value={permohonanLainnya} onChange={(e) => setPermohonanLainnya(e.target.value)} />
            {!hasIntensi && (
              <p className="text-xs text-destructive">Isi salah satu: Ucapan Syukur, Doa Arwah, atau Permohonan Lainnya.</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input label="Jumlah Stipendium (Rp) *" type="number" min="0" placeholder="Contoh: 50000" value={stipendiumAmount} onChange={(e) => setStipendiumAmount(e.target.value)} />
              <Input label="Terbilang" readOnly value={stipendiumTerbilang} placeholder="Terisi otomatis" />
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
