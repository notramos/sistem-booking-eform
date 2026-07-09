'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCongregationServices, useApproveCongregationService, useRejectCongregationService } from '@/hooks/useCongregationServices';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatDate, getInitials } from '@/lib/utils';
import { SERVICE_TYPE_MAP } from '@/lib/service-types';
import { CheckCircle2, XCircle, CalendarDays, ClipboardList } from 'lucide-react';

export function ServiceApprovalsTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useCongregationServices({ status: 'pending', page });
  const approveService = useApproveCongregationService();
  const rejectService = useRejectCongregationService();

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);
  const [approveNotes, setApproveNotes] = useState('');

  const services = data?.data ?? [];

  const handleApprove = async () => {
    if (!confirmApproveId) return;
    await approveService.mutateAsync({ id: confirmApproveId, notes: approveNotes || undefined });
    setConfirmApproveId(null);
    setApproveNotes('');
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    await rejectService.mutateAsync({ id: rejectId, reason: rejectReason });
    setRejectId(null);
    setRejectReason('');
  };

  if (isLoading) {
    return <Spinner size="lg" center label="Memuat permohonan pelayanan umat..." />;
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <XCircle className="w-12 h-12 text-destructive" />
            <p className="text-muted-foreground">Gagal memuat data permohonan</p>
            <Button variant="outline" onClick={() => refetch()}>Muat Ulang</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {services.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={ClipboardList}
              title="Semua sudah diproses"
              description="Tidak ada permohonan pelayanan umat yang menunggu persetujuan"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {services.map((service) => {
            const typeConfig = SERVICE_TYPE_MAP[service.service_type];
            return (
              <Card key={service.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex-1 p-5">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="text-xs">
                            {getInitials(service.applicant_name || '?')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground">
                            {typeConfig?.label ?? service.service_type}
                          </h3>
                          <p className="text-sm text-primary mt-0.5">{service.applicant_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {service.user?.name}
                            {service.contact ? ` · ${service.contact}` : ''}
                          </p>

                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <CalendarDays className="w-4 h-4" />
                              Diajukan {formatDate(service.created_at)}
                            </span>
                          </div>

                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-2 italic">&ldquo;{service.description}&rdquo;</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 p-5 sm:border-l border-t sm:border-t-0 bg-muted/30 sm:justify-center shrink-0">
                      <Link
                        href={`/layanan-umat/${service.id}`}
                        className="hidden sm:block text-center text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline mb-1"
                      >
                        Lihat Detail
                      </Link>
                      <Button
                        size="sm"
                        className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setConfirmApproveId(service.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none text-destructive border-destructive/20 hover:bg-destructive/10"
                        onClick={() => { setRejectId(service.id); setRejectReason(''); }}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Tolak
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} itemLabel="permohonan" />

      {/* Dialog: Setujui */}
      <Dialog open={!!confirmApproveId} onOpenChange={(open) => { if (!open) { setConfirmApproveId(null); setApproveNotes(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Permohonan</DialogTitle>
            <DialogDescription>Permohonan pelayanan umat ini akan disetujui.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-foreground mb-1 block">Catatan (opsional)</label>
            <Textarea rows={2} placeholder="Tambahkan catatan..." value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setConfirmApproveId(null); setApproveNotes(''); }}>Batal</Button>
            <Button onClick={handleApprove} loading={approveService.isPending}>
              Ya, Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Tolak */}
      <Dialog open={!!rejectId} onOpenChange={(open) => { if (!open) { setRejectId(null); setRejectReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Permohonan</DialogTitle>
            <DialogDescription>Masukkan alasan penolakan. Pemohon akan mendapat notifikasi.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-foreground mb-1 block">Alasan Penolakan *</label>
            <Textarea rows={3} placeholder="Masukkan alasan penolakan..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setRejectId(null); setRejectReason(''); }}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()} loading={rejectService.isPending}>
              Tolak Permohonan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
