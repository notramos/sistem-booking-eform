'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePendingBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { formatDate, formatTime, getInitials, getStatusColor, getStatusLabel } from '@/lib/utils';
import { PURPOSE_LABELS } from '@/lib/constants';
import { XCircle, CalendarDays, Clock, Users, ClipboardList, Church, Tag, ChevronRight, MapPin } from 'lucide-react';

const PATTERN_LABELS: Record<string, string> = { weekly: 'Mingguan', monthly: 'Bulanan' };

export function BookingApprovalsTab() {
  const { hasAnyRole } = useAuth();
  const [page, setPage] = useState(1);
  const { data: pendingData, isLoading, isError, refetch } = usePendingBookings(hasAnyRole(['sekretariat', 'p2', 'pastor', 'it_admin']), page);

  const bookings = pendingData?.data ?? [];

  if (isLoading) {
    return <Spinner size="lg" center label="Memuat data persetujuan..." />;
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <XCircle className="w-12 h-12 text-destructive" />
            <p className="text-muted-foreground">Gagal memuat data booking</p>
            <Button variant="outline" onClick={() => refetch()}>Muat Ulang</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={ClipboardList}
              title="Semua sudah diproses"
              description="Tidak ada booking yang menunggu persetujuan"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const dynamicFieldsCount = booking.service_details
              ? Object.values(booking.service_details.dynamic_fields ?? {}).filter((v) => v !== null && v !== '').length
              : 0;

            return (
              <Link key={booking.id} href={`/booking/${booking.id}`} className="block group">
                <Card className="overflow-hidden transition-all hover:shadow-md hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="text-xs">
                          {getInitials(booking.user?.name ?? '?')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{booking.title}</h3>
                          {booking.service_details && (
                            <Badge variant="outline" className="gap-1 shrink-0">
                              <Church className="w-3 h-3" /> Pelayanan Gereja
                              {dynamicFieldsCount > 0 ? ` · ${dynamicFieldsCount} detail` : ''}
                            </Badge>
                          )}
                          {booking.booking_type === 'rutin' && (
                            <Badge variant="outline" className="shrink-0">
                              Rutin{booking.recurring_pattern ? ` · ${PATTERN_LABELS[booking.recurring_pattern] ?? booking.recurring_pattern}` : ''} · {booking.recurring_dates?.length ?? 0} tanggal
                            </Badge>
                          )}
                          <Badge className={`${getStatusColor(booking.status)} shrink-0 text-xs`}>
                            {getStatusLabel(booking.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-primary mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {booking.room?.name}
                          {(booking.room?.building || booking.room?.floor) && (
                            <span className="text-primary/70">
                              · {booking.room?.building}{booking.room?.floor ? ` Lt.${booking.room.floor}` : ''}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {booking.user?.name}
                          {booking.user?.department ? ` · ${booking.user.department}` : ''}
                          {booking.contact_person ? ` · ${booking.contact_person}` : ''}
                        </p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="w-4 h-4" />
                            {booking.booking_type === 'rutin' && booking.recurring_dates && booking.recurring_dates.length > 1
                              ? `${formatDate(booking.recurring_dates[0])} – ${formatDate(booking.recurring_dates[booking.recurring_dates.length - 1])}`
                              : formatDate(booking.booking_date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </span>
                          {booking.purpose_type && (
                            <span className="flex items-center gap-1.5">
                              <Tag className="w-4 h-4" />
                              {PURPOSE_LABELS[booking.purpose_type] ?? booking.purpose_type}
                            </span>
                          )}
                          {booking.expected_attendees ? (
                            <span className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              {booking.expected_attendees} orang
                            </span>
                          ) : null}
                        </div>

                        {booking.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{booking.description}</p>
                        )}
                        {booking.notes && (
                          <p className="text-sm text-muted-foreground mt-1 italic">&ldquo;{booking.notes}&rdquo;</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-primary shrink-0 self-center">
                        <span className="hidden sm:inline">Lihat Detail</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Pagination meta={pendingData?.meta} onPageChange={setPage} itemLabel="booking" />
    </div>
  );
}
