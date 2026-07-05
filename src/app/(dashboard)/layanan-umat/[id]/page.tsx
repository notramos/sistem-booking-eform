'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useCongregationService,
  useApproveCongregationService,
  useRejectCongregationService,
} from '@/hooks/useCongregationServices';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { OfficialDocumentPreview } from '@/components/ui/official-document-preview';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import { SERVICE_TYPE_MAP } from '@/lib/service-types';
import {
  ArrowLeft, FileText, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';

export default function LayananUmatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasAnyRole } = useAuth();
  const isStaff = hasAnyRole(['sekretariat', 'admin']);
  const { data: service, isLoading, isError } = useCongregationService(id);
  const approveMutation = useApproveCongregationService();
  const rejectMutation = useRejectCongregationService();

  const [showApprove, setShowApprove] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !service) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Permohonan tidak ditemukan</h2>
        <p className="text-sm text-muted-foreground">
          Permohonan yang Anda cari tidak ada atau sudah dihapus.
        </p>
        <Link href="/layanan-umat" className={buttonVariants({ variant: 'outline' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Pelayanan Umat
        </Link>
      </div>
    );
  }

  const typeConfig = SERVICE_TYPE_MAP[service.service_type];
  const hasActions = isStaff && service.status === 'pending';

  const reviewSections = typeConfig
    ? typeConfig.steps.flatMap((step) =>
        step.sections
          .map((section) => ({
            title: section.title,
            fields: section.fields
              .map((f) => {
                const value = f.dynamicField
                  ? service.dynamic_fields?.[f.name]
                  : (service as unknown as Record<string, unknown>)[f.name];
                return { label: f.label, value: value ? String(value) : null };
              })
              .filter((f) => f.value !== null),
          }))
          .filter((section) => section.fields.length > 0)
      )
    : [];

  const handleApprove = async () => {
    await approveMutation.mutateAsync({ id: service.id, notes: approveNotes || undefined });
    setShowApprove(false);
    setApproveNotes('');
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    await rejectMutation.mutateAsync({ id: service.id, reason: rejectReason });
    setShowReject(false);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/layanan-umat"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Pelayanan Umat
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {typeConfig?.label ?? service.service_type}
            </h1>
            <p className="text-sm text-muted-foreground">Detail permohonan pelayanan umat</p>
          </div>
          <Badge className={getStatusColor(service.status)}>
            {getStatusLabel(service.status)}
          </Badge>
        </div>
      </div>

      <div className={hasActions ? 'grid gap-6 lg:grid-cols-3' : 'grid gap-6'}>
        <div className={hasActions ? 'space-y-4 lg:col-span-2' : 'space-y-4'}>
          {isStaff && service.user?.name && (
            <p className="text-sm text-muted-foreground no-print">
              Diajukan oleh {service.user.name}
            </p>
          )}

          <OfficialDocumentPreview
            title={typeConfig?.label ?? service.service_type}
            sections={reviewSections}
            applicantName={service.applicant_name}
            submittedAt={service.created_at}
            status={service.status}
            showPrintButton
            signaturePemohonUrl={service.signature_pemohon}
          />

          {service.notes && (
            <Card className="no-print">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Catatan Sekretariat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{service.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {hasActions && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                  variant="outline"
                  onClick={() => setShowApprove(true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Setujui
                </Button>
                <Button
                  className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                  variant="outline"
                  onClick={() => setShowReject(true)}
                >
                  <XCircle className="h-4 w-4" />
                  Tolak
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={showApprove} onOpenChange={(open) => { if (!open) { setShowApprove(false); setApproveNotes(''); } }}>
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
            <Button variant="ghost" onClick={() => { setShowApprove(false); setApproveNotes(''); }}>Batal</Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Ya, Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReject} onOpenChange={(open) => { if (!open) { setShowReject(false); setRejectReason(''); } }}>
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
            <Button variant="ghost" onClick={() => { setShowReject(false); setRejectReason(''); }}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || rejectMutation.isPending}>
              {rejectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Tolak Permohonan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
