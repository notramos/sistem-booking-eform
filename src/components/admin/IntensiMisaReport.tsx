'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { reportsApi, type IntensiReportRow } from '@/lib/api/reports';
import { downloadBlob, formatDate } from '@/lib/utils';
import { formatWibDateTime, nowWibInput } from '@/lib/misa-deadline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';

const statuses: Record<string, string> = { approved: 'Disetujui', pending: 'Menunggu', rejected: 'Ditolak' };
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' });
const todayWib = () => new Date(`${nowWibInput().slice(0, 10)}T00:00:00`);

export function IntensiMisaReport() {
  const [start, setStart] = useState<Date | undefined>(todayWib);
  const [end, setEnd] = useState<Date | undefined>(todayWib);
  const [schedule, setSchedule] = useState('');
  const [status, setStatus] = useState('approved');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const params = {
    start_date: start ? format(start, 'yyyy-MM-dd') : '',
    end_date: end ? format(end, 'yyyy-MM-dd') : '',
    schedule, status,
  };
  const validDates = !!params.start_date && !!params.end_date && params.start_date <= params.end_date;
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['report-intensi-misa', params, page],
    queryFn: async () => (await reportsApi.intensiMisa({ ...params, page: String(page) })).data,
    enabled: validDates,
  });
  const groups = new Map<string, IntensiReportRow[]>();
  for (const row of data?.data ?? []) {
    const key = `${row.misa_date}|${row.schedule}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const quickRange = (week: boolean) => {
    const today = todayWib();
    setStart(week ? startOfWeek(today, { weekStartsOn: 1 }) : today);
    setEnd(week ? endOfWeek(today, { weekStartsOn: 1 }) : today);
    setPage(1);
  };
  const exportExcel = async () => {
    setExporting(true);
    try {
      const response = await reportsApi.exportIntensiMisa(params);
      downloadBlob(response.data as Blob, `intensi-misa-${params.start_date}-${params.end_date}.xlsx`);
    } catch {
      toast.error('Gagal mengunduh laporan Intensi Misa. Silakan coba lagi.');
    } finally { setExporting(false); }
  };

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => quickRange(false)}>Hari Ini</Button>
          <Button variant="outline" size="sm" onClick={() => quickRange(true)}>Minggu Ini</Button>
          <span className="text-xs text-muted-foreground">Tanggal lampau dapat dipilih untuk laporan arsip.</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DatePicker label="Tanggal Misa mulai" value={start} onChange={(date) => { setStart(date); setPage(1); }} />
          <DatePicker label="Tanggal Misa selesai" value={end} onChange={(date) => { setEnd(date); setPage(1); }} />
          <Select label="Jadwal Misa" value={schedule} onChange={(e) => { setSchedule(e.target.value); setPage(1); }}>
            <option value="">Semua jadwal</option>
            {['06:00', '06:30', '08:30', '09:30', '17:30', '18:30', '19:30'].map((time) => (
              <option key={time} value={time}>{time.replace(':', '.')}{time === '09:30' ? ' (arsip jadwal lama)' : ''}</option>
            ))}
          </Select>
          <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Semua status</option>
            {Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </div>
        <div className="flex flex-wrap justify-between items-center gap-3">
          <p className="text-sm text-muted-foreground">{validDates && data ? `${data.meta.total} permohonan sesuai filter` : 'Pilih rentang tanggal Misa.'}</p>
          <Button onClick={exportExcel} loading={exporting} disabled={!validDates || isPending || isError || !data?.meta.total}>Unduh Excel</Button>
        </div>
        <p className="text-xs text-muted-foreground">Excel memuat seluruh hasil filter. Waktu pengajuan dan penerimaan ditampilkan dalam WIB.</p>
      </CardContent></Card>

      {!validDates ? <p role="alert" className="text-sm text-destructive">Isi kedua tanggal. Tanggal selesai harus sama atau setelah tanggal mulai.</p>
        : isPending ? <p role="status">Memuat laporan Intensi Misa...</p>
        : isError ? <div role="alert" className="space-y-2"><p>Gagal memuat laporan Intensi Misa.</p><Button variant="outline" onClick={() => refetch()}>Coba lagi</Button></div>
        : !data?.data.length ? <p className="py-8 text-center text-muted-foreground">Tidak ada Intensi Misa sesuai filter yang dipilih.</p>
        : <>
          {[...groups].map(([key, rows]) => (
            <section key={key} className="space-y-3">
              <h2 className="font-semibold">{formatDate(rows[0].misa_date)} · Misa {rows[0].schedule.replace(':', '.')} WIB</h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {rows.map((row) => <Card key={row.id}><CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><Link className="font-semibold hover:underline break-words" href={`/layanan-umat/${row.id}`}>{row.applicant_name}</Link>
                      <p className="text-xs text-muted-foreground">{[row.region, row.neighborhood].filter(Boolean).join(' · ') || 'Wilayah / lingkungan belum diisi'}</p></div>
                    <Badge variant={row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'destructive' : 'warning'}>{statuses[row.status] ?? row.status}</Badge>
                  </div>
                  <dl className="space-y-2 text-sm">
                    {([['Ucapan Syukur', row.ucapan_syukur], ['Doa Arwah', row.doa_arwah], ['Permohonan Lainnya', row.permohonan_lainnya]] as const).filter(([, text]) => text).map(([label, text]) => (
                      <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap break-words">{text}</dd></div>
                    ))}
                  </dl>
                  <div className="border-t pt-3 space-y-1 text-xs text-muted-foreground">
                    <p>Stipendium: <span className="font-medium text-foreground">{row.stipendium === null ? 'Belum tercatat' : rupiah.format(row.stipendium)}</span></p>
                    <p>Pengajuan / pencatatan: {row.submitted_at ? formatWibDateTime(row.submitted_at) : '-'}</p>
                    <p>Diterima Sekretariat: {row.received_at ? formatWibDateTime(row.received_at) : 'Belum tercatat terpisah'}</p>
                  </div>
                </CardContent></Card>)}
              </div>
            </section>
          ))}
          <Pagination meta={data.meta} onPageChange={setPage} itemLabel="permohonan" />
        </>}
    </div>
  );
}
