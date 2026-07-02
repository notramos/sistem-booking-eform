'use client';

import { useState } from 'react';
import { usePendingBookings, useApproveBooking, useRejectBooking } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatDate, formatTime } from '@/lib/utils';
import { CheckCircle2, XCircle, CalendarDays, Clock, User, Loader2, ClipboardList } from 'lucide-react';

export default function ApprovalsPage() {
  const { hasAnyRole } = useAuth();
  const [page, setPage] = useState(1);
  const { data: pendingData, isLoading, isError, refetch } = usePendingBookings(hasAnyRole(['sekretariat', 'admin']), page);
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
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
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
              <Button variant="outline" onClick={() => refetch()}>Muat Ulang</Button>
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
            <Card key={booking.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
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
                        {formatDate(booking.start_time)} - {formatTime(booking.end_time)}
                      </span>
                    </div>
                    {booking.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">&ldquo;{booking.notes}&rdquo;</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                      onClick={() => setConfirmApproveId(booking.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/20 hover:bg-destructive/10"
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

      {pendingData?.meta && pendingData.meta.last_page > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Halaman {pendingData.meta.current_page} dari {pendingData.meta.last_page} ({pendingData.meta.total} booking)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pendingData.meta.current_page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pendingData.meta.current_page >= pendingData.meta.last_page}
              onClick={() => setPage((p) => Math.min(pendingData.meta!.last_page, p + 1))}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

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
            <Button onClick={handleApprove} disabled={approveBooking.isPending}>
              {approveBooking.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
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
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || rejectBooking.isPending}>
              {rejectBooking.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Tolak Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
