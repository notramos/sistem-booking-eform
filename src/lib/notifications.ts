import {
  CalendarDays, CheckCheck, XCircle, Clock, RotateCcw, Repeat, Heart, Send, Bell, type LucideIcon,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Notification } from '@/types';

interface NotificationMeta {
  icon: LucideIcon;
  tone: string;
  label: string;
}

/** Satu-satunya sumber ikon/label per tipe notifikasi — dipakai di Header (dropdown) dan halaman /notifications. */
const NOTIFICATION_META: Record<string, NotificationMeta> = {
  booking_created: { icon: CalendarDays, tone: 'text-blue-500', label: 'Booking baru diajukan' },
  booking_approved: { icon: CheckCheck, tone: 'text-green-500', label: 'Booking disetujui' },
  booking_rejected: { icon: XCircle, tone: 'text-red-500', label: 'Booking ditolak' },
  booking_cancelled: { icon: XCircle, tone: 'text-orange-500', label: 'Booking dibatalkan' },
  booking_reminder: { icon: Clock, tone: 'text-amber-500', label: 'Pengingat booking' },
  booking_moved_to_admin_review: { icon: Send, tone: 'text-purple-500', label: 'Diteruskan ke Admin' },
  booking_revision_requested: { icon: RotateCcw, tone: 'text-orange-500', label: 'Perlu revisi' },
  recurring_booking_created: { icon: Repeat, tone: 'text-blue-500', label: 'Booking rutin diajukan' },
  congregation_service_created: { icon: Heart, tone: 'text-rose-500', label: 'Permohonan pelayanan baru' },
};

export function getNotificationMeta(notification: Notification): NotificationMeta {
  return NOTIFICATION_META[notification.data?.type] ?? { icon: Bell, tone: 'text-muted-foreground', label: notification.data?.title ?? 'Notifikasi' };
}

export function getNotificationTitle(notification: Notification): string {
  return notification.data?.title ?? getNotificationMeta(notification).label;
}

export function getNotificationDescription(notification: Notification): string | null {
  const { data } = notification;
  switch (data?.type) {
    case 'booking_rejected':
    case 'booking_revision_requested':
      return data.reason ? `${data.room_name ?? ''}${data.room_name ? ' · ' : ''}"${data.reason}"` : data.room_name ?? null;
    case 'congregation_service_created':
      return data.applicant_name ? `${data.service_type_label ?? ''}${data.service_type_label ? ' · ' : ''}${data.applicant_name}` : null;
    case 'recurring_booking_created':
      return data.room_name && data.occurrence_count
        ? `${data.room_name} · ${data.occurrence_count} tanggal`
        : data.room_name ?? null;
    default:
      return data.room_name && data.booking_date
        ? `${data.room_name} · ${formatDate(data.booking_date)}`
        : data.room_name ?? null;
  }
}

/** Tujuan navigasi saat notifikasi diklik, atau null bila tidak ada target terkait. */
export function getNotificationHref(notification: Notification): string | null {
  const { data } = notification;
  if (data?.booking_id) return `/booking/${data.booking_id}`;
  if (data?.congregation_service_id) return `/layanan-umat/${data.congregation_service_id}`;
  return null;
}
