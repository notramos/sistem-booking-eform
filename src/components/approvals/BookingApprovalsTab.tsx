'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  usePendingBookings, useApproveBooking, useRejectBooking,
  useStartReview, useReviseBooking,
} from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatDate, formatTime, getInitials, getStatusColor, getStatusLabel } from '@/lib/utils';
import { PURPOSE_LABELS } from '@/lib/constants';
import { CheckCircle2, XCircle, CalendarDays, Clock, Users, ClipboardList, Church, RotateCcw, PlayCircle, Tag } from 'lucide-react';

export function BookingApprovalsTab() {
  const router = useRouter();
  const { hasAnyRole, isSekretariat } = useAuth();
  const [page, setPage] = useState(1);
  const { data: pendingData, isLoading, isError, refetch } = usePendingBookings(hasAnyRole(['sekretariat', 'p2', 'pastor', 'it_admin']), page);
  const approveBooking = useApproveBooking();
  const rejectBooking = useRejectBooking();
  const startReview = useStartReview();
  const reviseBooking = useReviseBooking();

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [reviseId, setReviseId] = useState<string | null>(null);
  const [reviseReason, setReviseReason] = useState('');

  const bookings = pendingData?.data ?? [];

  const handleApprove = async () => {
    if (!confirmApproveId) return;
    await approveBooking.mutateAsync({ id: confirmApproveId, notes: approveNotes || undefined });
    setConfirmApproveId(null);
    setApproveNotes('');
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    await rejectBooking.mutateAsync({ id: rejectId, reason: rejectReason });
    setRejectId(null);
    setRejectReason('');
  };

  const handleRevise = async () => {
    if (!reviseId || !reviseReason.trim()) return;
    await reviseBooking.mutateAsync({ id: reviseId, reason: reviseReason });
    setReviseId(null);
    setReviseReason('');
  };

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
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="flex-1 p-5">
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
                            </Badge>
                          )}
                          {booking.booking_type === 'rutin' && (
                            <Badge variant="outline" className="shrink-0">
                              Rutin · {booking.recurring_dates?.length ?? 0} tanggal
                            </Badge>
                          )}
                          <Badge className={`${getStatusColor(booking.status)} shrink-0 text-xs`}>
                            {getStatusLabel(booking.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-primary mt-0.5">{booking.room?.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {booking.user?.name}
                          {booking.user?.department ? ` · ${booking.user.department}` : ''}
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

                        {booking.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">&ldquo;{booking.notes}&rdquo;</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2 p-5 sm:border-l border-t sm:border-t-0 bg-muted/30 sm:justify-center shrink-0">
                    <Link
                      href={`/booking/${booking.id}`}
                      className="hidden sm:block text-center text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline mb-1"
                    >
                      Lihat Detail
                    </Link>
                    {isSekretariat && booking.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none"
                        onClick={() => startReview.mutate(booking.id, { onSuccess: () => router.push(`/booking/${booking.id}`) })}
                        disabled={startReview.isPending}
                      >
                        <PlayCircle className="w-4 h-4 mr-1" /> Mulai Review
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setConfirmApproveId(booking.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-none"
                      onClick={() => { setReviseId(booking.id); setReviseReason(''); }}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" /> Revisi
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-none text-destructive border-destructive/20 hover:bg-destructive/10"
                      onClick={() => { setRejectId(booking.id); setRejectReason(''); }}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Tolak
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination meta={pendingData?.meta} onPageChange={setPage} itemLabel="booking" />

      {/* Dialog: Setujui */}
      <Dialog open={!!confirmApproveId} onOpenChange={(open) => { if (!open) { setConfirmApproveId(null); setApproveNotes(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Booking</DialogTitle>
            <DialogDescription>Booking akan disetujui dan ruangan dikonfirmasi untuk peminjaman.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-foreground mb-1 block">Catatan (opsional)</label>
            <Textarea rows={2} placeholder="Tambahkan catatan..." value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setConfirmApproveId(null); setApproveNotes(''); }}>Batal</Button>
            <Button onClick={handleApprove} loading={approveBooking.isPending}>
              Ya, Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Tolak */}
      <Dialog open={!!rejectId} onOpenChange={(open) => { if (!open) { setRejectId(null); setRejectReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Booking</DialogTitle>
            <DialogDescription>Masukkan alasan penolakan. Pemohon akan mendapat notifikasi.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-foreground mb-1 block">Alasan Penolakan *</label>
            <Textarea rows={3} placeholder="Masukkan alasan penolakan..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setRejectId(null); setRejectReason(''); }}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()} loading={rejectBooking.isPending}>
              Tolak Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Revisi */}
      <Dialog open={!!reviseId} onOpenChange={(open) => { if (!open) { setReviseId(null); setReviseReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Minta Revisi</DialogTitle>
            <DialogDescription>Booking akan dikembalikan ke pemohon untuk diperbaiki. Pemohon akan mendapat notifikasi.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-foreground mb-1 block">Alasan Revisi *</label>
            <Textarea rows={3} placeholder="Jelaskan apa yang perlu diperbaiki..." value={reviseReason} onChange={(e) => setReviseReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setReviseId(null); setReviseReason(''); }}>Batal</Button>
            <Button onClick={handleRevise} disabled={!reviseReason.trim()} loading={reviseBooking.isPending}>
              Minta Revisi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
