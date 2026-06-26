'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateCongregationService } from '@/hooks/useCongregationServices';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const SERVICE_TYPES = [
  { value: 'konseling_pastoral', label: 'Konseling Pastoral' },
  { value: 'kunjungan_pastoral', label: 'Kunjungan Pastoral' },
  { value: 'bantuan_sosial', label: 'Bantuan Sosial' },
  { value: 'permohonan_doa', label: 'Permohonan Doa' },
  { value: 'perjamuan_kudus', label: 'Pelayanan Perjamuan Kudus' },
  { value: 'pendampingan', label: 'Pendampingan Keluarga' },
  { value: 'pemberkatan_rumah', label: 'Pemberkatan Rumah' },
  { value: 'lainnya', label: 'Lainnya' },
];

export default function NewCongregationServicePage() {
  const router = useRouter();
  const createService = useCreateCongregationService();

  const [serviceType, setServiceType] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [serviceDate, setServiceDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState('');

  const isValid = serviceType && applicantName && contact && description;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      await createService.mutateAsync({
        service_type: serviceType,
        applicant_name: applicantName,
        address: address || undefined,
        contact,
        service_date: serviceDate ? format(serviceDate, 'yyyy-MM-dd') : undefined,
        description,
      });
      router.push('/dashboard');
    } catch {
      // handled by hook
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Heart className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pelayanan Umat</h1>
          <p className="text-muted-foreground mt-1">Ajukan permohonan pelayanan untuk jemaat</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Permohonan Pelayanan Umat</CardTitle>
          <CardDescription>Lengkapi data permohonan pelayanan</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">Jenis Pelayanan *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {SERVICE_TYPES.map((t) => {
                  const selected = serviceType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setServiceType(t.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-sm transition-all ${
                        selected
                          ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary'
                          : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      }`}
                    >
                      <Heart className="w-5 h-5" />
                      <span className="font-medium text-xs text-center leading-tight">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Input
                id="applicant_name"
                label="Nama Pemohon *"
                placeholder="Nama lengkap pemohon"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                required
              />
              <Input
                id="contact"
                label="Kontak *"
                placeholder="Nomor telepon / email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </div>

            <Input
              id="address"
              label="Alamat"
              placeholder="Alamat lengkap"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <DatePicker
              label="Tanggal Pelayanan (opsional)"
              value={serviceDate}
              onChange={setServiceDate}
            />

            <Textarea
              id="description"
              label="Keterangan *"
              placeholder="Jelaskan permohonan pelayanan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
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
                <Heart className="w-4 h-4 mr-2" />
                Ajukan Pelayanan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
