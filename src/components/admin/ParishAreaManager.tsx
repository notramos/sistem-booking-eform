'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  MapPin,
  MapPinned,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useWilayah } from '@/hooks/useParish';
import { parishApi } from '@/lib/api/parish';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { Lingkungan, Wilayah } from '@/types';

type EditorState =
  | { type: 'wilayah'; id?: string }
  | { type: 'lingkungan'; id?: string };

type DetailState =
  | { type: 'wilayah'; wilayah: Wilayah }
  | { type: 'lingkungan'; wilayah: Wilayah; lingkungan: Lingkungan };

type DeleteState = {
  type: 'wilayah' | 'lingkungan';
  id: string;
  name: string;
  childCount?: number;
};

type ApiError = { message?: string };

const iconButtonClass = 'h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground';

export function ParishAreaManager() {
  const queryClient = useQueryClient();
  const { data: wilayahList, isLoading, isError, refetch } = useWilayah();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteState | null>(null);
  const [form, setForm] = useState({ wilayahId: '', name: '', area: '' });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['wilayah'] });
  };

  const createWilayah = useMutation({
    mutationFn: (name: string) => parishApi.createWilayah({ name }),
    onSuccess: async () => {
      await refresh();
      setEditor(null);
      toast.success('Wilayah berhasil ditambahkan');
    },
    onError: (error: ApiError) => toast.error(error.message || 'Gagal menambahkan wilayah'),
  });

  const updateWilayah = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => parishApi.updateWilayah(id, { name }),
    onSuccess: async () => {
      await refresh();
      setEditor(null);
      toast.success('Wilayah berhasil diperbarui');
    },
    onError: (error: ApiError) => toast.error(error.message || 'Gagal memperbarui wilayah'),
  });

  const createLingkungan = useMutation({
    mutationFn: (data: { wilayah_id: string; name: string; area: string | null }) => parishApi.createLingkungan(data),
    onSuccess: async () => {
      await refresh();
      setEditor(null);
      toast.success('Lingkungan berhasil ditambahkan');
    },
    onError: (error: ApiError) => toast.error(error.message || 'Gagal menambahkan lingkungan'),
  });

  const updateLingkungan = useMutation({
    mutationFn: ({ id, ...data }: { id: string; wilayah_id: string; name: string; area: string | null }) =>
      parishApi.updateLingkungan(id, data),
    onSuccess: async () => {
      await refresh();
      setEditor(null);
      toast.success('Lingkungan berhasil diperbarui');
    },
    onError: (error: ApiError) => toast.error(error.message || 'Gagal memperbarui lingkungan'),
  });

  const deleteWilayah = useMutation({
    mutationFn: (id: string) => parishApi.deleteWilayah(id),
    onSuccess: async () => {
      await refresh();
      setDeleteTarget(null);
      toast.success('Wilayah berhasil dihapus');
    },
    onError: (error: ApiError) => toast.error(error.message || 'Wilayah tidak dapat dihapus'),
  });

  const deleteLingkungan = useMutation({
    mutationFn: (id: string) => parishApi.deleteLingkungan(id),
    onSuccess: async () => {
      await refresh();
      setDeleteTarget(null);
      toast.success('Lingkungan berhasil dihapus');
    },
    onError: (error: ApiError) => toast.error(error.message || 'Lingkungan tidak dapat dihapus'),
  });

  const filteredWilayah = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('id');
    if (!keyword) return wilayahList ?? [];

    return (wilayahList ?? []).filter((wilayah) =>
      wilayah.name.toLocaleLowerCase('id').includes(keyword)
      || wilayah.lingkungan.some((item) =>
        item.name.toLocaleLowerCase('id').includes(keyword)
        || item.area?.toLocaleLowerCase('id').includes(keyword)
      )
    );
  }, [search, wilayahList]);

  const totalLingkungan = (wilayahList ?? []).reduce((total, wilayah) => total + wilayah.lingkungan.length, 0);
  const isSaving = createWilayah.isPending || updateWilayah.isPending || createLingkungan.isPending || updateLingkungan.isPending;
  const isDeleting = deleteWilayah.isPending || deleteLingkungan.isPending;

  const toggleExpanded = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openNewWilayah = () => {
    setForm({ wilayahId: '', name: '', area: '' });
    setEditor({ type: 'wilayah' });
  };

  const openEditWilayah = (wilayah: Wilayah) => {
    setForm({ wilayahId: wilayah.id, name: wilayah.name, area: '' });
    setEditor({ type: 'wilayah', id: wilayah.id });
  };

  const openNewLingkungan = (wilayah: Wilayah) => {
    setForm({ wilayahId: wilayah.id, name: '', area: '' });
    setEditor({ type: 'lingkungan' });
  };

  const openEditLingkungan = (wilayah: Wilayah, lingkungan: Lingkungan) => {
    setForm({ wilayahId: wilayah.id, name: lingkungan.name, area: lingkungan.area ?? '' });
    setEditor({ type: 'lingkungan', id: lingkungan.id });
  };

  const submitEditor = (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    if (editor?.type === 'wilayah') {
      if (editor.id) updateWilayah.mutate({ id: editor.id, name });
      else createWilayah.mutate(name);
      return;
    }

    if (editor?.type === 'lingkungan' && form.wilayahId) {
      const data = { wilayah_id: form.wilayahId, name, area: form.area.trim() || null };
      if (editor.id) updateLingkungan.mutate({ id: editor.id, ...data });
      else createLingkungan.mutate(data);
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'wilayah') deleteWilayah.mutate(deleteTarget.id);
    else deleteLingkungan.mutate(deleteTarget.id);
  };

  if (isLoading) return <Spinner center label="Memuat data wilayah dan lingkungan..." />;

  if (isError) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={MapPinned}
            title="Data wilayah gagal dimuat"
            description="Periksa koneksi lalu coba muat ulang."
            action={{ label: 'Muat Ulang', onClick: () => refetch() }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Wilayah & Lingkungan</h3>
          <p className="text-sm text-muted-foreground">Lingkungan dikelompokkan sebagai anak dari wilayahnya.</p>
        </div>
        <Button onClick={openNewWilayah} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Tambah Wilayah
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MapPinned className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold">{wilayahList?.length ?? 0}</p><p className="text-xs text-muted-foreground">Wilayah</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold">{totalLingkungan}</p><p className="text-xs text-muted-foreground">Lingkungan</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Cari wilayah atau lingkungan"
          className="pl-9"
          placeholder="Cari wilayah, lingkungan, atau area..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {filteredWilayah.length === 0 ? (
        <Card><CardContent><EmptyState icon={MapPinned} title="Data tidak ditemukan" description="Coba gunakan kata pencarian yang lain." /></CardContent></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredWilayah.map((wilayah) => {
            const isExpanded = expanded.has(wilayah.id) || !!search;
            return (
              <Card key={wilayah.id} className="overflow-hidden">
                <CardHeader className="space-y-3 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                      onClick={() => toggleExpanded(wilayah.id)}
                      aria-label={isExpanded ? 'Tutup daftar lingkungan' : 'Buka daftar lingkungan'}
                    >
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => toggleExpanded(wilayah.id)}>
                      <CardTitle className="truncate text-base">{wilayah.name}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">{wilayah.lingkungan.length} lingkungan</p>
                    </button>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button type="button" className={iconButtonClass} title="Detail wilayah" aria-label={`Detail ${wilayah.name}`} onClick={() => setDetail({ type: 'wilayah', wilayah })}><Eye className="h-4 w-4" /></button>
                      <button type="button" className={iconButtonClass} title="Edit wilayah" aria-label={`Edit ${wilayah.name}`} onClick={() => openEditWilayah(wilayah)}><Pencil className="h-4 w-4" /></button>
                      <button type="button" className={`${iconButtonClass} hover:bg-destructive/10 hover:text-destructive`} title="Hapus wilayah" aria-label={`Hapus ${wilayah.name}`} onClick={() => setDeleteTarget({ type: 'wilayah', id: wilayah.id, name: wilayah.name, childCount: wilayah.lingkungan.length })}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto sm:self-start" onClick={() => openNewLingkungan(wilayah)}>
                    <Plus className="h-4 w-4" /> Tambah Lingkungan
                  </Button>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t bg-muted/20 p-3 sm:p-4">
                    {wilayah.lingkungan.length === 0 ? (
                      <p className="py-5 text-center text-sm text-muted-foreground">Belum ada lingkungan di wilayah ini.</p>
                    ) : (
                      <div className="space-y-2">
                        {wilayah.lingkungan.map((lingkungan) => (
                          <div key={lingkungan.id} className="flex items-start gap-3 rounded-lg border bg-background p-3">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{lingkungan.name}</p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">{lingkungan.area || 'Area belum diisi'}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <button type="button" className={iconButtonClass} title="Detail lingkungan" aria-label={`Detail ${lingkungan.name}`} onClick={() => setDetail({ type: 'lingkungan', wilayah, lingkungan })}><Eye className="h-4 w-4" /></button>
                              <button type="button" className={iconButtonClass} title="Edit lingkungan" aria-label={`Edit ${lingkungan.name}`} onClick={() => openEditLingkungan(wilayah, lingkungan)}><Pencil className="h-4 w-4" /></button>
                              <button type="button" className={`${iconButtonClass} hover:bg-destructive/10 hover:text-destructive`} title="Hapus lingkungan" aria-label={`Hapus ${lingkungan.name}`} onClick={() => setDeleteTarget({ type: 'lingkungan', id: lingkungan.id, name: lingkungan.name })}><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editor} onOpenChange={(open) => { if (!open && !isSaving) setEditor(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editor?.id ? 'Edit' : 'Tambah'} {editor?.type === 'wilayah' ? 'Wilayah' : 'Lingkungan'}</DialogTitle>
            <DialogDescription>
              {editor?.type === 'wilayah' ? 'Masukkan nama wilayah paroki.' : 'Pilih wilayah induk dan lengkapi data lingkungan.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEditor} className="space-y-4">
            {editor?.type === 'lingkungan' && (
              <Select id="parent-wilayah" label="Wilayah Induk *" value={form.wilayahId} onChange={(event) => setForm((value) => ({ ...value, wilayahId: event.target.value }))} required>
                <option value="">Pilih wilayah</option>
                {wilayahList?.map((wilayah) => <option key={wilayah.id} value={wilayah.id}>{wilayah.name}</option>)}
              </Select>
            )}
            <Input id="area-name" label={`Nama ${editor?.type === 'wilayah' ? 'Wilayah' : 'Lingkungan'} *`} value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required autoFocus />
            {editor?.type === 'lingkungan' && (
              <Input id="area-location" label="Area / Perumahan" placeholder="Contoh: Vila Mutiara Gading" value={form.area} onChange={(event) => setForm((value) => ({ ...value, area: event.target.value }))} />
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setEditor(null)} disabled={isSaving}>Batal</Button>
              <Button type="submit" loading={isSaving}>Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(open) => { if (!open) setDetail(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detail {detail?.type === 'wilayah' ? 'Wilayah' : 'Lingkungan'}</DialogTitle>
            <DialogDescription>Informasi master data paroki.</DialogDescription>
          </DialogHeader>
          {detail?.type === 'wilayah' && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Nama Wilayah</p>
                <p className="mt-1 text-lg font-semibold">{detail.wilayah.name}</p>
                <Badge variant="secondary" className="mt-2">{detail.wilayah.lingkungan.length} lingkungan</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Daftar Lingkungan</p>
                {detail.wilayah.lingkungan.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada lingkungan.</p> : detail.wilayah.lingkungan.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{item.name}</p><p className="truncate text-xs text-muted-foreground">{item.area || 'Area belum diisi'}</p></div>
                    {!!item.users_count && <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" />{item.users_count}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {detail?.type === 'lingkungan' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Nama Lingkungan</p><p className="mt-1 font-semibold">{detail.lingkungan.name}</p></div>
              <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Wilayah Induk</p><p className="mt-1 font-semibold">{detail.wilayah.name}</p></div>
              <div className="rounded-lg border p-4 sm:col-span-2"><p className="text-xs text-muted-foreground">Area / Perumahan</p><p className="mt-1 font-semibold">{detail.lingkungan.area || '-'}</p></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !isDeleting) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus {deleteTarget?.type === 'wilayah' ? 'Wilayah' : 'Lingkungan'}?</DialogTitle>
            <DialogDescription>
              Data <strong>{deleteTarget?.name}</strong> akan dihapus permanen.
              {deleteTarget?.type === 'wilayah' && ` Seluruh ${deleteTarget.childCount ?? 0} lingkungan di dalamnya juga akan dihapus.`}
              {' '}Penghapusan ditolak jika data masih digunakan profil pengguna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Batal</Button>
            <Button variant="destructive" loading={isDeleting} onClick={confirmDelete}>Hapus Permanen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
