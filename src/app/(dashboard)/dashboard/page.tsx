'use client';

import { StatCard } from '@/components/shared/StatCard';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useMyBookings, usePendingBookings, useCalendarEvents } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils';
import { CalendarDays, DoorOpen, Clock, CheckCircle2, ArrowRight, AlertCircle, MapPin, Church } from 'lucide-react';
import Link from 'next/link';
import type { CalendarEvent } from '@/types';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const { isAdmin, isSekretariat } = useAuth();
  const { data: myBookings, isLoading } = useMyBookings();
  const canApprove = isAdmin || isSekretariat;
  const { data: pendingData } = usePendingBookings(canApprove);

  const today = todayStr();
  const { data: rawTodayEvents } = useCalendarEvents(today, today);
  const todayEvents = ((rawTodayEvents as CalendarEvent[] | undefined) ?? [])
    .filter((e) => e.status === 'approved' || e.status === 'pending')
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const stats = {
    totalBookings: myBookings?.length || 0,
    pendingBookings: myBookings?.filter((b) => b.status === 'pending').length || 0,
    approvedBookings: myBookings?.filter((b) => b.status === 'approved').length || 0,
    completedBookings: myBookings?.filter((b) => b.status === 'completed').length || 0,
  };

  const pendingApprovalCount = pendingData?.meta?.total ?? pendingData?.data?.length ?? 0;

  const upcomingBookings = myBookings
    ?.filter((b) => b.status === 'approved' || b.status === 'pending')
    .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview peminjaman ruangan gereja</p>
      </div>

      {/* Kegiatan gereja hari ini — info kontekstual, bukan duplikat menu */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Church className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">
              Kegiatan Hari Ini — {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {todayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Tidak ada kegiatan/booking ruangan terjadwal hari ini.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {todayEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/booking/${event.id}`}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col items-center justify-center w-14 shrink-0 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 mb-0.5" />
                      {formatTime(event.start_time)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" /> {event.room}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(event.status)}>
                    {event.extendedProps?.status_label ?? getStatusLabel(event.status)}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Banner persetujuan menunggu — hanya untuk admin/sekretariat */}
      {canApprove && pendingApprovalCount > 0 && (
        <Link href="/approvals">
          <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">
                  {pendingApprovalCount} booking menunggu persetujuan
                </p>
                <p className="text-sm text-yellow-600">Klik untuk memproses</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-yellow-600" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Booking" value={stats.totalBookings} icon={<CalendarDays className="w-6 h-6" />} />
        <StatCard title="Menunggu" value={stats.pendingBookings} icon={<Clock className="w-6 h-6" />} description="Perlu persetujuan" />
        <StatCard title="Disetujui" value={stats.approvedBookings} icon={<CheckCircle2 className="w-6 h-6" />} />
        <StatCard title="Selesai" value={stats.completedBookings} icon={<DoorOpen className="w-6 h-6" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Booking Mendatang</CardTitle>
                <CardDescription>5 booking terdekat</CardDescription>
              </div>
              <Link href="/my-bookings">
                <Button variant="ghost" size="sm">
                  Lihat Semua <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Memuat...</div>
            ) : upcomingBookings?.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Belum ada booking"
                action={{ label: 'Booking Sekarang', href: '/rooms' }}
              />
            ) : (
              <div className="space-y-3">
                {upcomingBookings?.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/booking/${booking.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{booking.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{booking.room?.name}</p>
                      <p className="text-xs text-muted-foreground/60">
                        {formatDate(booking.booking_date)} | {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusLabel(booking.status)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Fitur utama E-Albertus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/rooms" className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors text-center">
                <DoorOpen className="w-8 h-8 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">Cari Ruangan</p>
              </Link>
              <Link href="/booking/calendar" className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors text-center">
                <CalendarDays className="w-8 h-8 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">Lihat Kalender</p>
              </Link>
              <Link href="/my-bookings" className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors text-center">
                <Clock className="w-8 h-8 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">Booking Saya</p>
              </Link>
              {canApprove && (
                <Link href="/approvals" className="relative p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-sm font-medium text-foreground">Persetujuan</p>
                  {pendingApprovalCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center px-1 font-medium">
                      {pendingApprovalCount > 9 ? '9+' : pendingApprovalCount}
                    </span>
                  )}
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
