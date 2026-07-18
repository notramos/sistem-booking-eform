"use client";

import { useState } from "react";
import { usersApi } from "@/lib/api/users";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getRoleBadgeColor, getRoleLabel } from "@/lib/utils";
import { Plus, UserCheck, UserX, Pencil, XCircle } from "lucide-react";
import type { User } from "@/types";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "jemaat",
  phone: "",
  department: "",
  nip: "",
};

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState(emptyForm);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", department: "", nip: "", role: "jemaat" });
  const [toggleTarget, setToggleTarget] = useState<User | null>(null);

  const { data: usersData, isLoading, isError, refetch } = useQuery({
    queryKey: ["users", page],
    queryFn: async () => {
      const res = await usersApi.list({ page });
      return res.data;
    },
  });

  const createUser = useMutation({
    mutationFn: (data: typeof formData) =>
      usersApi.create(data as Parameters<typeof usersApi.create>[0]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setShowForm(false);
      setFormData(emptyForm);
    },
  });

  const updateUser = useMutation({
    mutationFn: (data: { id: string; payload: Partial<User & { role?: string }> }) =>
      usersApi.update(data.id, data.payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
    },
  });

  const toggleActive = useMutation({
    mutationFn: (id: string) => usersApi.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(formData);
  };

  const openEdit = (user: User) => {
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      department: user.department || "",
      nip: user.nip || "",
      role: user.roles?.[0]?.name || "jemaat",
    });
    setEditingUser(user);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUser.mutate({ id: editingUser.id, payload: editForm });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelola User</h1>
          <p className="text-muted-foreground mt-1">
            Manajemen pengguna sistem
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah User
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah User Baru</CardTitle>
            <CardDescription>
              Buat akun baru untuk pengguna sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Input
                label="Nama *"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <Input
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              <Input
                label="Password *"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
              <Select
                label="Role *"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="jemaat">Jemaat</option>
                <option value="sekretariat">Sekretariat</option>
                <option value="admin">Admin Gereja</option>
              </Select>
              <Input
                label="Telepon"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              <Input
                label="Departemen"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              />
              <Input
                label="NIP"
                value={formData.nip}
                onChange={(e) =>
                  setFormData({ ...formData, nip: e.target.value })
                }
              />
              <div className="flex items-end gap-2">
                <Button type="submit" loading={createUser.isPending}>
                  Simpan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <Spinner size="lg" center label="Memuat data pengguna..." />
          ) : isError ? (
            <div className="flex flex-col items-center gap-4 text-center py-12">
              <XCircle className="w-12 h-12 text-destructive" />
              <p className="text-muted-foreground">Gagal memuat data user</p>
              <Button variant="outline" onClick={() => refetch()}>Muat Ulang</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Departemen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersData?.data?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {user.roles?.[0]?.name ? (
                        <Badge className={getRoleBadgeColor(user.roles[0].name)}>
                          {getRoleLabel(user.roles[0].name)}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {user.department || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "success" : "secondary"}>
                        {user.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setToggleTarget(user)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.is_active
                              ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              : "text-muted-foreground hover:text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {user.is_active ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {usersData?.meta && usersData.meta.last_page > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Halaman {usersData.meta.current_page} dari {usersData.meta.last_page} ({usersData.meta.total} user)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={usersData.meta.current_page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={usersData.meta.current_page >= usersData.meta.last_page}
              onClick={() => setPage((p) => Math.min(usersData.meta!.last_page, p + 1))}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Perbarui data akun {editingUser?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <Input label="Nama *" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            <Input label="Email *" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
            <Select label="Role" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
              <option value="jemaat">Jemaat</option>
              <option value="sekretariat">Sekretariat</option>
              <option value="admin">Admin Gereja</option>
            </Select>
            <Input label="Telepon" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <Input label="Departemen" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
            <Input label="NIP" value={editForm.nip} onChange={(e) => setEditForm({ ...editForm, nip: e.target.value })} />
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setEditingUser(null)}>Batal</Button>
              <Button type="submit" loading={updateUser.isPending}>Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!toggleTarget} onOpenChange={(open) => { if (!open) setToggleTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{toggleTarget?.is_active ? "Nonaktifkan User" : "Aktifkan User"}</DialogTitle>
            <DialogDescription>
              {toggleTarget?.is_active
                ? `${toggleTarget?.name} tidak akan bisa login setelah dinonaktifkan. Yakin ingin melanjutkan?`
                : `${toggleTarget?.name} akan bisa login kembali. Yakin ingin melanjutkan?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setToggleTarget(null)}>Batal</Button>
            <Button
              variant={toggleTarget?.is_active ? "destructive" : "default"}
              disabled={toggleActive.isPending}
              onClick={() => { if (toggleTarget) toggleActive.mutate(toggleTarget.id); setToggleTarget(null); }}
            >
              {toggleTarget?.is_active ? "Nonaktifkan" : "Aktifkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
