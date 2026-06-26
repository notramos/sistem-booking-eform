import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Menunggu',
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
    admin: 'bg-purple-100 text-purple-800',
    sekretariat: 'bg-blue-100 text-blue-800',
    jemaat: 'bg-green-100 text-green-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Admin Gereja',
    sekretariat: 'Sekretariat',
    jemaat: 'Jemaat',
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
