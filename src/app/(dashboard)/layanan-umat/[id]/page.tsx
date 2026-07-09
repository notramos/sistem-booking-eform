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
import { Spinner } from '@/components/ui/spinner';
import { StatusStepper, type StepperStep } from '@/components/detail/StatusStepper';
import { ActivityTimeline, type TimelineItem } from '@/components/detail/ActivityTimeline';
import { DetailFields, type DetailGroup } from '@/components/detail/DetailFields';
import { DocumentPreviewDialog } from '@/components/detail/DocumentPreviewDialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { SERVICE_TYPE_MAP } from '@/lib/service-types';
import {
  ArrowLeft, FileText, CheckCircle2, XCircle, Clock, User as UserIcon,
} from 'lucide-react';

function serviceSteps(status: string): StepperStep[] {
  if (status === 'rejected') {
    return [
      { label: 'Diajukan', state: 'done' },
      { label: 'Ditinjau', state: 'done' },
      { label: 'Ditolak', state: 'rejected' },
    ];
  }
  return [
    { label: 'Diajukan', state: 'done' },
    { label: 'Ditinjau', state: status === 'pending' ? 'current' : 'done' },
    { label: 'Disetujui', state: status === 'approved' ? 'done' : 'todo' },
  ];
}

function SignatureStatus({ label, signed }: { label: string; signed: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`inline-flex items-center gap-1.5 font-medium ${signed ? 'text-green-600' : 'text-muted-foreground'}`}>
        <span className={`h-2 w-2 rounded-full ${signed ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
        {signed ? 'Sudah' : 'Belum'}
      </span>
    </div>
  );
}

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
    return <Spinner size="lg" center label="Memuat detail permohonan..." />;
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

  const detailGroups: DetailGroup[] = typeConfig
    ? typeConfig.steps.flatMap((step) =>
        step.sections.map((section) => ({
          title: section.title,
          fields: section.fields.map((f) => {
            const value = f.dynamicField
              ? service.dynamic_fields?.[f.name]
              : (service as unknown as Record<string, unknown>)[f.name];
            return { label: f.label, value: value != null && value !== '' ? String(value) : null };
          }),
        }))
      )
    : [];

  const documentSections = detailGroups
    .map((g) => ({
      title: g.title ?? '',
      fields: g.fields
        .map((f) => ({ label: f.label, value: f.value as string | null | undefined }))
        .filter((f) => f.value),
    }))
    .filter((section) => section.fields.length > 0);

  const timelineItems: TimelineItem[] = [
    {
      icon: <FileText className="h-4 w-4" />,
      title: 'Permohonan diajukan',
      meta: `${formatDate(service.created_at, 'long')} · ${service.user?.name ?? service.applicant_name}`,
      tone: 'default',
    },
  ];
  if (service.status === 'approved') {
    timelineItems.push({
      icon: <CheckCircle2 className="h-4 w-4" />,
      title: 'Permohonan disetujui',
      description: service.notes,
      tone: 'success',
    });
  }
  if (service.status === 'rejected') {
    timelineItems.push({
      icon: <XCircle className="h-4 w-4" />,
      title: 'Permohonan ditolak',
      description: service.notes,
      tone: 'danger',
    });
  }

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
      {/* Header */}
      <div>
        <Link
          href="/layanan-umat"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Pelayanan Umat
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {typeConfig?.label ?? service.service_type}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><UserIcon className="h-3.5 w-3.5" />{service.applicant_name}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDate(service.created_at, 'long')}</span>
            </div>
          </div>
          <Badge className={`${getStatusColor(service.status)} shrink-0 px-3 py-1 text-sm`}>
            {getStatusLabel(service.status)}
          </Badge>
        </div>
      </div>

      {/* Status stepper */}
      <Card>
        <CardContent className="py-5">
          <StatusStepper steps={serviceSteps(service.status)} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kolom utama: versi web */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" /> Detail Permohonan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetailFields groups={detailGroups} />
            </CardContent>
          </Card>

          {service.status === 'rejected' && service.notes && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-700">Alasan Penolakan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700/90">{service.notes}</p>
              </CardContent>
            </Card>
          )}

          {service.status !== 'rejected' && service.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Catatan Sekretariat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{service.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" /> Riwayat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline items={timelineItems} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: ringkasan + aksi */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={getStatusColor(service.status)}>{getStatusLabel(service.status)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Diajukan</span>
                <span className="font-medium">{formatDate(service.created_at, 'long')}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Pemohon</span>
                <span className="truncate font-medium">{service.applicant_name}</span>
              </div>
              {isStaff && service.user?.name && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Diajukan oleh</span>
                  <span className="truncate font-medium">{service.user.name}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <SignatureStatus label="TTD Pemohon" signed={!!service.signature_pemohon} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DocumentPreviewDialog
                title={typeConfig?.label ?? service.service_type}
                sections={documentSections}
                applicantName={service.applicant_name}
                submittedAt={service.created_at}
                status={service.status}
                signaturePemohonUrl={service.signature_pemohon}
              />
              {hasActions && (
                <>
                  <Button
                    className="w-full gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                    variant="outline"
                    onClick={() => setShowApprove(true)}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Setujui
                  </Button>
                  <Button
                    className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                    variant="outline"
                    onClick={() => setShowReject(true)}
                  >
                    <XCircle className="h-4 w-4" /> Tolak
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
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
            <Button onClick={handleApprove} loading={approveMutation.isPending}>
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
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()} loading={rejectMutation.isPending}>
              Tolak Permohonan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
