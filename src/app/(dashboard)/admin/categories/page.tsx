'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '@/lib/api/rooms';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import type { RoomCategory, RoomFacility } from '@/types';

function CategoryManager() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['room-categories'],
    queryFn: async () => {
      const res = await roomsApi.categories.list();
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => roomsApi.categories.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['room-categories'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; name: string; description?: string }) =>
      roomsApi.categories.update(data.id, { name: data.name, description: data.description }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['room-categories'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roomsApi.categories.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['room-categories'] }),
  });

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (cat: RoomCategory) => {
    setFormData({ name: cat.name, description: cat.description || '' });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Kategori Ruangan</h3>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <Plus className="w-4 h-4 mr-2" />Tambah Kategori
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm">{editingId ? 'Edit Kategori' : 'Kategori Baru'}</CardTitle>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nama Kategori *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Textarea label="Deskripsi" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <div className="flex items-end gap-2">
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
                <TableHead>Nama</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Memuat...</TableCell>
                </TableRow>
              ) : categories?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada kategori</TableCell>
                </TableRow>
              ) : (
                categories?.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>{cat.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={cat.is_active ? 'success' : 'default'}>
                        {cat.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('Hapus kategori ini?')) deleteMutation.mutate(cat.id); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
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
    </div>
  );
}

function FacilityManager() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '' });

  const { data: facilities, isLoading } = useQuery({
    queryKey: ['room-facilities'],
    queryFn: async () => {
      const res = await roomsApi.facilities.list();
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; icon?: string }) => roomsApi.facilities.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['room-facilities'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; name: string; icon?: string }) =>
      roomsApi.facilities.update(data.id, { name: data.name, icon: data.icon || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['room-facilities'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roomsApi.facilities.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['room-facilities'] }),
  });

  const resetForm = () => {
    setFormData({ name: '', icon: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (fac: RoomFacility) => {
    setFormData({ name: fac.name, icon: fac.icon || '' });
    setEditingId(fac.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: formData.name, icon: formData.icon || undefined };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Fasilitas Ruangan</h3>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <Plus className="w-4 h-4 mr-2" />Tambah Fasilitas
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm">{editingId ? 'Edit Fasilitas' : 'Fasilitas Baru'}</CardTitle>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nama Fasilitas *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label="Icon (opsional)" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="Nama icon" />
              <div className="flex items-end gap-2">
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
                <TableHead>Nama</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Memuat...</TableCell>
                </TableRow>
              ) : facilities?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada fasilitas</TableCell>
                </TableRow>
              ) : (
                facilities?.map((fac) => (
                  <TableRow key={fac.id}>
                    <TableCell className="font-medium">{fac.name}</TableCell>
                    <TableCell>{fac.icon || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={fac.is_active ? 'success' : 'default'}>
                        {fac.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(fac)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('Hapus fasilitas ini?')) deleteMutation.mutate(fac.id); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
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
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [tab, setTab] = useState('categories');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kelola Kategori & Fasilitas</h1>
        <p className="text-muted-foreground mt-1">Atur kategori dan fasilitas ruangan gereja</p>
      </div>

      <Tabs defaultValue="categories" value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="categories">Kategori</TabsTrigger>
          <TabsTrigger value="facilities">Fasilitas</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>
        <TabsContent value="facilities">
          <FacilityManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
