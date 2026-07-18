'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';

export function useRegisterStart() {
  return useMutation({
    mutationFn: (email: string) => authApi.registerStart(email),
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal mengirim kode verifikasi');
    },
  });
}

export function useRegisterVerify() {
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => authApi.registerVerify(email, code),
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
