'use client'

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, BellRing, CheckCheck, CalendarDays, Clock } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api/notifications'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const notificationIcons: Record<string, React.ReactNode> = {
  booking_approved: <CheckCheck className="h-4 w-4 text-green-500" />,
  booking_rejected: <BellRing className="h-4 w-4 text-red-500" />,
  booking_cancelled: <BellRing className="h-4 w-4 text-orange-500" />,
  booking_created: <CalendarDays className="h-4 w-4 text-blue-500" />,
}

function getIcon(type: string) {
  return notificationIcons[type] ?? <Bell className="h-4 w-4 text-muted-foreground" />
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const notifications = data?.data?.data ?? []
  const unreadCount = notifications.filter((n: any) => !n.read_at).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'No unread notifications'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BellRing className="h-5 w-5" />
            Inbox
          </CardTitle>
          <CardDescription>
            All your notifications in one place
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Bell className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Belum ada notifikasi</p>
              </div>
            ) : (
              notifications.map((notification: any, index: number) => (
                <div key={notification.id}>
                  {index > 0 && <Separator />}
                  <div
                    className={cn(
                      'flex gap-4 px-6 py-4 transition hover:bg-muted/50',
                      !notification.read_at && 'bg-muted/30'
                    )}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            'text-sm',
                            !notification.read_at && 'font-medium'
                          )}
                        >
                          {notification.data?.title ?? notification.type}
                        </p>
                        {!notification.read_at && (
                          <Badge variant="default" className="h-1.5 w-1.5 rounded-full p-0" />
                        )}
                      </div>
                      {notification.data?.description && (
                        <p className="text-sm text-muted-foreground">
                          {notification.data.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                    </div>
                    {!notification.read_at && (
                      <div className="flex items-center">
                        <Badge
                          variant="secondary"
                          className="h-2 w-2 rounded-full p-0"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
