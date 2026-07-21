import apiClient, { ensureCsrfCookie } from '@/lib/api-client';
import type { ApiResponse, User } from '@/types';

export const authApi = {
  login: async (email: string, password: string) => {
    await ensureCsrfCookie();
    return apiClient.post<ApiResponse<{ user: User }>>('/auth/login', { email, password });
  },

  logout: () => apiClient.post('/auth/logout'),

  getUser: () => apiClient.get<ApiResponse<User>>('/auth/user'),

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse>('/auth/forgot-password', { email }),

  resetPassword: (token: string, email: string, password: string, passwordConfirmation: string) =>
    apiClient.post<ApiResponse>('/auth/reset-password', {
      token, email, password, password_confirmation: passwordConfirmation,
    }),

  registerStart: (phone: string) =>
    apiClient.post<ApiResponse>('/auth/register/start', { phone }),

  registerVerify: (phone: string, code: string) =>
    apiClient.post<ApiResponse<{ verification_token: string }>>('/auth/register/verify', { phone, code }),

  registerComplete: async (data: {
    phone: string; verification_token: string; email: string; name: string;
    password: string; password_confirmation: string;
    wilayah_id?: string; lingkungan_id?: string; parish?: string;
  }) => {
    await ensureCsrfCookie();
    return apiClient.post<ApiResponse<{ user: User }>>('/auth/register/complete', data);
  },
};
