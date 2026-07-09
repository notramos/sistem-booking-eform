/**
 * Client libur nasional Indonesia. Memakai `fetch` biasa (BUKAN apiClient
 * sanctum) karena ini API publik pihak ketiga tanpa auth/base-url internal.
 */

export interface Holiday {
  date: string; // yyyy-MM-dd (sudah dinormalisasi zero-padded)
  name: string;
  isNational: boolean;
}

interface HolidayApiItem {
  holiday_date: string;
  holiday_name: string;
  is_national_holiday: boolean;
}

/** API dapat mengembalikan tanggal tanpa zero-pad (mis. "2026-8-17"). */
function normalizeDate(raw: string): string {
  const [y, m, d] = raw.split('-');
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export async function fetchHolidays(year: number): Promise<Holiday[]> {
  const res = await fetch(`https://api-harilibur.vercel.app/api?year=${year}`);
  if (!res.ok) {
    throw new Error(`Holiday API error: ${res.status}`);
  }

  const data: HolidayApiItem[] = await res.json();
  return data.map((h) => ({
    date: normalizeDate(h.holiday_date),
    name: h.holiday_name,
    isNational: h.is_national_holiday,
  }));
}
