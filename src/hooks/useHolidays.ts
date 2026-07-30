'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchHolidays, type Holiday } from '@/lib/api/holidays';
import { easterSunday, addDays } from '@/lib/easter';

export interface HolidayInfo {
  name: string;
  isNational: boolean;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Libur yang tanggalnya ditetapkan pemerintah per tahun dan TIDAK bisa dihitung
 * (Idul Fitri, Idul Adha, Tahun Baru Islam, Isra Miraj, Nyepi, Waisak, Imlek,
 * serta cuti bersama). Sengaja dibiarkan kosong — tanggalnya tidak boleh ditebak.
 * Isi manual mengikuti SKB 3 Menteri tiap tahun, contoh:
 *
 *   2027: [
 *     { date: '2027-03-11', name: 'Hari Raya Nyepi' },
 *     { date: '2027-03-10', name: 'Idul Fitri' },
 *   ],
 */
const MANUAL_HOLIDAYS: Record<number, { date: string; name: string }[]> = {};

/**
 * Fallback statis: libur bertanggal tetap + hari raya gerejawi yang dihitung
 * dari tanggal Paskah tahun bersangkutan (selalu benar tanpa update manual).
 * Dipakai bila API libur tidak terjangkau, agar kalender tetap menandai
 * tanggal merah — termasuk hari-hari tersibuk paroki.
 */
function staticFallback(year: number): Holiday[] {
  const fixed = [
    { m: '01', d: '01', name: 'Tahun Baru Masehi' },
    { m: '05', d: '01', name: 'Hari Buruh Internasional' },
    { m: '06', d: '01', name: 'Hari Lahir Pancasila' },
    { m: '08', d: '17', name: 'Hari Kemerdekaan RI' },
    { m: '12', d: '25', name: 'Hari Raya Natal' },
  ].map((f) => ({ date: `${year}-${f.m}-${f.d}`, name: f.name, isNational: true }));

  const easter = easterSunday(year);
  // Paskah & Pentakosta selalu jatuh hari Minggu — bukan libur nasional
  // tersendiri, tapi tetap ditandai karena penting bagi jadwal paroki.
  const easterBased: Holiday[] = [
    { date: toDateStr(addDays(easter, -2)), name: 'Jumat Agung', isNational: true },
    { date: toDateStr(easter), name: 'Paskah', isNational: false },
    { date: toDateStr(addDays(easter, 39)), name: 'Kenaikan Isa Almasih', isNational: true },
    { date: toDateStr(addDays(easter, 49)), name: 'Pentakosta', isNational: false },
  ];

  const manual: Holiday[] = (MANUAL_HOLIDAYS[year] ?? []).map((h) => ({ ...h, isNational: true }));

  return [...fixed, ...easterBased, ...manual];
}

/**
 * Mengembalikan Map<'yyyy-MM-dd', HolidayInfo> untuk lookup O(1) per sel
 * kalender. Bila API gagal, otomatis memakai daftar libur statis.
 *
 * Catatan: api-harilibur.vercel.app sudah tidak gratis lagi (balas 402 Payment
 * Required) — query di-nonaktifkan (`enabled: false`) supaya tidak terus
 * memanggil endpoint yang pasti gagal tiap buka kalender, cukup pakai
 * `staticFallback` saja sampai ada sumber data libur nasional pengganti.
 */
export function useHolidays(year: number): Map<string, HolidayInfo> {
  const { data } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => fetchHolidays(year),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    enabled: false,
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
