import apiClient from '@/lib/api-client';
import type { ApiResponse, PaginatedResponse, Room, RoomCategory, RoomFacility, RoomRecommendation, DayAvailability } from '@/types';

export const roomsApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient.get<PaginatedResponse<Room>>('/rooms', { params }),

  get: (id: string) => apiClient.get<ApiResponse<Room>>(`/rooms/${id}`),

  create: (data: FormData | Record<string, unknown>) => apiClient.post<ApiResponse<Room>>('/rooms', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put<ApiResponse<Room>>(`/rooms/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse>(`/rooms/${id}`),

  schedules: (id: string, start: string, end: string) =>
    apiClient.get<ApiResponse<{ id: string; title: string; booking_date: string; start_time: string; end_time: string; status: string }[]>>(`/rooms/${id}/schedules`, { params: { start, end } }),

  availability: (id: string, date: string, startTime: string, endTime: string) =>
    apiClient.get<ApiResponse<{ available: boolean }>>(`/rooms/${id}/availability`, { params: { date, start_time: startTime, end_time: endTime } }),

  recommendations: (date: string, attendees: number) =>
    apiClient.get<ApiResponse<RoomRecommendation[]>>('/rooms/recommendations', { params: { date, attendees } }),

  dayAvailability: (id: string, date: string) =>
    apiClient.get<ApiResponse<DayAvailability>>(`/rooms/${id}/day-availability`, { params: { date } }),

  uploadImage: (id: string, formData: FormData) =>
    apiClient.post<ApiResponse>(`/rooms/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  deleteImage: (roomId: string, imageId: string) =>
    apiClient.delete<ApiResponse>(`/rooms/${roomId}/images/${imageId}`),

  setPrimaryImage: (roomId: string, imageId: string) =>
    apiClient.put<ApiResponse>(`/rooms/${roomId}/images/${imageId}/primary`),

  categories: {
    list: () => apiClient.get<ApiResponse<RoomCategory[]>>('/room-categories'),
    create: (data: { name: string; description?: string }) =>
      apiClient.post<ApiResponse<RoomCategory>>('/room-categories', data),
    update: (id: string, data: Partial<RoomCategory>) =>
      apiClient.put<ApiResponse<RoomCategory>>(`/room-categories/${id}`, data),
    delete: (id: string) => apiClient.delete<ApiResponse>(`/room-categories/${id}`),
  },

  facilities: {
    list: () => apiClient.get<ApiResponse<RoomFacility[]>>('/room-facilities'),
    create: (data: { name: string; icon?: string }) =>
      apiClient.post<ApiResponse<RoomFacility>>('/room-facilities', data),
    update: (id: string, data: Partial<RoomFacility>) =>
      apiClient.put<ApiResponse<RoomFacility>>(`/room-facilities/${id}`, data),
    delete: (id: string) => apiClient.delete<ApiResponse>(`/room-facilities/${id}`),
  },
};
