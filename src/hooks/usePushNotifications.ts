'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { pushSubscriptionsApi } from '@/lib/api/push-subscriptions';
import { registerPushServiceWorker, subscriptionPayload, supportsPush, urlBase64ToUint8Array } from '@/lib/push';

const FALLBACK_VAPID_PUBLIC_KEY = 'BHQuTe07ZecWUhFd7RC7l_775ZXfDHgANq71d4GhM0yx96fv_WynMZmUDEx-IX6ZMLvilEKMF2DGyhsEBYpX1rI';

type PushState = 'unsupported' | 'default' | 'granted' | 'denied';

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushState>('default');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supportsPush()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPermission('unsupported');
      setLoading(false);
      return;
    }
    setPermission(Notification.permission);
    registerPushServiceWorker()
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setEnabled(Boolean(subscription)))
      .finally(() => setLoading(false));
  }, []);

  const enable = useCallback(async () => {
    if (!supportsPush()) throw new Error('Browser ini belum mendukung notifikasi push.');
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || FALLBACK_VAPID_PUBLIC_KEY;
    if (!publicKey) throw new Error('Konfigurasi notifikasi belum lengkap.');
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') throw new Error('Izin notifikasi belum diberikan.');
      const registration = await registerPushServiceWorker();
      const existing = await registration.pushManager.getSubscription();
      // Hapus subscription lama agar perangkat tidak memakai VAPID key dari
      // deployment sebelumnya.
      if (existing) await existing.unsubscribe();
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource });
      await pushSubscriptionsApi.save(subscriptionPayload(subscription));
      setEnabled(true);
      toast.success('Notifikasi AlbertusKU berhasil diaktifkan');
    } catch (error) {
      const message = error instanceof DOMException && error.name === 'AbortError'
        ? 'Layanan push browser sedang gagal dihubungi. Coba matikan VPN/proxy, lalu ulangi beberapa saat lagi.'
        : error instanceof Error ? error.message : 'Notifikasi belum dapat diaktifkan.';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await registerPushServiceWorker();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await pushSubscriptionsApi.remove(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setEnabled(false);
      toast.success('Notifikasi AlbertusKU dinonaktifkan');
    } finally {
      setLoading(false);
    }
  }, []);

  const test = useCallback(async () => {
    await pushSubscriptionsApi.test();
    toast.success('Notifikasi percobaan dikirim');
  }, []);

  return { supported: permission !== 'unsupported', permission, enabled, loading, enable, disable, test };
}
