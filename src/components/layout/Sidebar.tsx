'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { useState } from 'react';
import {
  CalendarDays, DoorOpen, BookOpen, CheckSquare,
  Users, BarChart3, Settings, ClipboardList, Building2, Shield, Bell, Heart, Database,
} from 'lucide-react';

const ALL_ROLES = ['umat', 'sekretariat', 'p2', 'pastor', 'it_admin'];
// P2, Pastor, IT Admin sederajat (wewenang penuh) — bedanya cuma IT Admin yang
// bisa kelola user internal, jadi "Kelola User" dipisah pakai role list sendiri.
const FULL_ACCESS_ROLES = ['p2', 'pastor', 'it_admin'];

const menuItems = [
  { section: 'Permohonan Pelayanan', roles: ALL_ROLES },
  { href: '/layanan-umat', label: 'Pelayanan Umat', icon: Heart, roles: ALL_ROLES },

  { href: '/booking/calendar', label: 'Peminjaman Ruangan', icon: CalendarDays, roles: ALL_ROLES },
  { href: '/my-bookings', label: 'Booking Saya', icon: BookOpen, roles: ALL_ROLES },
  { href: '/rooms', label: 'Ruangan', icon: DoorOpen, roles: ALL_ROLES },
  { href: '/notifications', label: 'Notifikasi', icon: Bell, roles: ALL_ROLES },

  { section: 'Sekretariat', roles: ['sekretariat', ...FULL_ACCESS_ROLES] },
  { href: '/approvals', label: 'Persetujuan', icon: CheckSquare, roles: ['sekretariat', ...FULL_ACCESS_ROLES] },
  { href: '/admin/data', label: 'Data Booking & Pelayanan', icon: Database, roles: ['sekretariat', ...FULL_ACCESS_ROLES] },
  { href: '/admin/reports', label: 'Laporan', icon: BarChart3, roles: ['sekretariat', ...FULL_ACCESS_ROLES] },

  { section: 'Administrasi', roles: FULL_ACCESS_ROLES },
  { href: '/admin/users', label: 'Kelola User', icon: Users, roles: ['it_admin'] },
  { href: '/admin/rooms', label: 'Kelola Ruangan', icon: Building2, roles: FULL_ACCESS_ROLES },
  { href: '/admin/categories', label: 'Kategori & Fasilitas', icon: Settings, roles: FULL_ACCESS_ROLES },
  { href: '/admin/maintenance', label: 'Jadwal Perbaikan', icon: ClipboardList, roles: FULL_ACCESS_ROLES },
  { href: '/admin/audit-logs', label: 'Audit Log', icon: Shield, roles: FULL_ACCESS_ROLES },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { hasAnyRole } = useAuth();
  const [logoError, setLogoError] = useState(false);

  const visibleItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return hasAnyRole(item.roles);
  });

  // Buang header seksi yang tidak diikuti item apa pun (mis. karena semua item di bawahnya tersaring role)
  const filteredItems = visibleItems.filter((item, i) => {
    if (!('section' in item)) return true;
    const next = visibleItems[i + 1];
    return !!next && 'href' in next;
  });

  const navContent = (
    <>
      <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
        <Link href="/booking/calendar" className="flex items-center gap-3 min-w-0" onClick={onClose}>
          <div className="w-11 h-11 shrink-0 bg-sidebar-primary rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
            {logoError ? (
              <span className="text-sidebar-primary-foreground font-bold text-lg">A</span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/img/albertus-logo.png"
                alt="Logo Paroki Santo Albertus Agung"
                className="w-full h-full object-contain p-0.5"
                onError={() => setLogoError(true)}
              />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-sidebar-foreground leading-tight truncate">E-Albertus</h1>
            <p className="text-[11px] text-sidebar-foreground/50 leading-tight truncate">Paroki Santo Albertus Agung</p>
          </div>
        </Link>
        {/* Tombol tutup hanya muncul di mobile drawer */}
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredItems.map((item, i) => {
            if ('section' in item) {
              return (
                <p
                  key={`section-${i}`}
                  className="px-3 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 first:pt-1"
                >
                  {item.section}
                </p>
              );
            }
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                {Icon && <Icon className="w-5 h-5 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40 text-center">E-Albertus v1.0</p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar: fixed, selalu terlihat */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-full w-64 bg-sidebar border-r border-sidebar-border flex-col">
        {navContent}
      </aside>

      {/* Mobile drawer: overlay saat open */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={onClose}
          />
          {/* Drawer panel */}
          <aside className="fixed left-0 top-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col md:hidden">
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
