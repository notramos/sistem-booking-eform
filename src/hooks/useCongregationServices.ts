'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { congregationServicesApi } from '@/lib/api/congregation-services';

export function useCreateCongregationService() {
  return useMutation({
    mutationFn: (data: Parameters<typeof congregationServicesApi.create>[0]) =>
      congregationServicesApi.create(data),
    onSuccess: () => {
      toast.success('Permohonan pelayanan umat berhasil dikirim');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal mengirim permohonan');
    },
  });
}
