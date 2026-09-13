'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useWilayah } from '@/hooks/useParish';
import { usersApi } from '@/lib/api/users';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Building2, Camera, Lock, MapPin, Phone, Save, ShieldCheck, User } from 'lucide-react';
import { getInitials, getRoleLabel } from '@/lib/utils';

function avatarUrl(path?: string | null) {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  const root = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api').replace(/\/api\/?$/, '');
  return `${root}/storage/${path.replace(/^\/?storage\//, '')}`;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { data: wilayah = [] } = useWilayah();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({ name: '', phone: '', department: '', position: '', wilayah_id: '', lingkungan_id: '', parish: '' });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });

  useEffect(() => {
    if (!user) return;
    // Sinkronkan form saat data user selesai dimuat atau setelah refresh profil.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile({ name: user.name || '', phone: user.phone || '', department: user.department || '', position: user.position || '', wilayah_id: user.wilayah_id || '', lingkungan_id: user.lingkungan_id || '', parish: user.parish || 'Paroki Harapan Indah' });
  }, [user]);

  const lingkungan = useMemo(() => wilayah.find((item) => item.id === profile.wilayah_id)?.lingkungan.filter((item) => item.is_active !== false) ?? [], [wilayah, profile.wilayah_id]);
  const onError = (fallback: string) => (err: { message?: string }) => toast.error(err.message || fallback);
  const updateProfile = useMutation({ mutationFn: () => usersApi.profile.update({ ...profile, wilayah_id: profile.wilayah_id || null, lingkungan_id: profile.lingkungan_id || null }), onSuccess: async () => { await refreshUser(); toast.success('Profil berhasil diperbarui'); }, onError: onError('Gagal memperbarui profil') });
  const changePassword = useMutation({ mutationFn: () => usersApi.profile.changePassword(passwords.current_password, passwords.new_password, passwords.new_password_confirmation), onSuccess: () => { toast.success('Password berhasil diubah'); setPasswords({ current_password: '', new_password: '', new_password_confirmation: '' }); }, onError: onError('Gagal mengubah password') });
  const uploadAvatar = useMutation({ mutationFn: (file: File) => { const data = new FormData(); data.append('avatar', file); return usersApi.profile.uploadAvatar(data); }, onSuccess: async () => { await refreshUser(); toast.success('Foto profil berhasil diperbarui'); }, onError: onError('Gagal mengunggah foto') });
  const passwordValid = passwords.current_password.length > 0 && passwords.new_password.length >= 8 && passwords.new_password === passwords.new_password_confirmation;

  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold">Profil Saya</h1><p className="mt-1 text-muted-foreground">Kelola identitas, keanggotaan, dan keamanan akun.</p></div>
    <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="lg:sticky lg:top-20"><CardContent className="flex flex-col items-center p-6 text-center">
        <div className="relative"><Avatar className="h-24 w-24 border-4 border-background shadow"><AvatarImage src={avatarUrl(user?.avatar)} alt={user?.name || 'Foto profil'} /><AvatarFallback className="text-xl">{user ? getInitials(user.name) : <User className="h-8 w-8" />}</AvatarFallback></Avatar><button type="button" aria-label="Ganti foto profil" onClick={() => fileInputRef.current?.click()} disabled={uploadAvatar.isPending} className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60"><Camera className="h-4 w-4" /></button><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadAvatar.mutate(file); e.target.value = ''; }} /></div>
        <h2 className="mt-4 text-lg font-semibold">{user?.name || '-'}</h2><p className="break-all text-sm text-muted-foreground">{user?.email}</p>{user?.roles?.[0]?.name && <Badge variant="secondary" className="mt-2">{getRoleLabel(user.roles[0].name)}</Badge>}
        <div className="mt-5 w-full space-y-3 border-t pt-5 text-left text-sm"><p className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{user?.phone || 'Telepon belum diisi'}</span></p><p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{user?.wilayah?.name || 'Wilayah belum dipilih'}{user?.lingkungan?.name ? <><br /><span className="text-muted-foreground">{user.lingkungan.name}</span></> : null}</span></p><p className="flex gap-2"><Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{user?.parish || 'Paroki belum diisi'}</span></p><p className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{user?.is_active ? 'Akun aktif' : 'Akun nonaktif'}</span></p></div>
        <p className="mt-5 text-xs text-muted-foreground">Foto JPG, PNG, atau WebP. Maksimal mengikuti batas unggahan sistem.</p>
      </CardContent></Card>

      <div className="space-y-5">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5" />Informasi Profil</CardTitle><CardDescription>Data ini dipakai saat membuat peminjaman dan permohonan pelayanan.</CardDescription></CardHeader><CardContent><form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(); }} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2"><Input label="Nama lengkap *" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /><Input label="Email" value={user?.email || ''} disabled /><Input label="Nomor telepon" inputMode="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /><Input label="Paroki" value={profile.parish} onChange={(e) => setProfile({ ...profile, parish: e.target.value })} /></div>
          <div className="border-t pt-5"><p className="mb-3 text-sm font-semibold">Keanggotaan</p><div className="grid gap-4 sm:grid-cols-2"><Select label="Wilayah" value={profile.wilayah_id} onChange={(e) => setProfile({ ...profile, wilayah_id: e.target.value, lingkungan_id: '' })}><option value="">Pilih wilayah</option>{wilayah.filter((item) => item.is_active !== false).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select label="Lingkungan" value={profile.lingkungan_id} disabled={!profile.wilayah_id} onChange={(e) => setProfile({ ...profile, lingkungan_id: e.target.value })}><option value="">{profile.wilayah_id ? 'Pilih lingkungan' : 'Pilih wilayah dulu'}</option>{lingkungan.map((item) => <option key={item.id} value={item.id}>{item.area ? `${item.name} — ${item.area}` : item.name}</option>)}</Select><Input label="Departemen / seksi" value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} /><Input label="Jabatan" value={profile.position} onChange={(e) => setProfile({ ...profile, position: e.target.value })} /></div></div>
          <Button type="submit" loading={updateProfile.isPending}><Save className="mr-2 h-4 w-4" />Simpan Profil</Button>
        </form></CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Lock className="h-5 w-5" />Keamanan Akun</CardTitle><CardDescription>Gunakan sedikitnya 8 karakter dan jangan gunakan password yang sama dengan akun lain.</CardDescription></CardHeader><CardContent><form onSubmit={(e) => { e.preventDefault(); if (passwordValid) changePassword.mutate(); }} className="space-y-4"><div className="grid gap-4 md:grid-cols-3"><Input label="Password saat ini" type="password" autoComplete="current-password" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} /><Input label="Password baru" type="password" minLength={8} autoComplete="new-password" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} /><Input label="Konfirmasi password" type="password" minLength={8} autoComplete="new-password" error={passwords.new_password_confirmation && passwords.new_password !== passwords.new_password_confirmation ? 'Konfirmasi belum sama' : undefined} value={passwords.new_password_confirmation} onChange={(e) => setPasswords({ ...passwords, new_password_confirmation: e.target.value })} /></div><Button type="submit" variant="outline" disabled={!passwordValid} loading={changePassword.isPending}><Lock className="mr-2 h-4 w-4" />Perbarui Password</Button></form></CardContent></Card>
      </div>
    </div>
  </div>;
}
