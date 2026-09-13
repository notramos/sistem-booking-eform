export const PUSH_SW_PATH = '/sw.js';

export function supportsPush(): boolean {
  return typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register(PUSH_SW_PATH, { scope: '/' });
}

export function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export function subscriptionPayload(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    keys: { p256dh: json.keys?.p256dh || '', auth: json.keys?.auth || '' },
    content_encoding: 'aes128gcm',
  };
}

export async function syncExistingPushSubscription(): Promise<void> {
  if (!supportsPush()) return;
  const registration = await registerPushServiceWorker();
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  const { pushSubscriptionsApi } = await import('@/lib/api/push-subscriptions');
  await pushSubscriptionsApi.save(subscriptionPayload(subscription));
}

export async function removeCurrentPushSubscription(): Promise<void> {
  if (!supportsPush()) return;
  const registration = await registerPushServiceWorker();
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  const { pushSubscriptionsApi } = await import('@/lib/api/push-subscriptions');
  await pushSubscriptionsApi.remove(subscription.endpoint);
  await subscription.unsubscribe();
}
