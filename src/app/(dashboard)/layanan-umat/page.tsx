'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCongregationServices } from '@/hooks/useCongregationServices';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { SERVICE_TYPE_MAP } from '@/lib/service-types';
import { CalendarDays, Heart, User } from 'lucide-react';

export default function LayananUmatPage() {
  const { hasAnyRole } = useAuth();
  const isStaff = hasAnyRole(['sekretariat', 'admin']);
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
        <Link href="/layanan-umat/new">
          <Button>
            <Heart className="w-4 h-4 mr-2" /> Ajukan Baru
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => handleStatusFilter(s.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Belum ada permohonan pelayanan umat"
          action={{ label: 'Ajukan Sekarang', href: '/layanan-umat/new' }}
        />
      ) : (
        <div className="space-y-3">
          {services.map((service) => {
            const typeConfig = SERVICE_TYPE_MAP[service.service_type];
            return (
              <Card key={service.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/layanan-umat/${service.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {typeConfig?.label ?? service.service_type}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">{service.applicant_name}</p>

                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                        {isStaff && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {service.user?.name ?? '-'}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-4 h-4" />
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
            );
          })}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Halaman {meta.current_page} dari {meta.last_page} ({meta.total} permohonan)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
