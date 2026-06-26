'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard, CalendarDays, DoorOpen, BookOpen, CheckSquare,
  Users, BarChart3, Settings, ClipboardList, Building2, Shield, Bell, Church, Heart,
} from 'lucide-react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'sekretariat', 'jemaat'] },
  { href: '/rooms', label: 'Ruangan', icon: DoorOpen, roles: ['admin', 'sekretariat', 'jemaat'] },
  { href: '/booking/calendar', label: 'Kalender', icon: CalendarDays, roles: ['admin', 'sekretariat', 'jemaat'] },
  { href: '/services/new', label: 'Pelayanan Gereja', icon: Church, roles: ['admin', 'sekretariat', 'jemaat'] },
  { href: '/layanan-umat/new', label: 'Pelayanan Umat', icon: Heart, roles: ['admin', 'sekretariat', 'jemaat'] },
  { href: '/my-bookings', label: 'Booking Saya', icon: BookOpen, roles: ['admin', 'sekretariat', 'jemaat'] },
  { href: '/approvals', label: 'Persetujuan', icon: CheckSquare, roles: ['sekretariat', 'admin'] },
  { separator: true, roles: ['admin'] },
  { href: '/admin/users', label: 'Kelola User', icon: Users, roles: ['admin'] },
  { href: '/admin/rooms', label: 'Kelola Ruangan', icon: Building2, roles: ['admin'] },
  { href: '/admin/categories', label: 'Kategori & Fasilitas', icon: Settings, roles: ['admin'] },
  { href: '/admin/maintenance', label: 'Jadwal Perbaikan', icon: ClipboardList, roles: ['admin'] },
  { href: '/admin/reports', label: 'Laporan', icon: BarChart3, roles: ['sekretariat', 'admin'] },
  { href: '/admin/audit-logs', label: 'Audit Log', icon: Shield, roles: ['admin'] },
  { href: '/notifications', label: 'Notifikasi', icon: Bell, roles: ['admin', 'sekretariat', 'jemaat'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasAnyRole } = useAuth();

  const visibleItems = menuItems.filter((item) => {
    if (!('href' in item) || !item.roles) return true;
    return hasAnyRole(item.roles);
  });

  return (
    <aside className="fixed left-0 top-0 z-40 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-lg">E</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-primary">E-Albertus</h1>
            <p className="text-xs text-sidebar-foreground/60">Gereja Albertus Agung</p>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {visibleItems.map((item, i) => {
            if ('separator' in item) {
              return <Separator key={`sep-${i}`} className="my-3" />;
            }
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                {Icon && <Icon className="w-5 h-5 shrink-0" />}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40 text-center">E-Albertus v1.0</p>
      </div>
    </aside>
  );
}
