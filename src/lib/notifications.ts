import {
  CalendarDays, CheckCheck, XCircle, Clock, RotateCcw, Repeat, Heart, Send, Bell, type LucideIcon,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Notification } from '@/types';

interface NotificationMeta {
  icon: LucideIcon;
  tone: string;
  /** Warna latar bulatan ikon — dipasangkan dengan `tone`. */
  bg: string;
  label: string;
}

/** Satu-satunya sumber ikon/label per tipe notifikasi — dipakai di Header (dropdown) dan halaman /notifications. */
const NOTIFICATION_META: Record<string, NotificationMeta> = {
  booking_created: { icon: CalendarDays, tone: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950', label: 'Booking baru diajukan' },
  booking_approved: { icon: CheckCheck, tone: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950', label: 'Booking disetujui' },
  booking_rejected: { icon: XCircle, tone: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950', label: 'Booking ditolak' },
  booking_cancelled: { icon: XCircle, tone: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-950', label: 'Booking dibatalkan' },
  booking_reminder: { icon: Clock, tone: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-950', label: 'Pengingat booking' },
  booking_moved_to_admin_review: { icon: Send, tone: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-950', label: 'Menunggu persetujuan Admin' },
  booking_forwarded_to_admin: { icon: Send, tone: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-950', label: 'Booking diteruskan ke Admin' },
  booking_revision_requested: { icon: RotateCcw, tone: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-950', label: 'Perlu revisi' },
  recurring_booking_created: { icon: Repeat, tone: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950', label: 'Booking rutin diajukan' },
  congregation_service_created: { icon: Heart, tone: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-950', label: 'Permohonan pelayanan baru' },
  congregation_service_approved: { icon: CheckCheck, tone: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950', label: 'Permohonan pelayanan disetujui' },
  congregation_service_rejected: { icon: XCircle, tone: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950', label: 'Permohonan pelayanan ditolak' },
};

export function getNotificationMeta(notification: Notification): NotificationMeta {
  return NOTIFICATION_META[notification.data?.type] ?? {
    icon: Bell,
    tone: 'text-muted-foreground',
    bg: 'bg-muted',
    label: notification.data?.title ?? 'Notifikasi',
  };
}

/**
 * Judul baris notifikasi. `data.title` pada notifikasi booking berisi nama
 * PEMINJAM (dulu judul kegiatan), jadi tidak bisa dipakai sebagai judul apa
 * adanya — label per tipe lebih menjelaskan apa yang terjadi, dan nama
 * peminjamnya ikut tampil di baris deskripsi.
 */
export function getNotificationTitle(notification: Notification): string {
  return getNotificationMeta(notification).label;
}

/** Baris ringkas "apa & kapan" di bawah judul. */
export function getNotificationDescription(notification: Notification): string | null {
  const { data } = notification;
  if (!data) return null;

  const bookingWhen = () => {
    const parts: string[] = [];
    if (data.room_name) parts.push(data.room_name);
    if (data.booking_date) parts.push(formatDate(data.booking_date));
    if (data.start_time && data.end_time) parts.push(`${data.start_time}-${data.end_time}`);
    return parts;
  };

  switch (data.type) {
    case 'congregation_service_created':
      return [data.service_type_label, data.applicant_name, data.contact].filter(Boolean).join(' · ') || null;

    case 'congregation_service_approved':
      return [
        data.service_type_label,
        data.applicant_name,
        data.service_date ? formatDate(data.service_date) : null,
      ].filter(Boolean).join(' · ') || null;

    case 'congregation_service_rejected': {
      const info = [data.service_type_label, data.applicant_name].filter(Boolean).join(' · ');
      return data.reason ? `${info}${info ? ' · ' : ''}Alasan: ${data.reason}` : info || null;
    }

    case 'recurring_booking_created': {
      const parts = [data.title, data.room_name].filter(Boolean);
      if (data.occurrence_count) parts.push(`${data.occurrence_count} tanggal`);
      return parts.join(' · ') || null;
    }

    case 'booking_rejected':
    case 'booking_revision_requested': {
      const info = [data.title, ...bookingWhen()].filter(Boolean).join(' · ');
      return data.reason ? `${info}${info ? ' · ' : ''}Alasan: ${data.reason}` : info || null;
    }

    default:
      return [data.title, ...bookingWhen()].filter(Boolean).join(' · ') || null;
  }
}

/** Tujuan navigasi saat notifikasi diklik, atau null bila tidak ada target terkait. */
export function getNotificationHref(notification: Notification): string | null {
  const { data } = notification;
  if (data?.booking_id) return `/booking/${data.booking_id}`;
  if (data?.congregation_service_id) return `/layanan-umat/${data.congregation_service_id}`;
  return null;
}
