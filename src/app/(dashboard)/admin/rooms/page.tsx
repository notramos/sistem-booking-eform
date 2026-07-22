'use client';

import { useState } from 'react';
import { useRooms, useRoomCategories, useRoomFacilities, useCreateRoom, useUpdateRoom, useDeleteRoom } from '@/hooks/useRooms';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, X, XCircle } from 'lucide-react';
import type { Room } from '@/types';

export default function AdminRoomsPage() {
  const [page, setPage] = useState(1);
  const { data: roomsData, isLoading, isError, refetch } = useRooms({ page });
  const { data: categories } = useRoomCategories();
  const { data: facilities } = useRoomFacilities();
  const createRoom = useCreateRoom();
  const [editingId, setEditingId] = useState<string | null>(null);
  const updateRoom = useUpdateRoom(editingId || '');
  const deleteRoom = useDeleteRoom();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', category_id: '', description: '', capacity: '',
    floor: '', building: '', status: 'available', is_active: true,
    facilities: [] as string[],
  });

  const resetForm = () => {
    setFormData({ name: '', category_id: '', description: '', capacity: '', floor: '', building: '', status: 'available', is_active: true, facilities: [] });
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (room: Room) => {
    setFormData({
      name: room.name,
      category_id: room.category_id,
      description: room.description || '',
      capacity: String(room.capacity),
      floor: room.floor || '',
      building: room.building || '',
      status: room.status,
      is_active: room.is_active,
      facilities: room.facilities?.map((f) => f.id) || [],
    });
    setEditingId(room.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      capacity: parseInt(formData.capacity),
      facilities: formData.facilities,
    };
    if (editingId) {
      updateRoom.mutate(payload as Record<string, unknown>, { onSuccess: resetForm });
    } else {
      createRoom.mutate(payload as Record<string, unknown>, { onSuccess: resetForm });
    }
  };

  const toggleFacility = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(id)
        ? prev.facilities.filter((f) => f !== id)
        : [...prev.facilities, id],
    }));
  };

  const roomStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'default'> = {
      available: 'success',
      maintenance: 'warning',
      unavailable: 'default',
    };
    const labels: Record<string, string> = {
      available: 'Tersedia',
      maintenance: 'Perbaikan',
      unavailable: 'Tidak Tersedia',
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelola Ruangan</h1>
          <p className="text-muted-foreground mt-1">Manajemen data ruangan gereja</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <Plus className="w-4 h-4 mr-2" />Tambah Ruangan
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}</CardTitle>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input label="Nama Ruangan *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <Select label="Kategori *" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} required>
                <option value="">Pilih Kategori</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>
              <Select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="available">Tersedia</option>
                <option value="maintenance">Perbaikan</option>
                <option value="unavailable">Tidak Tersedia</option>
              </Select>
              <Input label="Kapasitas *" type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} required />
              <Input label="Lantai" value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })} />
              <Input label="Gedung/Bangunan" value={formData.building} onChange={(e) => setFormData({ ...formData, building: e.target.value })} />
              <div className="md:col-span-2">
                <Textarea label="Deskripsi" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium leading-none block mb-2">Fasilitas</label>
                <div className="flex flex-wrap gap-2">
                  {facilities?.map((fac) => (
                    <button
                      key={fac.id}
                      type="button"
                      aria-pressed={formData.facilities.includes(fac.id)}
                      onClick={() => toggleFacility(fac.id)}
                      className={`px-3 py-1.5 rounded-md text-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        formData.facilities.includes(fac.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-input hover:border-primary'
                      }`}
                    >
                      {fac.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 flex items-end gap-2 pt-2">
                <Button type="submit" loading={createRoom.isPending || updateRoom.isPending}>Simpan</Button>
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
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Kapasitas</TableHead>
                <TableHead className="hidden md:table-cell">Gedung</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Aktif</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Memuat...</TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <XCircle className="w-8 h-8 text-destructive" />
                      <p className="text-muted-foreground">Gagal memuat data ruangan</p>
                      <Button variant="outline" size="sm" onClick={() => refetch()}>Muat Ulang</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : roomsData?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada ruangan</TableCell>
                </TableRow>
              ) : (
                roomsData?.data?.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>{room.category?.name || '-'}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell className="hidden md:table-cell">{room.building || '-'} {room.floor ? `(Lt.${room.floor})` : ''}</TableCell>
                    <TableCell>{roomStatusBadge(room.status)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={room.is_active ? 'success' : 'default'}>
                        {room.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(room)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(room.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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

      {roomsData?.meta && roomsData.meta.last_page > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Halaman {roomsData.meta.current_page} dari {roomsData.meta.last_page} ({roomsData.meta.total} ruangan)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={roomsData.meta.current_page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={roomsData.meta.current_page >= roomsData.meta.last_page}
              onClick={() => setPage((p) => Math.min(roomsData.meta!.last_page, p + 1))}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Ruangan</DialogTitle>
            <DialogDescription>Ruangan yang dihapus tidak dapat dikembalikan. Yakin ingin melanjutkan?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button
              variant="destructive"
              disabled={deleteRoom.isPending}
              onClick={() => { if (deleteId) deleteRoom.mutate(deleteId); setDeleteId(null); }}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
