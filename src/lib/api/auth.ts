import apiClient from '@/lib/api-client';
import type { ApiResponse, User } from '@/types';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { email, password }),

  logout: () => apiClient.post('/auth/logout'),

  getUser: () => apiClient.get<ApiResponse<User>>('/auth/user'),

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse>('/auth/forgot-password', { email }),

  resetPassword: (token: string, email: string, password: string, passwordConfirmation: string) =>
    apiClient.post<ApiResponse>('/auth/reset-password', {
      token, email, password, password_confirmation: passwordConfirmation,
    }),
};
