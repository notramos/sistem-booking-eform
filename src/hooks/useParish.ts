'use client';

import { useQuery } from '@tanstack/react-query';
import { parishApi } from '@/lib/api/parish';

export function useWilayah() {
  return useQuery({
    queryKey: ['wilayah'],
    queryFn: async () => {
      const res = await parishApi.wilayah();
      return res.data.data;
    },
    staleTime: 1000 * 60 * 30, // data master jarang berubah
  });
}
