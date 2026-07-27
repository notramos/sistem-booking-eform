import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Batas atas tanggal booking (biasa/realokasi) — akhir tahun berjalan, kecuali
 * mulai November naik ke akhir tahun depan (mirror BookingService::maxBookableDate
 * di backend — supaya date-picker tidak biarkan pilih tanggal yang nanti ditolak
 * server, tapi validasi sesungguhnya tetap di backend).
 */
export function getMaxBookableDate(): Date {
  const now = new Date();
  const targetYear = now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(targetYear, 11, 31);
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'full' = 'short'): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions =
    format === 'short' ? { day: 'numeric', month: 'short', year: 'numeric' }
    : format === 'long' ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  return d.toLocaleDateString('id-ID', options);
}

export function formatTime(time: string): string {
  return time.substring(0, 5);
}

/** Waktu relatif singkat ("baru saja", "5 menit lalu", "2 hari lalu"), fallback ke tanggal absolut setelah 7 hari. */
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const diffSeconds = Math.round((Date.now() - d.getTime()) / 1000);

  if (diffSeconds < 60) return 'baru saja';
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDate(d);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    sekretariat_review: 'bg-sky-100 text-sky-800 border-sky-200',
    revision_sekretariat: 'bg-orange-100 text-orange-800 border-orange-200',
    admin_review: 'bg-purple-100 text-purple-800 border-purple-200',
    revision_admin: 'bg-orange-100 text-orange-800 border-orange-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Menunggu Review',
    sekretariat_review: 'Ditinjau Sekretariat',
    revision_sekretariat: 'Perlu Revisi (Sekretariat)',
    admin_review: 'Ditinjau Admin',
    revision_admin: 'Perlu Revisi (Admin)',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    cancelled: 'Dibatalkan',
    completed: 'Selesai',
  };
  return labels[status] || status;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    it_admin: 'bg-purple-100 text-purple-800',
    p2: 'bg-indigo-100 text-indigo-800',
    pastor: 'bg-amber-100 text-amber-800',
    sekretariat: 'bg-blue-100 text-blue-800',
    umat: 'bg-green-100 text-green-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    it_admin: 'IT Admin',
    p2: 'P2',
    pastor: 'Pastor',
    sekretariat: 'Sekretariat',
    umat: 'Umat',
  };
  return labels[role] || role;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
