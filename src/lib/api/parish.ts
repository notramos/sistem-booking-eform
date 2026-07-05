import apiClient from '@/lib/api-client';
import type { ApiResponse, Wilayah } from '@/types';

export const parishApi = {
  wilayah: () => apiClient.get<ApiResponse<Wilayah[]>>('/wilayah'),
};
