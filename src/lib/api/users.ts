import apiClient from '@/lib/api-client';
import type { ApiResponse, PaginatedResponse, User } from '@/types';

export const usersApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<User>>('/users', { params }),

  get: (id: string) => apiClient.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: { name: string; email: string; password: string; role: string; phone?: string; department?: string; nip?: string }) =>
    apiClient.post<ApiResponse<User>>('/users', data),

  update: (id: string, data: Partial<User & { role?: string }>) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse>(`/users/${id}`),

  toggleActive: (id: string) => apiClient.put<ApiResponse<User>>(`/users/${id}/activate`),

  assignRoles: (id: string, roles: string[]) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}/roles`, { roles }),

  profile: {
    get: () => apiClient.get<ApiResponse<User>>('/profile'),
    update: (data: { name?: string; phone?: string; department?: string; position?: string }) =>
      apiClient.put<ApiResponse<User>>('/profile', data),
    changePassword: (currentPassword: string, newPassword: string, newPasswordConfirmation: string) =>
      apiClient.put<ApiResponse>('/profile/password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      }),
    uploadAvatar: (formData: FormData) =>
      apiClient.post<ApiResponse<{ avatar_url: string }>>('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    updateSignature: (signature: string | null) =>
      apiClient.put<ApiResponse<User>>('/profile/signature', { signature }),
  },
};
