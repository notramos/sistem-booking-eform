'use client';

import { useAuth } from '@/hooks/useAuth';
import { Bell, LogOut, User as UserIcon, ChevronDown, Menu, Plus, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import { getInitials, getRoleLabel, formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NOTIF_LABELS: Record<string, string> = {
  booking_created: 'Booking baru diajukan',
  booking_approved: 'Booking disetujui',
  booking_rejected: 'Booking ditolak',
  booking_cancelled: 'Booking dibatalkan',
  booking_reminder: 'Pengingat booking',
  congregation_service_created: 'Permohonan pelayanan baru',
};

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: unreadData } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => {
      const res = await notificationsApi.unreadCount();
      return res.data.data;
    },
    refetchInterval: 60_000,
  });

  const { data: recentNotifs } = useQuery({
    queryKey: ['recent-notifications'],
    queryFn: async () => {
      const res = await notificationsApi.list({ per_page: 5 });
      return res.data.data;
    },
    refetchInterval: 60_000,
  });

  const unreadCount = unreadData?.unread_count ?? 0;

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllAsRead();
    qc.invalidateQueries({ queryKey: ['unread-notifications'] });
    qc.invalidateQueries({ queryKey: ['recent-notifications'] });
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Hamburger button hanya di mobile */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0 hidden sm:flex items-center gap-2">
            <span className="text-sm text-muted-foreground truncate">
              Halo, <span className="font-medium text-foreground">{user?.name?.split(' ')[0] || 'User'}</span>
            </span>
            {user?.roles?.[0]?.name && (
              <Badge variant="secondary" className="text-xs shrink-0">{getRoleLabel(user.roles[0].name)}</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/rooms">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Booking Baru</span>
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">

                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-3 py-2.5 border-b">
                <p className="text-sm font-semibold">Notifikasi</p>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Tandai semua dibaca
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {!recentNotifs || recentNotifs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Belum ada notifikasi</p>
                ) : (
                  recentNotifs.map((n) => (
                    <Link
                      key={n.id}
                      href="/notifications"
                      className={`block px-3 py-2.5 border-b last:border-b-0 hover:bg-accent transition-colors ${!n.read_at ? 'bg-accent/40' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                        <div className={`min-w-0 ${n.read_at ? 'pl-3.5' : ''}`}>
                          <p className="text-sm font-medium truncate">
                            {NOTIF_LABELS[n.data?.type] ?? n.data?.title ?? 'Notifikasi'}
                          </p>
                          {n.data?.room_name && (
                            <p className="text-xs text-muted-foreground truncate">{n.data.room_name}</p>
                          )}
                          <p className="text-xs text-muted-foreground/60 mt-0.5">{formatDate(n.created_at)}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <Link
                href="/notifications"
                className="block text-center text-sm text-primary hover:underline py-2.5 border-t"
              >
                Lihat semua notifikasi
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(user?.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem>
                  <UserIcon className="w-4 h-4 mr-2" /> Profil
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
