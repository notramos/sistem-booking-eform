'use client'

import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Save, Camera, Lock, Upload } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usersApi } from '@/lib/api/users'
import { getInitials, cn } from '@/lib/utils'

export default function ProfilePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: typeof passwords) =>
      usersApi.profile.changePassword(data.current_password, data.new_password, data.new_password_confirmation),
    onSuccess: () => {
      setPasswords({ current_password: '', new_password: '', new_password_confirmation: '' })
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      return usersApi.profile.uploadAvatar(formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadAvatarMutation.mutate(file)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account information</p>
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
            Edit Profile
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
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
                  Name
                </label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone
                </label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="department" className="text-sm font-medium">
                  Department
                </label>
                <Input
                  id="department"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="position" className="text-sm font-medium">
                  Position
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
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
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
                  Current Password
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
                  New Password
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
                  Confirm New Password
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
                'Updating...'
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
