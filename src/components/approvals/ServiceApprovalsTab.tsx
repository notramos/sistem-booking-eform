'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCongregationServices } from '@/hooks/useCongregationServices';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { formatDate, getInitials } from '@/lib/utils';
import { SERVICE_TYPE_MAP } from '@/lib/service-types';
import { XCircle, CalendarDays, ClipboardList, ChevronRight, MapPin, Cake } from 'lucide-react';

export function ServiceApprovalsTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useCongregationServices({ status: 'pending', page });

  const services = data?.data ?? [];

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
            const dynamicFieldsCount = Object.values(service.dynamic_fields ?? {}).filter((v) => v !== null && v !== '').length;

            return (
              <Link key={service.id} href={`/layanan-umat/${service.id}`} className="block group">
                <Card className="overflow-hidden transition-all hover:shadow-md hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="text-xs">
                          {getInitials(service.applicant_name || '?')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">
                            {typeConfig?.label ?? service.service_type}
                          </h3>
                          {dynamicFieldsCount > 0 && (
                            <Badge variant="outline" className="shrink-0">{dynamicFieldsCount} detail terisi</Badge>
                          )}
                        </div>
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
                          {service.birth_date && (
                            <span className="flex items-center gap-1.5">
                              <Cake className="w-4 h-4" />
                              {formatDate(service.birth_date)}{service.birth_place ? `, ${service.birth_place}` : ''}
                            </span>
                          )}
                          {(service.neighborhood || service.region) && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              {[service.neighborhood, service.region].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </div>

                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{service.description}</p>
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

      <Pagination meta={data?.meta} onPageChange={setPage} itemLabel="permohonan" />
    </div>
  );
}
