'use client';

import { useState } from 'react';
import { usersApi } from '@/lib/api/users';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { getRoleBadgeColor, getRoleLabel } from '@/lib/utils';
import { Plus, UserCheck, UserX } from 'lucide-react';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'jemaat',
    phone: '', department: '', nip: '',
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await usersApi.list();
      return res.data;
    },
  });

  const createUser = useMutation({
    mutationFn: (data: typeof formData) => usersApi.create(data as Parameters<typeof usersApi.create>[0]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
      setFormData({ name: '', email: '', password: '', role: 'jemaat', phone: '', department: '', nip: '' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: (id: string) => usersApi.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelola User</h1>
          <p className="text-muted-foreground mt-1">Manajemen pengguna sistem</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />Tambah User
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah User Baru</CardTitle>
            <CardDescription>Buat akun baru untuk pengguna sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nama *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label="Email *" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              <Input label="Password *" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              <Select label="Role *" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                <option value="jemaat">Jemaat</option>
                <option value="sekretariat">Sekretariat</option>
                <option value="admin">Admin Gereja</option>
              </Select>
              <Input label="Telepon" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              <Input label="Departemen" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
              <Input label="NIP" value={formData.nip} onChange={(e) => setFormData({ ...formData, nip: e.target.value })} />
              <div className="flex items-end gap-2">
                <Button type="submit" loading={createUser.isPending}>Simpan</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersData?.data?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.roles?.[0]?.name || '')}>
                        {getRoleLabel(user.roles?.[0]?.name || '')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.department || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'success' : 'secondary'}>
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => toggleActive.mutate(user.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.is_active
                            ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                            : 'text-muted-foreground hover:text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
