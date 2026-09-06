'use client';

import { useState, type ComponentType } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { MisaDeadlineNotice } from '@/components/ui/misa-deadline-notice';
import { nowWibInput } from '@/lib/misa-deadline';
import { useCreateManualCongregationService } from '@/hooks/useCongregationServices';
import { SERVICE_TYPES, computeMisaScheduleOptions } from '@/lib/service-types';
import { angkaKeTerbilang } from '@/lib/terbilang';
import { cn } from '@/lib/utils';
import {
  Plus, ArrowLeft, Droplets, Bird, Flame, Church, Heart, FileText, FileCheck,
  Cross, FlaskConical, DoorOpen, Radio, HelpCircle, BookOpen, CalendarPlus, MessagesSquare,
} from 'lucide-react';

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  Droplets, Bird, Flame, Church, Heart, FileText, FileCheck, Cross, FlaskConical, DoorOpen, Radio, HelpCircle, BookOpen,
  CalendarPlus, MessagesSquare,
};

/** Jenis pelayanan yang sudah punya form entri manual. Tambahkan value lain di sini kalau formnya sudah dibuat. */
const AVAILABLE_MANUAL_TYPES = ['intensi_misa'];

const STATUS_OPTIONS = [
  { value: 'approved', label: 'Disetujui' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'rejected', label: 'Ditolak' },
];

/**
 * Tambah permohonan pelayanan umat langsung tanpa lewat form wizard umat —
 * untuk permohonan yang datang lewat kertas/WA/telepon dan perlu dicatat
 * sekretariat. Dibuka dengan step pilih jenis pelayanan dulu (baru Intensi
 * Misa yang punya form; jenis lain ditandai "Segera hadir"), mirip step 0
 * wizard /layanan-umat/new. Status bisa langsung diisi "Disetujui", dan
 * tidak ada notifikasi "permohonan baru" karena staf sendiri yang input.
 */
export function ManualServiceDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'pick' | 'intensi_misa'>('pick');
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
  const [receivedAt, setReceivedAt] = useState(nowWibInput);

  const tanggalStr = tanggalMisa ? format(tanggalMisa, 'yyyy-MM-dd') : undefined;
  const scheduleOptions = tanggalStr ? computeMisaScheduleOptions(tanggalStr) : [];
  const stipendiumTerbilang = (() => {
    const n = Number(stipendiumAmount);
    return stipendiumAmount && n > 0 ? `${angkaKeTerbilang(n)} Rupiah` : '';
  })();

  const hasIntensi = ucapanSyukur.trim() || doaArwah.trim() || permohonanLainnya.trim();
  const isValid = applicantName.trim() && contact.trim() && tanggalStr && jadwalMisa && hasIntensi && stipendiumAmount;

  const resetForm = () => {
    setStep('pick');
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
    setReceivedAt(nowWibInput());
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
        received_at: receivedAt ? `${receivedAt}:00+07:00` : undefined,
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
      <Button variant="outline" size="sm" onClick={() => { setReceivedAt(nowWibInput()); setOpen(true); }}>
        <Plus className="w-4 h-4 mr-1.5" /> Tambah Manual
      </Button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {step === 'pick' ? (
            <>
              <DialogHeader>
                <DialogTitle>Tambah Pelayanan Umat Manual</DialogTitle>
                <DialogDescription>
                  Pilih jenis pelayanan yang mau dicatat. Untuk permohonan yang datang lewat kertas/WA/telepon.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
                {SERVICE_TYPES.map((t) => {
                  const Icon = ICON_MAP[t.icon] ?? HelpCircle;
                  const available = AVAILABLE_MANUAL_TYPES.includes(t.value);
                  return (
                    <button
                      key={t.value}
                      type="button"
                      disabled={!available}
                      onClick={() => available && setStep('intensi_misa')}
                      className={cn(
                        'relative flex flex-col items-center gap-2 p-4 rounded-xl border text-sm text-center transition-all',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                        available
                          ? 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground hover:shadow-sm cursor-pointer'
                          : 'bg-muted/30 border-border/50 text-muted-foreground/50 cursor-not-allowed'
                      )}
                    >
                      <Icon className={cn('w-7 h-7', available && t.theme)} />
                      <span className="font-semibold text-xs leading-tight line-clamp-2">{t.label}</span>
                      {!available && (
                        <span className="absolute top-1.5 right-1.5 text-[9px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                          Segera hadir
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit -ml-2 -mt-1 mb-1 h-7 px-2 text-muted-foreground"
                  onClick={() => setStep('pick')}
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Ganti jenis pelayanan
                </Button>
                <DialogTitle>Tambah Intensi Misa Manual</DialogTitle>
                <DialogDescription>
                  Untuk permohonan yang datang lewat kertas/WA/telepon dan perlu dicatat langsung — tidak melalui form wizard umat.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <Input label="Nama Pemohon *" placeholder="Nama lengkap pemohon" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} />
                <Input label="Waktu diterima Sekretariat (WIB)" type="datetime-local" value={receivedAt} max={nowWibInput()} onChange={(e) => setReceivedAt(e.target.value)} />
                <p className="text-xs text-muted-foreground">Sesuaikan dengan waktu formulir diterima. Waktu pencatatan sistem tetap disimpan terpisah.</p>
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

                <MisaDeadlineNotice date={tanggalStr} time={jadwalMisa} />
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
