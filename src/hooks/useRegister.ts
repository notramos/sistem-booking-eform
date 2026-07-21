'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';

export function useRegisterStart() {
  return useMutation({
    mutationFn: (phone: string) => authApi.registerStart(phone),
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal mengirim kode verifikasi');
    },
  });
}

export function useRegisterVerify() {
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => authApi.registerVerify(phone, code),
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Kode verifikasi salah');
    },
  });
}

export function useRegisterComplete() {
  return useMutation({
    mutationFn: (data: Parameters<typeof authApi.registerComplete>[0]) => authApi.registerComplete(data),
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal menyelesaikan registrasi');
    },
  });
}
