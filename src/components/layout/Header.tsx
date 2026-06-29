'use client';

import { useAuth } from '@/hooks/useAuth';
import { Bell, LogOut, User as UserIcon, ChevronDown, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: unreadData } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => {
      const res = await notificationsApi.unreadCount();
      return res.data.data;
    },
    refetchInterval: 60_000,
  });

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Selamat datang, {user?.name?.split(' ')[0] || 'User'}
          </h2>
          <p className="text-sm text-muted-foreground">{user?.roles?.[0]?.name ? (
            <Badge variant="secondary" className="text-xs">{user.roles[0].name}</Badge>
          ) : null}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {(unreadData?.unread_count ?? 0) > 0 && unreadData?.unread_count !== undefined && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium">
                {unreadData?.unread_count > 9 ? '9+' : unreadData?.unread_count}
              </span>
            )}
          </Link>

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
