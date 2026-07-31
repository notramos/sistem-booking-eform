'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Pagination } from '@/components/ui/pagination'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Bell, CheckCheck, ChevronRight } from 'lucide-react'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications'
import { getNotificationMeta, getNotificationTitle, getNotificationDescription, getNotificationHref } from '@/lib/notifications'
import { formatRelativeTime, cn } from '@/lib/utils'
import type { Notification } from '@/types'

/** Kelompok waktu supaya daftar panjang tetap mudah dipindai. */
function bucketOf(createdAt: string): string {
  const d = new Date(createdAt)
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 7)

  if (d >= startOfToday) return 'Hari ini'
  if (d >= startOfYesterday) return 'Kemarin'
  if (d >= startOfWeek) return '7 hari terakhir'
  return 'Lebih lama'
}

function NotificationRow({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const meta = getNotificationMeta(notification)
  const Icon = meta.icon
  const href = getNotificationHref(notification)
  const isUnread = !notification.read_at
  const description = getNotificationDescription(notification)

  const content = (
    <div className={cn('flex gap-3 px-4 py-3.5 sm:px-6 sm:py-4 transition group', href && 'hover:bg-muted/50', isUnread && 'bg-primary/[0.04]')}>
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', meta.bg)}>
        <Icon className={cn('h-4 w-4', meta.tone)} />
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-start gap-2">
          <p className={cn('text-sm leading-snug', isUnread ? 'font-semibold text-foreground' : 'text-foreground/90')}>
            {getNotificationTitle(notification)}
          </p>
          {isUnread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-label="Belum dibaca" />}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
        <p className="text-xs text-muted-foreground/70">{formatRelativeTime(notification.created_at)}</p>
      </div>
      {href && (
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 self-start text-muted-foreground/40 group-hover:text-primary" />
      )}
    </div>
  )

  if (!href) return content

  return (
    <Link href={href} onClick={() => isUnread && onRead(notification.id)} className="block">
      {content}
    </Link>
  )
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const { data, isLoading } = useNotifications({ page })
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications = useMemo(() => data?.data ?? [], [data])
  const meta = data?.meta
  const unreadCount = notifications.filter((n) => !n.read_at).length

  // Filter "belum dibaca" bekerja pada halaman yang sedang tampil — server tidak
  // menyediakan filter status baca, jadi paginasinya tetap milik daftar penuh.
  const visible = filter === 'unread' ? notifications.filter((n) => !n.read_at) : notifications

  const groups = useMemo(() => {
    const out: { label: string; items: Notification[] }[] = []
    for (const n of visible) {
      const label = bucketOf(n.created_at)
      const last = out[out.length - 1]
      if (last && last.label === label) last.items.push(n)
      else out.push({ label, items: [n] })
    }
    return out
  }, [visible])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Notifikasi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} belum dibaca di halaman ini`
              : 'Semua notifikasi di halaman ini sudah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2 self-start" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <CheckCheck className="h-4 w-4" />
            Tandai semua dibaca
          </Button>
        )}
      </div>

      <SegmentedControl
        options={[
          { value: 'all', label: `Semua${notifications.length ? ` (${notifications.length})` : ''}` },
          { value: 'unread', label: `Belum dibaca${unreadCount ? ` (${unreadCount})` : ''}` },
        ]}
        value={filter}
        onChange={(v) => setFilter(v as 'all' | 'unread')}
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <Spinner size="lg" center label="Memuat notifikasi..." />
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {filter === 'unread' ? 'Tidak ada notifikasi yang belum dibaca' : 'Belum ada notifikasi'}
              </p>
            </div>
          ) : (
            groups.map((group, gi) => (
              <div key={group.label}>
                <p className={cn(
                  'bg-muted/40 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:px-6',
                  gi > 0 && 'border-t'
                )}>
                  {group.label}
                </p>
                {group.items.map((notification, index) => (
                  <div key={notification.id}>
                    {index > 0 && <Separator />}
                    <NotificationRow notification={notification} onRead={(id) => markRead.mutate(id)} />
                  </div>
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Pagination meta={meta} onPageChange={setPage} itemLabel="notifikasi" />
    </div>
  )
}
