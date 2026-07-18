'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCongregationServices } from '@/hooks/useCongregationServices';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Pagination } from '@/components/ui/pagination';
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { SERVICE_TYPES, SERVICE_TYPE_MAP } from '@/lib/service-types';
import { Eye, ClipboardList, X } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
];

export function AllServicesTable() {
  const [status, setStatus] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useCongregationServices({
    status: status || undefined,
    service_type: serviceType || undefined,
    page,
  });

  const services = data?.data ?? [];
  const hasFilters = !!status || !!serviceType;

  const resetFilters = () => {
    setStatus('');
    setServiceType('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <Select
              label="Status"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-48"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
            <Select
              label="Jenis Pelayanan"
              value={serviceType}
              onChange={(e) => { setServiceType(e.target.value); setPage(1); }}
              className="w-64"
            >
              <option value="">Semua Jenis</option>
              {SERVICE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="w-4 h-4 mr-1" /> Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Spinner size="lg" center label="Memuat data permohonan..." />
      ) : isError ? (
        <ErrorState message="Gagal memuat data pelayanan umat." onRetry={() => refetch()} />
      ) : services.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState icon={ClipboardList} title="Tidak ada permohonan yang cocok dengan filter" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Pemohon</TableHead>
                  <TableHead className="hidden md:table-cell">Diajukan Oleh</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => {
                  const typeConfig = SERVICE_TYPE_MAP[service.service_type];
                  return (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{typeConfig?.label ?? service.service_type}</TableCell>
                      <TableCell>{service.applicant_name}</TableCell>
                      <TableCell className="hidden md:table-cell">{service.user?.name ?? '-'}</TableCell>
                      <TableCell>{formatDate(service.created_at)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(service.status)}>{getStatusLabel(service.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/layanan-umat/${service.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} itemLabel="permohonan" />
    </div>
  );
}
