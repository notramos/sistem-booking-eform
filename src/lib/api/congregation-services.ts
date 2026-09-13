import apiClient from '@/lib/api-client';
import type { ApiResponse, CongregationService, PaginatedResponse } from '@/types';

export interface CreateCongregationServicePayload {
  service_type: string;
  applicant_name: string;
  applicant_gender?: string;
  baptismal_name?: string;
  birth_place?: string;
  birth_date?: string;
  address?: string;
  contact: string;
  phone?: string;
  mobile_phone?: string;
  neighborhood?: string;
  region?: string;
  parish?: string;
  father_name?: string;
  father_religion?: string;
  mother_name?: string;
  mother_religion?: string;
  school?: string;
  grade?: string;
  occupation?: string;
  family_card_number?: string;
  service_date?: string;
  description?: string;
  dynamic_fields?: Record<string, string>;
}

export interface CreateManualCongregationServicePayload extends CreateCongregationServicePayload {
  received_at?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const congregationServicesApi = {
  list: (params?: { status?: string; service_type?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<CongregationService>>('/congregation-services', { params }),

  get: (id: string) =>
    apiClient.get<ApiResponse<CongregationService>>(`/congregation-services/${id}`),

  create: (data: CreateCongregationServicePayload) =>
    apiClient.post<ApiResponse<CongregationService>>('/congregation-services', data),

  createManual: (data: CreateManualCongregationServicePayload) =>
    apiClient.post<ApiResponse<CongregationService>>('/congregation-services/manual', data),

  adminUpdate: (id: string, data: Partial<Pick<CongregationService, 'applicant_name' | 'contact' | 'region' | 'neighborhood' | 'service_date' | 'status' | 'description' | 'notes' | 'dynamic_fields'>>) =>
    apiClient.patch<ApiResponse<CongregationService>>(`/congregation-services/${id}/admin`, data),

  remove: (id: string) => apiClient.delete<ApiResponse>(`/congregation-services/${id}`),

  approve: (id: string, notes?: string) =>
    apiClient.post<ApiResponse<CongregationService>>(`/congregation-services/${id}/approve`, { notes }),

  reject: (id: string, reason: string) =>
    apiClient.post<ApiResponse<CongregationService>>(`/congregation-services/${id}/reject`, { reason }),
};
