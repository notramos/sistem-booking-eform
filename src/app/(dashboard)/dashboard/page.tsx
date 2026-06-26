'use client';

import { StatCard } from '@/components/shared/StatCard';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMyBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils';
import { CalendarDays, DoorOpen, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { isAdmin, isSekretariat } = useAuth();
  const { data: myBookings, isLoading } = useMyBookings();

  const stats = {
    totalBookings: myBookings?.length || 0,
    pendingBookings: myBookings?.filter((b) => b.status === 'pending').length || 0,
    approvedBookings: myBookings?.filter((b) => b.status === 'approved').length || 0,
    completedBookings: myBookings?.filter((b) => b.status === 'completed').length || 0,
  };

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
              <div className="text-center py-8">
                <p className="text-muted-foreground">Belum ada booking</p>
                <Link href="/rooms">
                  <Button variant="outline" className="mt-3">Booking Sekarang</Button>
                </Link>
              </div>
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
              <Link
                href="/rooms"
                className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors text-center"
              >
                <DoorOpen className="w-8 h-8 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">Cari Ruangan</p>
              </Link>
              <Link
                href="/booking/calendar"
                className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors text-center"
              >
                <CalendarDays className="w-8 h-8 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">Lihat Kalender</p>
              </Link>
              <Link
                href="/my-bookings"
                className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors text-center"
              >
                <Clock className="w-8 h-8 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">Booking Saya</p>
              </Link>
              {(isAdmin || isSekretariat) && (
                <Link
                  href="/approvals"
                  className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors text-center"
                >
                  <CheckCircle2 className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-sm font-medium text-foreground">Persetujuan</p>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
