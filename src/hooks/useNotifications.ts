'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationsApi } from '@/lib/api/notifications';

export function useNotifications(params?: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const res = await notificationsApi.list(params);
      return res.data;
    },
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await notificationsApi.unreadCount();
      return res.data.data;
    },
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      toast.success('Semua notifikasi ditandai telah dibaca');
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal menandai notifikasi');
    },
  });
}
