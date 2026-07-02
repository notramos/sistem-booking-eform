'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Download, FileText, FileSpreadsheet, CalendarDays, XCircle } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { formatDate, downloadBlob } from '@/lib/utils';
import { toast } from 'sonner';

function ReportError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center py-8">
      <XCircle className="w-8 h-8 text-destructive" />
      <p className="text-muted-foreground">Gagal memuat data laporan</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Muat Ulang</Button>
    </div>
  );
}

function BookingReport({ startDate, endDate }: { startDate: Date | undefined; endDate: Date | undefined }) {
  const sd = startDate ? format(startDate, 'yyyy-MM-dd') : '';
  const ed = endDate ? format(endDate, 'yyyy-MM-dd') : '';
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['report-bookings', sd, ed],
    queryFn: async () => {
      const res = await reportsApi.bookings({ start_date: sd, end_date: ed });
      return res.data;
    },
    enabled: !!sd && !!ed,
  });

  const bookings = (data as { data?: { id: string; title: string; room?: { name: string }; user?: { name: string }; booking_date: string; status: string }[] })?.data || [];

  return (
    <div>
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat...</div>
      ) : isError ? (
        <ReportError onRetry={() => refetch()} />
      ) : bookings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Tidak ada data booking</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Ruangan</TableHead>
                  <TableHead>Pemesan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b: { id: string; title: string; room?: { name: string }; user?: { name: string }; booking_date: string; status: string }) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.title}</TableCell>
                    <TableCell>{b.room?.name || '-'}</TableCell>
                    <TableCell>{b.user?.name || '-'}</TableCell>
                    <TableCell>{formatDate(b.booking_date)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        b.status === 'approved' ? 'success' :
                        b.status === 'pending' ? 'warning' :
                        b.status === 'rejected' ? 'destructive' : 'default'
                      }>
                        {b.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RoomUtilization({ startDate, endDate }: { startDate: Date | undefined; endDate: Date | undefined }) {
  const sd = startDate ? format(startDate, 'yyyy-MM-dd') : '';
  const ed = endDate ? format(endDate, 'yyyy-MM-dd') : '';
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['report-utilization', sd, ed],
    queryFn: async () => {
      const res = await reportsApi.roomUtilization({ start_date: sd, end_date: ed });
      return res.data;
    },
    enabled: !!sd && !!ed,
  });

  const rooms = (data as { data?: { room_name: string; capacity: number; total_bookings: number; booked_minutes: number; utilization_percentage: number }[] })?.data || [];

  return (
    <div>
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat...</div>
      ) : isError ? (
        <ReportError onRetry={() => refetch()} />
      ) : rooms.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Tidak ada data utilisasi</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ruangan</TableHead>
                  <TableHead>Kapasitas</TableHead>
                  <TableHead>Total Booking</TableHead>
                  <TableHead>Jam Terpakai</TableHead>
                  <TableHead>Utilisasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((r: { room_name: string; capacity: number; total_bookings: number; booked_minutes: number; utilization_percentage: number }, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.room_name}</TableCell>
                    <TableCell>{r.capacity}</TableCell>
                    <TableCell>{r.total_bookings}</TableCell>
                    <TableCell>{(r.booked_minutes / 60).toFixed(1)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(r.utilization_percentage ?? 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm">{(r.utilization_percentage ?? 0).toFixed(1)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UserActivity({ startDate, endDate }: { startDate: Date | undefined; endDate: Date | undefined }) {
  const sd = startDate ? format(startDate, 'yyyy-MM-dd') : '';
  const ed = endDate ? format(endDate, 'yyyy-MM-dd') : '';
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['report-activity', sd, ed],
    queryFn: async () => {
      const res = await reportsApi.userActivity({ start_date: sd, end_date: ed });
      return res.data;
    },
    enabled: !!sd && !!ed,
  });

  const activities = (data as { data?: { name: string; email: string; bookings_count: number; role: string }[] })?.data || [];

  return (
    <div>
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat...</div>
      ) : isError ? (
        <ReportError onRetry={() => refetch()} />
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Tidak ada data aktivitas</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Booking</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((a: { name: string; email: string; bookings_count: number; role: string }, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.email}</TableCell>
                    <TableCell>{a.bookings_count}</TableCell>
                    <TableCell>{a.role || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MonthlyReport() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['report-monthly', year, month],
    queryFn: async () => {
      const res = await reportsApi.monthly(year, month);
      return res.data.data;
    },
    enabled: !!year && !!month,
  });

  const months = [
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' }, { value: '04', label: 'April' },
    { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' }, { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i));

  const statCards = data ? [
    { label: 'Total Booking', value: data.total_bookings, color: 'text-blue-600' },
    { label: 'Disetujui', value: data.approved_bookings, color: 'text-green-600' },
    { label: 'Ditolak', value: data.rejected_bookings, color: 'text-red-600' },
    { label: 'Dibatalkan', value: data.cancelled_bookings, color: 'text-yellow-600' },
    { label: 'Ruangan Digunakan', value: data.total_rooms_used, color: 'text-purple-600' },
    { label: 'Pengguna Unik', value: data.unique_users, color: 'text-indigo-600' },
  ] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={month} onChange={(e) => setMonth(e.target.value)}>
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </Select>
        <Select value={year} onChange={(e) => setYear(e.target.value)}>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
        <CalendarDays className="w-5 h-5 text-muted-foreground" />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat...</div>
      ) : isError ? (
        <ReportError onRetry={() => refetch()} />
      ) : !data ? (
        <div className="text-center py-8 text-muted-foreground">Pilih bulan untuk melihat laporan</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.status_breakdown && Object.keys(data.status_breakdown).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Status Booking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(data.status_breakdown).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{key}</span>
                        <span className="font-medium">{val as number}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.purpose_breakdown && Object.keys(data.purpose_breakdown).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tujuan Peminjaman</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(data.purpose_breakdown).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-medium">{val as number}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminReportsPage() {
  const now = new Date();
  const [startDate, setStartDate] = useState<Date | undefined>(now);
  const [endDate, setEndDate] = useState<Date | undefined>(now);
  const [tab, setTab] = useState('bookings');

  const formatDateParam = (d: Date | undefined) => d ? format(d, 'yyyy-MM-dd') : '';

  const handleExportPdf = async () => {
    try {
      const res = await reportsApi.exportPdf(tab, { start_date: formatDateParam(startDate), end_date: formatDateParam(endDate) });
      downloadBlob(res.data as Blob, `report-${tab}-${formatDateParam(startDate)}.pdf`);
    } catch {
      toast.error('Gagal mengekspor laporan PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await reportsApi.exportExcel(tab, { start_date: formatDateParam(startDate), end_date: formatDateParam(endDate) });
      downloadBlob(res.data as Blob, `report-${tab}-${formatDateParam(startDate)}.xlsx`);
    } catch {
      toast.error('Gagal mengekspor laporan Excel');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Laporan</h1>
        <p className="text-muted-foreground mt-1">Lihat dan ekspor laporan peminjaman ruangan</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <DatePicker
              label="Tanggal Mulai"
              value={startDate}
              onChange={setStartDate}
              fromDate={undefined}
            />
            <DatePicker
              label="Tanggal Selesai"
              value={endDate}
              onChange={setEndDate}
              fromDate={undefined}
            />
            <Button variant="outline" onClick={handleExportPdf}>
              <FileText className="w-4 h-4 mr-2" />Export PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="bookings" value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="bookings">Laporan Booking</TabsTrigger>
          <TabsTrigger value="utilization">Utilisasi Ruangan</TabsTrigger>
          <TabsTrigger value="activity">Aktivitas User</TabsTrigger>
          <TabsTrigger value="monthly">Laporan Bulanan</TabsTrigger>
        </TabsList>
        <TabsContent value="bookings">
          <BookingReport startDate={startDate} endDate={endDate} />
        </TabsContent>
        <TabsContent value="utilization">
          <RoomUtilization startDate={startDate} endDate={endDate} />
        </TabsContent>
        <TabsContent value="activity">
          <UserActivity startDate={startDate} endDate={endDate} />
        </TabsContent>
        <TabsContent value="monthly">
          <MonthlyReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
