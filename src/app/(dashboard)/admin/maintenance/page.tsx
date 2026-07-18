'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '@/lib/api/reports';
import { useRooms } from '@/hooks/useRooms';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, X, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface MaintenanceSchedule {
  id: string;
  room_id: string;
  room?: { id: string; name: string };
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  status: string;
  created_at: string;
}

export default function AdminMaintenancePage() {
  const qc = useQueryClient();
  const { data: roomsData } = useRooms();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    room_id: '', title: '', description: '',
    start_date: '', end_date: '',
    start_time: '', end_time: '', is_all_day: false,
  });

  const { data: schedules, isLoading, isError, refetch } = useQuery({
    queryKey: ['maintenance-schedules'],
    queryFn: async () => {
      const res = await maintenanceApi.list();
      return res.data.data as MaintenanceSchedule[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => maintenanceApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance-schedules'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: Record<string, unknown> }) =>
      maintenanceApi.update(data.id, data.payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance-schedules'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => maintenanceApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenance-schedules'] }),
  });

  const resetForm = () => {
    setFormData({ room_id: '', title: '', description: '', start_date: '', end_date: '', start_time: '', end_time: '', is_all_day: false });
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (sched: MaintenanceSchedule) => {
    setFormData({
      room_id: sched.room_id,
      title: sched.title,
      description: sched.description || '',
      start_date: sched.start_date,
      end_date: sched.end_date,
      start_time: sched.start_time || '',
      end_time: sched.end_time || '',
      is_all_day: sched.is_all_day,
    });
    setEditingId(sched.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: formData as Record<string, unknown> });
    } else {
      createMutation.mutate(formData);
    }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, 'warning' | 'success' | 'destructive' | 'default'> = {
      scheduled: 'warning',
      in_progress: 'default',
      completed: 'success',
      cancelled: 'destructive',
    };
    const labels: Record<string, string> = {
      scheduled: 'Terjadwal',
      in_progress: 'Berlangsung',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jadwal Maintenance</h1>
          <p className="text-muted-foreground mt-1">Kelola jadwal perawatan dan perbaikan ruangan</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <Plus className="w-4 h-4 mr-2" />Tambah Jadwal
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Edit Jadwal Maintenance' : 'Jadwal Maintenance Baru'}</CardTitle>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Ruangan *" value={formData.room_id} onChange={(e) => setFormData({ ...formData, room_id: e.target.value })} required>
                <option value="">Pilih Ruangan</option>
                {roomsData?.data?.map((room) => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </Select>
              <div className="md:col-span-2">
                <Input label="Judul *" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Deskripsi" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <Input label="Tanggal Mulai *" type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
              <Input label="Tanggal Selesai *" type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="is_all_day"
                  checked={formData.is_all_day}
                  onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
                  className="rounded border-input"
                />
                <label htmlFor="is_all_day" className="text-sm font-medium">Sepanjang Hari</label>
              </div>
              {!formData.is_all_day && (
                <>
                  <Input label="Jam Mulai" type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
                  <Input label="Jam Selesai" type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
                </>
              )}
              <div className="md:col-span-2 flex items-end gap-2 pt-2">
                <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>Simpan</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ruangan</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead className="hidden md:table-cell">Waktu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Memuat...</TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <XCircle className="w-8 h-8 text-destructive" />
                      <p className="text-muted-foreground">Gagal memuat jadwal maintenance</p>
                      <Button variant="outline" size="sm" onClick={() => refetch()}>Muat Ulang</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : schedules?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada jadwal maintenance</TableCell>
                </TableRow>
              ) : (
                schedules?.map((sched) => (
                  <TableRow key={sched.id}>
                    <TableCell className="font-medium">{sched.room?.name || sched.room_id}</TableCell>
                    <TableCell>{sched.title}</TableCell>
                    <TableCell>{formatDate(sched.start_date)} – {formatDate(sched.end_date)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {sched.is_all_day ? 'Sepanjang Hari' : `${sched.start_time || '-'} - ${sched.end_time || '-'}`}
                    </TableCell>
                    <TableCell>{statusBadge(sched.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(sched)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(sched.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Jadwal Maintenance</DialogTitle>
            <DialogDescription>Jadwal yang dihapus tidak dapat dikembalikan. Yakin ingin melanjutkan?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
