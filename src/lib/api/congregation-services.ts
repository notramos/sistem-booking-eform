import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export interface CongregationService {
  id: string;
  service_type: string;
  applicant_name: string;
  address: string | null;
  contact: string;
  service_date: string | null;
  description: string;
  status: string;
  notes: string | null;
  dynamic_fields: Record<string, string> | null;
  created_at: string;
}

export const congregationServicesApi = {
  create: (data: {
    service_type: string; applicant_name: string; address?: string;
    contact: string; service_date?: string; description: string;
    dynamic_fields?: Record<string, string>;
  }) => apiClient.post<ApiResponse<CongregationService>>('/congregation-services', data),
};
