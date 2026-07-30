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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { cn, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
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

export default function LayananUmatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasAnyRole } = useAuth();
  const isStaff = hasAnyRole(['sekretariat', 'p2', 'pastor', 'it_admin']);
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

  // Dipakai dua kali: card sidebar (desktop) dan action bar melayang (mobile).
  const actionButtons = (
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
  );

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
    <div className={cn('space-y-4 sm:space-y-6', hasActions && 'pb-24 lg:pb-0')}>
      {/* Header */}
      <div>
        <Link
          href="/layanan-umat"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Pelayanan Umat
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground break-words">
              {typeConfig?.label ?? service.service_type}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><UserIcon className="h-3.5 w-3.5 shrink-0" />{service.applicant_name}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 shrink-0" />Diajukan {formatDate(service.created_at, 'long')}</span>
              {isStaff && service.user?.name && service.user.name !== service.applicant_name && (
                <span className="text-muted-foreground/70">oleh {service.user.name}</span>
              )}
            </div>
          </div>
          <Badge className={`${getStatusColor(service.status)} shrink-0 px-2.5 py-1 text-xs sm:px-3 sm:text-sm`}>
            {getStatusLabel(service.status)}
          </Badge>
        </div>
      </div>

      {/* Status stepper */}
      <Card>
        <CardContent className="p-4 sm:py-5 sm:px-6">
          <StatusStepper steps={serviceSteps(service.status)} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Kolom utama: versi web */}
        <div className={cn('space-y-4 sm:space-y-6', hasActions ? 'lg:col-span-2' : 'lg:col-span-3')}>
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-5 w-5 text-primary shrink-0" /> Detail Permohonan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <DetailFields groups={detailGroups} />
            </CardContent>
          </Card>

          {service.status === 'rejected' && service.notes && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
                <CardTitle className="text-sm text-red-700">Alasan Penolakan</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <p className="text-sm text-red-700/90">{service.notes}</p>
              </CardContent>
            </Card>
          )}

          {service.status !== 'rejected' && service.notes && (
            <Card>
              <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
                <CardTitle className="text-sm">Catatan Sekretariat</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <p className="text-sm text-muted-foreground">{service.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-5 w-5 text-primary shrink-0" /> Riwayat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <ActivityTimeline items={timelineItems} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar aksi (desktop) — di mobile digantikan action bar melayang di bawah. */}
        {hasActions && (
          <div className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base">Aksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">{actionButtons}</CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Action bar mobile — supaya staf tidak perlu scroll melewati seluruh detail
          & riwayat hanya untuk menyetujui/menolak. */}
      {hasActions && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
          <div className="flex gap-2 [&>*]:flex-1">{actionButtons}</div>
        </div>
      )}

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
