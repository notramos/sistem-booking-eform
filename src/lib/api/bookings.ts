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

  myBookings: (status?: string) =>
    apiClient.get<ApiResponse<Booking[]>>('/bookings/my', { params: status ? { status } : {} }),

  pending: (page?: number) =>
    apiClient.get<PaginatedResponse<Booking>>('/bookings/pending', { params: page ? { page } : {} }),

  calendar: (start: string, end: string, roomId?: string) =>
    apiClient.get<ApiResponse<CalendarEvent[]>>('/bookings/calendar', { params: { start, end, room_id: roomId } }),

  approve: (id: string, notes?: string) =>
    apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/approve`, { notes }),

  reject: (id: string, reason: string) =>
    apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/reject`, { reason }),

  serviceBooking: (data: {
    room_id: string; booking_date: string; start_time: string; end_time: string;
    service_type: string; contact: string;
    dynamic_fields?: Record<string, string>;
    equipment?: string[]; other_equipment?: string; notes?: string;
  }) => apiClient.post<ApiResponse<Booking>>('/bookings/service', data),
};
