'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { Pagination } from '@/components/ui/pagination'
import { Bell, BellRing, CheckCheck, Clock } from 'lucide-react'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications'
import { getNotificationMeta, getNotificationTitle, getNotificationDescription, getNotificationHref } from '@/lib/notifications'
import { formatRelativeTime, cn } from '@/lib/utils'
import type { Notification } from '@/types'

function NotificationRow({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const meta = getNotificationMeta(notification)
  const Icon = meta.icon
  const href = getNotificationHref(notification)
  const isUnread = !notification.read_at
  const description = getNotificationDescription(notification)

  const content = (
    <div
      className={cn(
        'flex gap-4 px-6 py-4 transition hover:bg-muted/50',
        isUnread && 'bg-muted/30'
      )}
    >
      <div className="mt-0.5 flex-shrink-0">
        <Icon className={cn('h-4 w-4', meta.tone)} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className={cn('text-sm', isUnread && 'font-medium')}>
            {getNotificationTitle(notification)}
          </p>
          {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden />}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>
      </div>
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
  const { data, isLoading } = useNotifications({ page })
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications = data?.data ?? []
  const meta = data?.meta
  const unreadCount = notifications.filter((n) => !n.read_at).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifikasi</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0
              ? `Anda punya ${unreadCount} notifikasi belum dibaca di halaman ini`
              : 'Tidak ada notifikasi belum dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            Tandai semua dibaca
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BellRing className="h-5 w-5" />
            Kotak Masuk
          </CardTitle>
          <CardDescription>
            Semua notifikasi Anda dalam satu tempat — klik untuk membuka detail terkait
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[70vh] max-h-[600px]">
            {isLoading ? (
              <Spinner size="lg" center />
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Bell className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Belum ada notifikasi</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div key={notification.id}>
                  {index > 0 && <Separator />}
                  <NotificationRow notification={notification} onRead={(id) => markRead.mutate(id)} />
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Pagination meta={meta} onPageChange={setPage} itemLabel="notifikasi" />
    </div>
  )
}
