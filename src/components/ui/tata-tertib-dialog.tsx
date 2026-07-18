'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TATA_TERTIB_TEXT, TATA_TERTIB_STORAGE_KEY } from '@/lib/constants';

interface TataTertibDialogProps {
  open: boolean;
  onAccepted: () => void;
}

/**
 * Popup wajib (tanpa tombol tutup/klik-backdrop) — pengguna harus mencentang
 * & menekan "Saya Setuju" sebelum bisa memakai aplikasi. Ditampilkan sekali
 * per browser (lihat AppShell.tsx), jawaban disimpan di localStorage.
 */
export function TataTertibDialog({ open, onAccepted }: TataTertibDialogProps) {
  const [checked, setChecked] = useState(false);

  if (!open) return null;

  const handleAccept = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TATA_TERTIB_STORAGE_KEY, '1');
    }
    onAccepted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" />
      <div className="relative z-10 grid w-full max-w-lg gap-4 rounded-lg border bg-background p-6 shadow-lg m-4">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold leading-none tracking-tight">Tata Tertib Penggunaan Aplikasi</h2>
          <p className="text-sm text-muted-foreground">
            Mohon baca dan setujui tata tertib berikut sebelum melanjutkan.
          </p>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-line text-foreground">
          {TATA_TERTIB_TEXT}
        </div>

        <Checkbox
          id="tata-tertib-agree"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          label="Saya telah membaca dan menyetujui tata tertib di atas."
        />

        <div className="flex justify-end">
          <Button type="button" onClick={handleAccept} disabled={!checked}>
            Saya Setuju
          </Button>
        </div>
      </div>
    </div>
  );
}
