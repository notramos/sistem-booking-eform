'use client';

import { useState } from 'react';
import { Bell, BellOff, Check, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/** Status push perangkat di menu lonceng. Kotak masuk tetap dapat dibuka tanpa izin push. */
export function PushNotificationSettings() {
  const push = usePushNotifications();
  const [showManage, setShowManage] = useState(false);

  return (
    <div className="border-b border-border/70 bg-muted/20 px-4 py-3">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Notifikasi perangkat</p>
      {push.loading ? (
        <p className="text-xs text-muted-foreground" role="status">Memeriksa status perangkat...</p>
      ) : !push.supported ? (
        <p className="text-xs leading-relaxed text-muted-foreground">Push belum tersedia di sini. Di iPhone, pasang AlbertusKU ke layar utama lalu buka dari ikon aplikasi.</p>
      ) : push.permission === 'denied' ? (
        <p className="text-xs leading-relaxed text-muted-foreground">Izin push diblokir. Ubah izin AlbertusKU di pengaturan situs atau perangkat. Pesan di aplikasi tetap bisa dibaca.</p>
      ) : push.enabled ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Check className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" /> Push aktif di perangkat ini
            </span>
            <button type="button" aria-expanded={showManage} onClick={() => setShowManage((value) => !value)} className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Kelola</button>
          </div>
          {showManage && (
            <div className="flex flex-wrap gap-1.5 rounded-lg border bg-background p-1.5">
              <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => { void push.test().catch(() => undefined); }} disabled={push.loading}>
                <Bell className="mr-1.5 h-3.5 w-3.5" /> Tes notifikasi
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => { void push.disable().catch(() => undefined); }} disabled={push.loading}>
                <BellOff className="mr-1.5 h-3.5 w-3.5" /> Nonaktifkan push
              </Button>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">Pesan di aplikasi tetap tersedia meski push dinonaktifkan.</p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium text-foreground"><Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Push belum aktif</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">Dapatkan kabar perubahan status di perangkat ini.</p>
          </div>
          <Button type="button" size="sm" className="h-8 shrink-0 px-2.5 text-xs" onClick={() => { void push.enable().catch(() => undefined); }} disabled={push.loading}>Aktifkan</Button>
        </div>
      )}
    </div>
  );
}
