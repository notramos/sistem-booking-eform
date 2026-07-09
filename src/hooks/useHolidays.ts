'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchHolidays, type Holiday } from '@/lib/api/holidays';

export interface HolidayInfo {
  name: string;
  isNational: boolean;
}

/**
 * Fallback statis: libur nasional bertanggal tetap. Dipakai bila API libur
 * tidak terjangkau, agar kalender tetap mewarnai tanggal merah utama.
 */
function staticFallback(year: number): Holiday[] {
  const fixed = [
    { m: '01', d: '01', name: 'Tahun Baru Masehi' },
    { m: '05', d: '01', name: 'Hari Buruh Internasional' },
    { m: '06', d: '01', name: 'Hari Lahir Pancasila' },
    { m: '08', d: '17', name: 'Hari Kemerdekaan RI' },
    { m: '12', d: '25', name: 'Hari Raya Natal' },
  ];
  return fixed.map((f) => ({ date: `${year}-${f.m}-${f.d}`, name: f.name, isNational: true }));
}

/**
 * Mengembalikan Map<'yyyy-MM-dd', HolidayInfo> untuk lookup O(1) per sel
 * kalender. Bila API gagal, otomatis memakai daftar libur statis.
 */
export function useHolidays(year: number): Map<string, HolidayInfo> {
  const { data } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => fetchHolidays(year),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    placeholderData: () => staticFallback(year),
  });

  return useMemo(() => {
    const list = data ?? staticFallback(year);
    const map = new Map<string, HolidayInfo>();
    for (const h of list) {
      map.set(h.date, { name: h.name, isNational: h.isNational });
    }
    return map;
  }, [data, year]);
}
