import { getMisaDeadline, formatWibDateTime } from '@/lib/misa-deadline';

export function MisaDeadlineNotice({ date = '', time = '' }: { date?: string; time?: string }) {
  const deadline = getMisaDeadline(date, time);
  return (
    <aside className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm space-y-2" aria-label="Batas pengajuan Intensi Misa">
      <p className="font-semibold">Batas pengajuan Intensi Misa</p>
      {deadline && <p aria-live="polite" className="font-medium">Untuk jadwal yang dipilih: {formatWibDateTime(deadline)}.</p>}
      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
        <li>Misa pagi 06.30: sehari sebelumnya pukul 12.00 WIB.</li>
        <li>Misa harian sore/malam, termasuk Sabtu sore: hari pelaksanaan pukul 12.00 WIB.</li>
        <li>Semua Misa Minggu: Sabtu pukul 12.00 WIB.</li>
      </ul>
    </aside>
  );
}
