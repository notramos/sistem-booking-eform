import apiClient from '@/lib/api-client';
import type { ApiResponse, Lingkungan, Wilayah } from '@/types';

export const parishApi = {
  wilayah: () => apiClient.get<ApiResponse<Wilayah[]>>('/wilayah'),
  getWilayah: (id: string) => apiClient.get<ApiResponse<Wilayah>>(`/wilayah/${id}`),
  createWilayah: (data: { name: string }) => apiClient.post<ApiResponse<Wilayah>>('/wilayah', data),
  updateWilayah: (id: string, data: { name: string }) => apiClient.put<ApiResponse<Wilayah>>(`/wilayah/${id}`, data),
  deleteWilayah: (id: string) => apiClient.delete<ApiResponse<null>>(`/wilayah/${id}`),
  getLingkungan: (id: string) => apiClient.get<ApiResponse<Lingkungan>>(`/lingkungan/${id}`),
  createLingkungan: (data: { wilayah_id: string; name: string; area?: string | null }) =>
    apiClient.post<ApiResponse<Lingkungan>>('/lingkungan', data),
  updateLingkungan: (id: string, data: { wilayah_id: string; name: string; area?: string | null }) =>
    apiClient.put<ApiResponse<Lingkungan>>(`/lingkungan/${id}`, data),
  deleteLingkungan: (id: string) => apiClient.delete<ApiResponse<null>>(`/lingkungan/${id}`),
};
