import apiClient from '@/lib/api-client';
import type { ApiResponse, PaginatedResponse, Booking, CalendarEvent } from '@/types';

export const bookingsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Booking>>('/bookings', { params }),

  get: (id: string) => apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`),

  create: (data: {
    room_id: string; title: string; description?: string; booking_date: string;
    start_time: string; end_time: string; purpose_type?: string;
    expected_attendees?: number; notes?: string;
  }) => apiClient.post<ApiResponse<Booking>>('/bookings', data),

  update: (id: string, data: Partial<Pick<Booking, 'title' | 'description' | 'start_time' | 'end_time' | 'notes'>>) =>
    apiClient.put<ApiResponse<Booking>>(`/bookings/${id}`, data),

  cancel: (id: string) => apiClient.delete<ApiResponse>(`/bookings/${id}`),

  myBookings: (status?: string, page?: number, search?: string, perPage?: number) =>
    apiClient.get<PaginatedResponse<Booking>>('/bookings/my', {
      params: {
        status: status || undefined,
        page: page || undefined,
        search: search || undefined,
        per_page: perPage || undefined,
      },
    }),

  sign: (id: string, data: { role: 'pemohon' | 'petugas'; signature: string }) =>
    apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/signature`, data),

  pending: (page?: number) =>
    apiClient.get<PaginatedResponse<Booking>>('/bookings/pending', { params: page ? { page } : {} }),

  calendar: (start: string, end: string, roomId?: string) =>
    apiClient.get<ApiResponse<CalendarEvent[]>>('/bookings/calendar', { params: { start, end, room_id: roomId } }),

  approve: (id: string, notes?: string) =>
    apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/approve`, { notes }),

  reject: (id: string, reason: string) =>
    apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/reject`, { reason }),
};
