'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usersApi } from '@/lib/api/users';
import { useWilayah } from '@/hooks/useParish';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getInitials, getRoleBadgeColor, getRoleLabel } from '@/lib/utils';
import { Eye, Mail, MapPin, Pencil, Phone, Plus, Search, ShieldCheck, UserCheck, Users, UserX, XCircle } from 'lucide-react';
import type { User, Wilayah } from '@/types';

const ROLES = [
  { value: 'umat', label: 'Umat' }, { value: 'sekretariat', label: 'Sekretariat' },
  { value: 'p2', label: 'P2' }, { value: 'pastor', label: 'Pastor' }, { value: 'it_admin', label: 'IT Admin' },
];
type UserForm = { name: string; email: string; password: string; role: string; phone: string; department: string; position: string; nip: string; wilayah_id: string; lingkungan_id: string; parish: string };
const emptyForm: UserForm = { name: '', email: '', password: '', role: 'umat', phone: '', department: '', position: '', nip: '', wilayah_id: '', lingkungan_id: '', parish: 'Paroki Harapan Indah' };

function avatarUrl(path?: string | null) {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  const root = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api').replace(/\/api\/?$/, '');
  return `${root}/storage/${path.replace(/^\/?storage\//, '')}`;
}

function UserEditor({ value, onChange, wilayah, editing }: { value: UserForm; onChange: (next: UserForm) => void; wilayah: Wilayah[]; editing?: boolean }) {
  const selectedWilayah = wilayah.find((w) => w.id === value.wilayah_id);
  const set = (key: keyof UserForm, fieldValue: string) => onChange({ ...value, [key]: fieldValue });
  return <div className="space-y-5 py-2">
    <section className="space-y-3"><p className="text-sm font-semibold">Informasi akun</p><div className="grid gap-3 sm:grid-cols-2">
      <Input label="Nama lengkap *" value={value.name} onChange={(e) => set('name', e.target.value)} required />
      <Input label="Email *" type="email" value={value.email} onChange={(e) => set('email', e.target.value)} required />
      {!editing && <Input label="Password awal *" type="password" minLength={8} value={value.password} onChange={(e) => set('password', e.target.value)} required />}
      <Select label="Role *" value={value.role} onChange={(e) => set('role', e.target.value)}>{ROLES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
    </div></section>
    <section className="space-y-3 border-t pt-4"><p className="text-sm font-semibold">Kontak dan keanggotaan</p><div className="grid gap-3 sm:grid-cols-2">
      <Input label="Nomor telepon" inputMode="tel" value={value.phone} onChange={(e) => set('phone', e.target.value)} />
      <Input label="NIP / nomor anggota" value={value.nip} onChange={(e) => set('nip', e.target.value)} />
      <Input label="Departemen / seksi" value={value.department} onChange={(e) => set('department', e.target.value)} />
      <Input label="Jabatan" value={value.position} onChange={(e) => set('position', e.target.value)} />
      <Input label="Paroki" value={value.parish} onChange={(e) => set('parish', e.target.value)} />
    </div></section>
    <section className="space-y-3 border-t pt-4"><p className="text-sm font-semibold">Wilayah dan lingkungan</p><div className="grid gap-3 sm:grid-cols-2">
      <Select label="Wilayah" value={value.wilayah_id} onChange={(e) => onChange({ ...value, wilayah_id: e.target.value, lingkungan_id: '' })}><option value="">Pilih wilayah</option>{wilayah.filter((w) => w.is_active !== false).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select>
      <Select label="Lingkungan" value={value.lingkungan_id} disabled={!value.wilayah_id} onChange={(e) => set('lingkungan_id', e.target.value)}><option value="">{value.wilayah_id ? 'Pilih lingkungan' : 'Pilih wilayah dulu'}</option>{(selectedWilayah?.lingkungan ?? []).filter((l) => l.is_active !== false).map((l) => <option key={l.id} value={l.id}>{l.area ? `${l.name} — ${l.area}` : l.name}</option>)}</Select>
    </div></section>
  </div>;
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const { data: wilayah = [] } = useWilayah();
  const [page, setPage] = useState(1), [searchDraft, setSearchDraft] = useState(''), [search, setSearch] = useState(''), [role, setRole] = useState(''), [active, setActive] = useState('');
  const [editorOpen, setEditorOpen] = useState(false), [editingUser, setEditingUser] = useState<User | null>(null), [form, setForm] = useState<UserForm>(emptyForm);
  const [detailUser, setDetailUser] = useState<User | null>(null), [toggleTarget, setToggleTarget] = useState<User | null>(null);
  const params = useMemo(() => ({ page, search: search || undefined, role: role || undefined, is_active: active || undefined }), [page, search, role, active]);
  const { data: usersData, isLoading, isError, refetch } = useQuery({ queryKey: ['users', params], queryFn: async () => (await usersApi.list(params)).data });
  const closeEditor = () => { setEditorOpen(false); setEditingUser(null); setForm(emptyForm); };
  const mutationError = (err: { message?: string }) => toast.error(err.message || 'Data user gagal disimpan');
  const saveUser = useMutation({
    mutationFn: async () => {
      const payload = { ...form, wilayah_id: form.wilayah_id || null, lingkungan_id: form.lingkungan_id || null };
      if (!editingUser) return usersApi.create(payload);
      const { password: _password, ...updatePayload } = payload; void _password;
      return usersApi.update(editingUser.id, updatePayload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(editingUser ? 'User berhasil diperbarui' : 'User berhasil ditambahkan'); closeEditor(); }, onError: mutationError,
  });
  const toggleActive = useMutation({ mutationFn: (id: string) => usersApi.toggleActive(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Status user berhasil diubah'); setToggleTarget(null); }, onError: mutationError });
  const openCreate = () => { setEditingUser(null); setForm(emptyForm); setEditorOpen(true); };
  const openEdit = (item: User) => { setEditingUser(item); setForm({ name: item.name, email: item.email, password: '', role: item.roles?.[0]?.name || 'umat', phone: item.phone || '', department: item.department || '', position: item.position || '', nip: item.nip || '', wilayah_id: item.wilayah_id || '', lingkungan_id: item.lingkungan_id || '', parish: item.parish || 'Paroki Harapan Indah' }); setEditorOpen(true); };
  const users = usersData?.data ?? [], activeOnPage = users.filter((item) => item.is_active).length;

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold">Kelola User</h1><p className="mt-1 text-muted-foreground">Kelola akun, akses, dan data keanggotaan.</p></div><Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Tambah User</Button></div>
    <div className="grid gap-3 sm:grid-cols-3">
      <Card><CardContent className="flex items-center gap-3 p-4"><span className="rounded-xl bg-primary/10 p-2.5 text-primary"><Users className="h-5 w-5" /></span><div><p className="text-xs text-muted-foreground">Total user</p><p className="text-xl font-bold">{usersData?.meta?.total ?? 0}</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-3 p-4"><span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600"><UserCheck className="h-5 w-5" /></span><div><p className="text-xs text-muted-foreground">Aktif di halaman ini</p><p className="text-xl font-bold">{activeOnPage}</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-3 p-4"><span className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-xs text-muted-foreground">Akun internal</p><p className="text-xl font-bold">{users.filter((item) => item.roles?.[0]?.name !== 'umat').length}</p></div></CardContent></Card>
    </div>
    <Card><CardHeader className="pb-3"><CardTitle className="text-base">Cari dan filter</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_160px_auto]">
      <Input placeholder="Cari nama, email, atau NIP" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setSearch(searchDraft.trim()); } }} />
      <Select aria-label="Filter role" value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }}><option value="">Semua role</option>{ROLES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
      <Select aria-label="Filter status" value={active} onChange={(e) => { setPage(1); setActive(e.target.value); }}><option value="">Semua status</option><option value="1">Aktif</option><option value="0">Nonaktif</option></Select>
      <Button variant="outline" onClick={() => { setPage(1); setSearch(searchDraft.trim()); }}><Search className="mr-2 h-4 w-4" />Cari</Button>
    </CardContent></Card>
    <Card><CardContent className="p-0">{isLoading ? <Spinner size="lg" center label="Memuat data pengguna..." /> : isError ? <div className="flex flex-col items-center gap-4 py-12 text-center"><XCircle className="h-12 w-12 text-destructive" /><p className="text-muted-foreground">Gagal memuat data user</p><Button variant="outline" onClick={() => refetch()}>Muat Ulang</Button></div> : users.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">Tidak ada user yang sesuai filter.</div> : <>
      <div className="hidden md:block"><Table><TableHeader><TableRow><TableHead>Pengguna</TableHead><TableHead>Role</TableHead><TableHead>Wilayah / Lingkungan</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{users.map((item) => <TableRow key={item.id}><TableCell><div className="flex items-center gap-3"><Avatar><AvatarImage src={avatarUrl(item.avatar)} alt={item.name} /><AvatarFallback>{getInitials(item.name)}</AvatarFallback></Avatar><div className="min-w-0"><p className="font-medium">{item.name}</p><p className="max-w-[240px] truncate text-xs text-muted-foreground">{item.email}</p></div></div></TableCell><TableCell>{item.roles?.[0]?.name ? <Badge className={getRoleBadgeColor(item.roles[0].name)}>{getRoleLabel(item.roles[0].name)}</Badge> : '-'}</TableCell><TableCell className="text-sm"><p>{item.wilayah?.name || '-'}</p><p className="text-xs text-muted-foreground">{item.lingkungan?.name || 'Belum diatur'}</p></TableCell><TableCell><Badge variant={item.is_active ? 'success' : 'secondary'}>{item.is_active ? 'Aktif' : 'Nonaktif'}</Badge></TableCell><TableCell><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" aria-label="Lihat detail" onClick={() => setDetailUser(item)}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Edit user" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>{item.id !== currentUser?.id && <Button size="icon" variant="ghost" aria-label={item.is_active ? 'Nonaktifkan user' : 'Aktifkan user'} onClick={() => setToggleTarget(item)}>{item.is_active ? <UserX className="h-4 w-4 text-destructive" /> : <UserCheck className="h-4 w-4 text-emerald-600" />}</Button>}</div></TableCell></TableRow>)}</TableBody></Table></div>
      <div className="divide-y md:hidden">{users.map((item) => <div key={item.id} className="space-y-3 p-4"><div className="flex items-start gap-3"><Avatar className="h-11 w-11"><AvatarImage src={avatarUrl(item.avatar)} alt={item.name} /><AvatarFallback>{getInitials(item.name)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="font-semibold">{item.name}</p><p className="truncate text-xs text-muted-foreground">{item.email}</p><div className="mt-2 flex flex-wrap gap-1.5">{item.roles?.[0]?.name && <Badge className={getRoleBadgeColor(item.roles[0].name)}>{getRoleLabel(item.roles[0].name)}</Badge>}<Badge variant={item.is_active ? 'success' : 'secondary'}>{item.is_active ? 'Aktif' : 'Nonaktif'}</Badge></div></div></div><p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{item.wilayah?.name || 'Wilayah belum diatur'}{item.lingkungan?.name ? ` · ${item.lingkungan.name}` : ''}</p><div className="grid grid-cols-2 gap-2"><Button variant="outline" size="sm" onClick={() => setDetailUser(item)}><Eye className="mr-2 h-4 w-4" />Detail</Button><Button variant="outline" size="sm" onClick={() => openEdit(item)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>{item.id !== currentUser?.id && <Button className="col-span-2" variant="ghost" size="sm" onClick={() => setToggleTarget(item)}>{item.is_active ? 'Nonaktifkan akun' : 'Aktifkan akun'}</Button>}</div></div>)}</div>
    </>}</CardContent></Card>
    {usersData?.meta && usersData.meta.last_page > 1 && <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Halaman {usersData.meta.current_page} dari {usersData.meta.last_page} · {usersData.meta.total} user</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button><Button variant="outline" size="sm" disabled={page >= usersData.meta.last_page} onClick={() => setPage((p) => p + 1)}>Selanjutnya</Button></div></div>}
    <Dialog open={editorOpen} onOpenChange={(open) => { if (!open) closeEditor(); }}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{editingUser ? 'Edit User' : 'Tambah User'}</DialogTitle><DialogDescription>{editingUser ? `Perbarui akun ${editingUser.name}.` : 'Buat akun dan tentukan akses serta data keanggotaannya.'}</DialogDescription></DialogHeader><form onSubmit={(e) => { e.preventDefault(); saveUser.mutate(); }}><UserEditor value={form} onChange={setForm} wilayah={wilayah} editing={!!editingUser} /><DialogFooter><Button type="button" variant="ghost" onClick={closeEditor}>Batal</Button><Button type="submit" loading={saveUser.isPending}>Simpan User</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={!!detailUser} onOpenChange={(open) => { if (!open) setDetailUser(null); }}><DialogContent><DialogHeader><DialogTitle>Detail User</DialogTitle><DialogDescription>Informasi akun dan keanggotaan.</DialogDescription></DialogHeader>{detailUser && <div className="space-y-4"><div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4"><Avatar className="h-14 w-14"><AvatarImage src={avatarUrl(detailUser.avatar)} alt={detailUser.name} /><AvatarFallback>{getInitials(detailUser.name)}</AvatarFallback></Avatar><div><p className="font-semibold">{detailUser.name}</p><p className="text-sm text-muted-foreground">{getRoleLabel(detailUser.roles?.[0]?.name || '')}</p></div></div><div className="grid gap-3 text-sm sm:grid-cols-2"><p className="flex gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{detailUser.email}</p><p className="flex gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{detailUser.phone || '-'}</p><div><p className="text-xs text-muted-foreground">Departemen / Jabatan</p><p>{[detailUser.department, detailUser.position].filter(Boolean).join(' · ') || '-'}</p></div><div><p className="text-xs text-muted-foreground">NIP / nomor anggota</p><p>{detailUser.nip || '-'}</p></div><div><p className="text-xs text-muted-foreground">Wilayah</p><p>{detailUser.wilayah?.name || '-'}</p></div><div><p className="text-xs text-muted-foreground">Lingkungan</p><p>{detailUser.lingkungan?.name || '-'}</p></div><div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Paroki</p><p>{detailUser.parish || '-'}</p></div></div></div>}<DialogFooter><Button variant="outline" onClick={() => setDetailUser(null)}>Tutup</Button>{detailUser && <Button onClick={() => { const item = detailUser; setDetailUser(null); openEdit(item); }}>Edit User</Button>}</DialogFooter></DialogContent></Dialog>
    <Dialog open={!!toggleTarget} onOpenChange={(open) => { if (!open) setToggleTarget(null); }}><DialogContent><DialogHeader><DialogTitle>{toggleTarget?.is_active ? 'Nonaktifkan User' : 'Aktifkan User'}</DialogTitle><DialogDescription>{toggleTarget?.is_active ? `${toggleTarget.name} tidak akan bisa login setelah dinonaktifkan.` : `${toggleTarget?.name} akan bisa login kembali.`}</DialogDescription></DialogHeader><DialogFooter><Button variant="ghost" onClick={() => setToggleTarget(null)}>Batal</Button><Button variant={toggleTarget?.is_active ? 'destructive' : 'default'} loading={toggleActive.isPending} onClick={() => toggleTarget && toggleActive.mutate(toggleTarget.id)}>{toggleTarget?.is_active ? 'Nonaktifkan' : 'Aktifkan'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
