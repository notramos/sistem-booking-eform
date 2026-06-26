import apiClient from '@/lib/api-client';
import type { ApiResponse, PaginatedResponse, Notification } from '@/types';

export const notificationsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Notification>>('/notifications', { params }),

  unreadCount: () =>
    apiClient.get<ApiResponse<{ unread_count: number }>>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    apiClient.put<ApiResponse>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    apiClient.put<ApiResponse>('/notifications/read-all'),
};
