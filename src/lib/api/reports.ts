import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export const reportsApi = {
  bookings: (params?: Record<string, string | undefined>) =>
    apiClient.get('/reports/bookings', { params }),

  roomUtilization: (params?: Record<string, string | undefined>) =>
    apiClient.get('/reports/room-utilization', { params }),

  userActivity: (params?: Record<string, string | undefined>) =>
    apiClient.get('/reports/user-activity', { params }),

  monthly: (year: string, month: string) =>
    apiClient.get<ApiResponse<{
      total_bookings: number; approved_bookings: number; rejected_bookings: number;
      cancelled_bookings: number; total_rooms_used: number; unique_users: number;
      status_breakdown: Record<string, number>; purpose_breakdown: Record<string, number>;
    }>>('/reports/monthly', { params: { year, month } }),

  exportPdf: (type: string, params?: Record<string, string | undefined>) =>
    apiClient.get('/reports/export/pdf', { params: { type, ...params }, responseType: 'blob' }),

  exportExcel: (type: string, params?: Record<string, string | undefined>) =>
    apiClient.get('/reports/export/excel', { params: { type, ...params }, responseType: 'blob' }),
};

export const auditLogsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get('/audit-logs', { params }),
};

export const maintenanceApi = {
  list: (params?: Record<string, string | undefined>) =>
    apiClient.get('/maintenance-schedules', { params }),

  create: (data: {
    room_id: string; title: string; description?: string;
    start_date: string; end_date: string; start_time?: string; end_time?: string; is_all_day?: boolean;
  }) => apiClient.post('/maintenance-schedules', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/maintenance-schedules/${id}`, data),

  delete: (id: string) => apiClient.delete(`/maintenance-schedules/${id}`),
};
