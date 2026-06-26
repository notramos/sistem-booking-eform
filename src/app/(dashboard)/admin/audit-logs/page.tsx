'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '@/lib/api/reports';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { formatDate, formatTime } from '@/lib/utils';

interface AuditLog {
  id: string;
  user_id: string;
  user?: { id: string; name: string; email: string };
  action: string;
  entity_type: string;
  entity_id: string;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const actionOptions = [
  { value: '', label: 'Semua Aksi' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

const entityOptions = [
  { value: '', label: 'Semua Tipe' },
  { value: 'booking', label: 'Booking' },
  { value: 'room', label: 'Room' },
  { value: 'user', label: 'User' },
  { value: 'room_category', label: 'Room Category' },
  { value: 'room_facility', label: 'Room Facility' },
  { value: 'maintenance_schedule', label: 'Maintenance' },
];

const actionBadge: Record<string, 'success' | 'destructive' | 'warning' | 'info' | 'default'> = {
  created: 'success',
  updated: 'info',
  deleted: 'destructive',
  approved: 'success',
  rejected: 'destructive',
  cancelled: 'warning',
};

export default function AdminAuditLogsPage() {
  const now = new Date();
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', action, entityType, startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {};
      if (action) params.action = action;
      if (entityType) params.entity_type = entityType;
      if (startDate) params.start_date = format(startDate, 'yyyy-MM-dd');
      if (endDate) params.end_date = format(endDate, 'yyyy-MM-dd');
      const res = await auditLogsApi.list(params);
      return res.data.data as AuditLog[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Riwayat aktivitas perubahan data sistem</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={action} onChange={(e) => setAction(e.target.value)}>
              {actionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
              {entityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <DatePicker label="Dari tanggal" value={startDate} onChange={setStartDate} fromDate={undefined} />
            <DatePicker label="Sampai tanggal" value={endDate} onChange={setEndDate} fromDate={undefined} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Tipe Entity</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Memuat...</TableCell>
                </TableRow>
              ) : data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Tidak ada audit logs</TableCell>
                </TableRow>
              ) : (
                data?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.user?.name || log.user_id}</TableCell>
                    <TableCell>
                      <Badge variant={actionBadge[log.action] || 'default'}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{log.entity_type.replace(/_/g, ' ')}</span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{log.description || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(log.created_at)}, {formatTime(log.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
