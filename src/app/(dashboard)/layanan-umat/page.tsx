'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCongregationServices } from '@/hooks/useCongregationServices';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Pagination } from '@/components/ui/pagination';
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { SERVICE_TYPES, SERVICE_TYPE_MAP } from '@/lib/service-types';
import { CalendarDays, Heart, User, CalendarPlus, MessagesSquare, ArrowRight, LockKeyhole } from 'lucide-react';

const SERVICE_ICONS = {
  intensi_misa: Heart,
  permohonan_misa: CalendarPlus,
  konsultasi_romo: MessagesSquare,
} as const;

export default function LayananUmatPage() {
  const { hasAnyRole } = useAuth();
  const isStaff = hasAnyRole(['sekretariat', 'p2', 'pastor', 'it_admin']);
  const [view, setView] = useState<'services' | 'requests'>('services');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCongregationServices({ status: statusFilter || undefined, page });
  const services = data?.data ?? [];
  const meta = data?.meta;

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const statuses = [
    { value: '', label: 'Semua' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isStaff ? 'Semua Permohonan Pelayanan' : 'Pelayanan Umat Saya'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isStaff
              ? 'Kelola permohonan pelayanan umat dari jemaat'
              : 'Riwayat permohonan pelayanan umat Anda'}
          </p>
        </div>
      </div>

      <SegmentedControl
        options={[
          { value: 'services', label: 'Pilih Layanan' },
          { value: 'requests', label: isStaff ? 'Daftar Permohonan' : 'Permohonan Saya' },
        ]}
        value={view}
        onChange={(value) => setView(value as 'services' | 'requests')}
      />

      {view === 'services' && <section className="space-y-2">
        <div>
          <h2 className="text-base font-semibold text-foreground sm:text-lg">Pelayanan Umat</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">Pilih layanan yang tersedia.</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {SERVICE_TYPES.map((serviceType) => {
            const Icon = SERVICE_ICONS[serviceType.value as keyof typeof SERVICE_ICONS] ?? Heart;
            const isEnabled = serviceType.value === 'intensi_misa';
            const content = (
              <Card className={isEnabled
                ? 'border-primary/30 transition-all hover:border-primary hover:shadow-md'
                : 'border-dashed opacity-70'}
              >
                <CardContent className="flex items-center gap-2.5 p-3 sm:gap-3 sm:p-4">
                  <div className={`rounded-lg p-2 ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">{serviceType.label}</h3>
                      {isEnabled ? <ArrowRight className="h-4 w-4 shrink-0 text-primary" /> : <LockKeyhole className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    </div>
                    <p className="mt-0.5 hidden truncate text-xs text-muted-foreground sm:block">{serviceType.description}</p>
                    <Badge variant={isEnabled ? 'default' : 'secondary'} className="mt-1 text-[10px] leading-4 sm:mt-2 sm:text-xs">
                      {isEnabled ? 'Tersedia' : 'Segera Hadir'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );

            return isEnabled ? (
              <Link key={serviceType.value} href="/layanan-umat/new" className="block">
                {content}
              </Link>
            ) : (
              <div key={serviceType.value} aria-disabled="true">{content}</div>
            );
          })}
        </div>
      </section>}

      {view === 'requests' && <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            {isStaff ? 'Daftar Permohonan' : 'Permohonan Saya'}
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Lihat detail dan status permohonan pelayanan yang sudah diajukan.
          </p>
        </div>

        <SegmentedControl options={statuses} value={statusFilter} onChange={handleStatusFilter} />

        {isLoading ? (
          <Spinner size="lg" center label="Memuat permohonan..." />
        ) : services.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Belum ada permohonan pelayanan umat"
            action={{ label: 'Ajukan Intensi Misa', href: '/layanan-umat/new' }}
          />
        ) : (
          <div className="space-y-3">
            {services.map((service) => {
              const typeConfig = SERVICE_TYPE_MAP[service.service_type];
              return (
                <Link key={service.id} href={`/layanan-umat/${service.id}`}>
                  <Card className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground">
                            {typeConfig?.label ?? service.service_type}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{service.applicant_name}</p>

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                            {isStaff && (
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {service.user?.name ?? '-'}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-4 w-4" />
                              {formatDate(service.created_at)}
                            </span>
                          </div>
                        </div>

                        <Badge className={getStatusColor(service.status)}>
                          {getStatusLabel(service.status)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <Pagination meta={meta} onPageChange={setPage} itemLabel="permohonan" />
      </section>}
    </div>
  );
}
