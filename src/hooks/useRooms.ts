'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '@/lib/api/rooms';
import type { Room } from '@/types';

export function useRooms(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: ['rooms', params],
    queryFn: async () => {
      const res = await roomsApi.list(params);
      return res.data;
    },
  });
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: ['rooms', id],
    queryFn: async () => {
      const res = await roomsApi.get(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useRoomCategories() {
  return useQuery({
    queryKey: ['room-categories'],
    queryFn: async () => {
      const res = await roomsApi.categories.list();
      return res.data.data;
    },
  });
}

export function useRoomFacilities() {
  return useQuery({
    queryKey: ['room-facilities'],
    queryFn: async () => {
      const res = await roomsApi.facilities.list();
      return res.data.data;
    },
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData | Record<string, unknown>) => roomsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); },
  });
}

export function useUpdateRoom(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => roomsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); },
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); },
  });
}
