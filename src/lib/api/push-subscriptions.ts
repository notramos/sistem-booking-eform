import apiClient from '@/lib/api-client';

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  content_encoding?: string;
}

export const pushSubscriptionsApi = {
  save: (data: PushSubscriptionPayload) => apiClient.post('/push-subscriptions', data),
  remove: (endpoint: string) => apiClient.delete('/push-subscriptions', { data: { endpoint } }),
  test: () => apiClient.post('/push-subscriptions/test'),
};
