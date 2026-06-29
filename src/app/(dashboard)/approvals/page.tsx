'use client';

import { useState } from 'react';
import { usePendingBookings, useApproveBooking, useRejectBooking } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatDate, formatTime, getStatusLabel, getStatusColor } from '@/lib/utils';
import { CheckCircle2, XCircle, CalendarDays, Clock, User, Loader2, ClipboardList } from 'lucide-react';

export default function ApprovalsPage() {
  const { hasAnyRole } = useAuth();
  const { data: pendingData, isLoading, isError, refetch } = usePendingBookings(hasAnyRole(['sekretariat', 'admin']));
  const approveBooking = useApproveBooking();
  const rejectBooking = useRejectBooking();

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);
  const [approveNotes, setApproveNotes] = useState('');

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Persetujuan Booking</h1>
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <XCircle className="w-12 h-12 text-destructive" />
              <p className="text-muted-foreground">Gagal memuat data booking</p>
              <Button variant="outline" onClick={() => refetch()}>
                Muat Ulang
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bookings = pendingData?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Persetujuan Booking</h1>
        <p className="text-muted-foreground mt-1">Setujui atau tolak peminjaman ruangan</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-4 text-center">
              <ClipboardList className="w-16 h-16 text-muted-foreground/40" />
              <div>
                <p className="text-lg font-medium text-foreground">Semua sudah diproses</p>
                <p className="text-sm text-muted-foreground mt-1">Tidak ada booking yang menunggu persetujuan</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{booking.title}</h3>
                    <p className="text-sm text-primary mt-0.5">{booking.room?.name}</p>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {booking.user?.name} ({booking.user?.department || '-'})
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-4 h-4" />
                        {formatDate(booking.booking_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </span>
                    </div>

                    {booking.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        &ldquo;{booking.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-start gap-2 ml-4 shrink-0">
                    {rejectId === booking.id ? (
                      <div className="space-y-2 min-w-[220px]">
                        <p className="text-sm font-medium text-destructive">Alasan Penolakan</p>
                        <Textarea
                          rows={2}
                          placeholder="Masukkan alasan penolakan..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => { setRejectId(null); setRejectReason(''); }}>
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectReason.trim() || rejectBooking.isPending}
                          >
                            {rejectBooking.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                            Tolak
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                          onClick={() => setConfirmApproveId(booking.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/20 hover:bg-destructive/10"
                          onClick={() => setRejectId(booking.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm Approve Dialog */}
      <Dialog open={!!confirmApproveId} onOpenChange={(open) => { if (!open) { setConfirmApproveId(null); setApproveNotes(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Booking</DialogTitle>
            <DialogDescription>
              Booking akan disetujui dan ruangan akan dikonfirmasi untuk peminjaman.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-foreground mb-1 block">Catatan (opsional)</label>
            <Textarea
              rows={2}
              placeholder="Tambahkan catatan..."
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setConfirmApproveId(null); setApproveNotes(''); }}>
              Batal
            </Button>
            <Button onClick={handleApprove} disabled={approveBooking.isPending}>
              {approveBooking.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Ya, Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
