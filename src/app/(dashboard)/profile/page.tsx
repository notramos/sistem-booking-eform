'use client'

import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { SignaturePad, type SignaturePadHandle } from '@/components/ui/signature-pad'
import { User, Save, Camera, Lock, PenLine, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { usersApi } from '@/lib/api/users'
import { getInitials } from '@/lib/utils'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signaturePadRef = useRef<SignaturePadHandle>(null)
  const [drawingSignature, setDrawingSignature] = useState(false)
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false)

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    department: user?.department ?? '',
    position: user?.position ?? '',
  })

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof profile) => usersApi.profile.update(data),
    onSuccess: () => {
      toast.success('Profil berhasil diperbarui')
      refreshUser()
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal memperbarui profil')
    },
  })

  const signatureMutation = useMutation({
    mutationFn: (signature: string | null) => usersApi.profile.updateSignature(signature),
    onSuccess: (_data, variables) => {
      toast.success(variables ? 'Tanda tangan berhasil disimpan' : 'Tanda tangan berhasil dihapus')
      setDrawingSignature(false)
      setHasDrawnSignature(false)
      refreshUser()
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal menyimpan tanda tangan')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: typeof passwords) =>
      usersApi.profile.changePassword(data.current_password, data.new_password, data.new_password_confirmation),
    onSuccess: () => {
      toast.success('Password berhasil diubah')
      setPasswords({ current_password: '', new_password: '', new_password_confirmation: '' })
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal mengubah password')
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      return usersApi.profile.uploadAvatar(formData)
    },
    onSuccess: () => {
      toast.success('Avatar berhasil diunggah')
      refreshUser()
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Gagal mengunggah avatar')
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadAvatarMutation.mutate(file)
  }

  const handleSaveSignature = () => {
    const dataUrl = signaturePadRef.current?.getDataUrl()
    if (dataUrl) signatureMutation.mutate(dataUrl)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profil</h1>
        <p className="text-muted-foreground mt-1">Kelola informasi akun Anda</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-lg">
                  {user ? getInitials(user.name) : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition hover:bg-primary/90"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.roles?.[0]?.name && (
                <Badge variant="secondary" className="mt-1">
                  {user.roles[0].name}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Edit Profil
          </CardTitle>
          <CardDescription>Perbarui informasi pribadi Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateProfileMutation.mutate(profile)
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nama
                </label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Nomor Telepon
                </label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="department" className="text-sm font-medium">
                  Departemen
                </label>
                <Input
                  id="department"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="position" className="text-sm font-medium">
                  Jabatan
                </label>
                <Input
                  id="position"
                  value={profile.position}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="gap-2"
            >
              {updateProfileMutation.isPending ? (
                'Menyimpan...'
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PenLine className="h-5 w-5" />
            Tanda Tangan
          </CardTitle>
          <CardDescription>
            Simpan tanda tangan untuk mengisi dokumen booking secara otomatis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.signature && !drawingSignature ? (
            <div className="space-y-3">
              <div className="rounded-md border bg-white p-3 flex items-center justify-center max-w-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.signature} alt="Tanda tangan tersimpan" className="h-24 object-contain" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDrawingSignature(true)} className="gap-2">
                  <PenLine className="h-4 w-4" /> Ganti
                </Button>
                <Button
                  variant="outline"
                  onClick={() => signatureMutation.mutate(null)}
                  disabled={signatureMutation.isPending}
                  className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" /> Hapus
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-w-md">
              <SignaturePad ref={signaturePadRef} onChange={setHasDrawnSignature} />
              <div className="flex gap-2">
                <Button onClick={handleSaveSignature} disabled={!hasDrawnSignature || signatureMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" />
                  {signatureMutation.isPending ? 'Menyimpan...' : 'Simpan Tanda Tangan'}
                </Button>
                {user?.signature && (
                  <Button variant="ghost" onClick={() => { setDrawingSignature(false); setHasDrawnSignature(false); }}>
                    Batal
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5" />
            Ubah Password
          </CardTitle>
          <CardDescription>Perbarui password akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              changePasswordMutation.mutate(passwords)
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="current_password" className="text-sm font-medium">
                  Password Saat Ini
                </label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwords.current_password}
                  onChange={(e) =>
                    setPasswords({ ...passwords, current_password: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="new_password" className="text-sm font-medium">
                  Password Baru
                </label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwords.new_password}
                  onChange={(e) =>
                    setPasswords({ ...passwords, new_password: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="new_password_confirmation" className="text-sm font-medium">
                  Konfirmasi Password Baru
                </label>
                <Input
                  id="new_password_confirmation"
                  type="password"
                  value={passwords.new_password_confirmation}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      new_password_confirmation: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
              variant="outline"
              className="gap-2"
            >
              {changePasswordMutation.isPending ? (
                'Memperbarui...'
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Perbarui Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
