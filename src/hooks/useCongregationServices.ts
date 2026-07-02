'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { congregationServicesApi } from '@/lib/api/congregation-services';

export function useCongregationServices(params?: { status?: string; service_type?: string; page?: number }) {
  return useQuery({
    queryKey: ['congregation-services', params],
    queryFn: async () => {
      const res = await congregationServicesApi.list(params);
      return res.data;
    },
  });
}

export function useCongregationService(id: string) {
  return useQuery({
    queryKey: ['congregation-services', id],
    queryFn: async () => {
      const res = await congregationServicesApi.get(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCongregationService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof congregationServicesApi.create>[0]) =>
      congregationServicesApi.create(data),
    onSuccess: () => {
      toast.success('Permohonan pelayanan umat berhasil dikirim');
      queryClient.invalidateQueries({ queryKey: ['congregation-services'] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal mengirim permohonan');
    },
  });
}

export function useApproveCongregationService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      congregationServicesApi.approve(id, notes),
    onSuccess: () => {
      toast.success('Permohonan berhasil disetujui');
      queryClient.invalidateQueries({ queryKey: ['congregation-services'] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal menyetujui permohonan');
    },
  });
}

export function useRejectCongregationService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      congregationServicesApi.reject(id, reason),
    onSuccess: () => {
      toast.success('Permohonan berhasil ditolak');
      queryClient.invalidateQueries({ queryKey: ['congregation-services'] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal menolak permohonan');
    },
  });
}
