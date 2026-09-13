'use client';

import { Bell, BellOff, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationSettings() {
  const push = usePushNotifications();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Bell className="h-5 w-5" />Notifikasi AlbertusKU</CardTitle>
        <CardDescription>Terima kabar saat peminjaman ruangan atau permohonan pelayanan berubah status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!push.supported ? (
          <p className="text-sm text-muted-foreground">Browser ini belum mendukung push notification. Gunakan Chrome, Edge, Firefox, atau AlbertusKU yang dipasang ke layar utama iPhone.</p>
        ) : push.permission === 'denied' ? (
          <p className="text-sm text-muted-foreground">Izin notifikasi ditolak. Aktifkan kembali izin notifikasi AlbertusKU melalui pengaturan situs di browser.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-auto flex items-center gap-2 text-sm text-muted-foreground"><Smartphone className="h-4 w-4" />{push.enabled ? 'Notifikasi aktif di perangkat ini' : 'Notifikasi belum aktif di perangkat ini'}</span>
            {push.enabled ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => void push.test()} disabled={push.loading}><Bell className="mr-1.5 h-4 w-4" />Tes Notifikasi</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => void push.disable()} disabled={push.loading}><BellOff className="mr-1.5 h-4 w-4" />Nonaktifkan</Button>
              </>
            ) : (
              <Button type="button" size="sm" onClick={() => void push.enable()} disabled={push.loading}><Bell className="mr-1.5 h-4 w-4" />Aktifkan Notifikasi</Button>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">Pada iPhone, pasang AlbertusKU ke layar utama terlebih dahulu, lalu aktifkan notifikasi dari tombol ini.</p>
      </CardContent>
    </Card>
  );
}
