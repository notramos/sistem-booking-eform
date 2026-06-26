"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useRoom } from "@/hooks/useRooms";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/ui/error-state";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  MapPin,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";
import {
  formatDate,
  formatTime,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils";

const activeStatuses = ["pending", "approved"];

export default function RoomDetailPage() {
  const params = useParams();
  const { data: room, isLoading, isError, refetch } = useRoom(params.id as string);

  const { activeBookings, historyBookings } = useMemo(() => {
    const all = room?.bookings ?? [];
    return {
      activeBookings: all.filter((b) => activeStatuses.includes(b.status)),
      historyBookings: all.filter((b) => !activeStatuses.includes(b.status)),
    };
  }, [room?.bookings]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Gagal Memuat Ruangan"
        message="Terjadi kesalahan saat memuat detail ruangan."
        onRetry={refetch}
      />
    );
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground text-lg">Ruangan tidak ditemukan</p>
        <Link href="/rooms">
          <Button variant="outline" className="mt-4">
            Kembali ke Daftar Ruangan
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/rooms"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke daftar ruangan
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{room.name}</CardTitle>
                  <CardDescription>{room.category?.name}</CardDescription>
                </div>
                <Badge
                  variant={
                    room.status === "available"
                      ? "success"
                      : room.status === "maintenance"
                        ? "warning"
                        : "secondary"
                  }
                >
                  {room.status === "available"
                    ? "Tersedia"
                    : room.status === "maintenance"
                      ? "Perbaikan"
                      : "Tidak Tersedia"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {room.description || "Tidak ada deskripsi"}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">
                    Kapasitas:{" "}
                    <strong className="text-foreground">
                      {room.capacity} orang
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">
                    Lokasi:{" "}
                    <strong className="text-foreground">
                      {room.building || "-"}{" "}
                      {room.floor ? `Lt. ${room.floor}` : ""}
                    </strong>
                  </span>
                </div>
              </div>

              {room.facilities && room.facilities.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Fasilitas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {room.facilities.map((fac) => (
                        <span
                          key={fac.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-sm"
                        >
                          {fac.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jadwal Booking</CardTitle>
              <CardDescription>Riwayat peminjaman ruangan ini</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {activeBookings.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" /> Booking Aktif
                  </h4>
                  <div className="space-y-2">
                    {activeBookings.map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/booking/${booking.id}`}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100  transition-colors border border-blue-200 dark:border-blue-800"
                      >
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {booking.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(booking.booking_date)} |{" "}
                            {formatTime(booking.start_time)} -{" "}
                            {formatTime(booking.end_time)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {historyBookings.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" /> Riwayat
                  </h4>
                  <div className="space-y-2">
                    {historyBookings.map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/booking/${booking.id}`}
                        className="flex items-center justify-between p-3 bg-accent/50 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {booking.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(booking.booking_date)} |{" "}
                            {formatTime(booking.start_time)} -{" "}
                            {formatTime(booking.end_time)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {!room.bookings?.length && (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Belum ada jadwal booking
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                  Booking Ruangan
                </h3>
              </div>
              <Link href={`/booking/new?roomId=${room.id}`}>
                <Button
                  className="w-full"
                  disabled={room.status !== "available"}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Booking Ruangan
                </Button>
              </Link>
              {room.status !== "available" && (
                <p className="text-xs text-destructive mt-2 text-center">
                  Ruangan tidak tersedia untuk dipesan
                </p>
              )}
            </CardContent>
          </Card>

          {room.images && room.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Foto Ruangan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {room.images.map((img) => (
                    <img
                      key={img.id}
                      src={`/storage/${img.image_path}`}
                      alt={room.name}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
