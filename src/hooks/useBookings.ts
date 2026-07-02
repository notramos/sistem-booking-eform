'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bookingsApi } from '@/lib/api/bookings';

export function useBookings(params?: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => {
      const res = await bookingsApi.list(params);
      return res.data;
    },
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: async () => {
      const res = await bookingsApi.get(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useMyBookings(status?: string) {
  return useQuery({
    queryKey: ['my-bookings', status],
    queryFn: async () => {
      const res = await bookingsApi.myBookings(status);
      return res.data.data;
    },
  });
}

export function usePendingBookings(enabled: boolean = true, page: number = 1) {
  return useQuery({
    queryKey: ['pending-bookings', page],
    queryFn: async () => {
      const res = await bookingsApi.pending(page);
      return res.data;
    },
    refetchInterval: 60_000,
    enabled,
  });
}

export function useCalendarEvents(start: string, end: string, roomId?: string) {
  return useQuery({
    queryKey: ['calendar-events', start, end, roomId],
    queryFn: async () => {
      const res = await bookingsApi.calendar(start, end, roomId);
      return res.data.data;
    },
    enabled: !!start && !!end,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof bookingsApi.create>[0]) => bookingsApi.create(data),
    onSuccess: () => {
      toast.success('Booking berhasil dibuat');
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      qc.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal membuat booking');
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => {
      toast.success('Booking berhasil dibatalkan');
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      qc.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal membatalkan booking');
    },
  });
}

export function useApproveBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => bookingsApi.approve(id, notes),
    onSuccess: () => {
      toast.success('Booking berhasil disetujui');
      qc.invalidateQueries({ queryKey: ['pending-bookings'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal menyetujui booking');
    },
  });
}

export function useCreateServiceBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof bookingsApi.serviceBooking>[0]) => bookingsApi.serviceBooking(data),
    onSuccess: () => {
      toast.success('Permohonan pelayanan gereja berhasil dikirim');
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      qc.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal mengirim permohonan pelayanan');
    },
  });
}

export function useRejectBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => bookingsApi.reject(id, reason),
    onSuccess: () => {
      toast.success('Booking berhasil ditolak');
      qc.invalidateQueries({ queryKey: ['pending-bookings'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      qc.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal menolak booking');
    },
  });
}
