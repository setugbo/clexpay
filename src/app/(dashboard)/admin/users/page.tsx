'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, User, Shield, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { timeAgo } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  status: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  _count: { wallets: number; transactions: number };
}

interface UsersResponse {
  users: UserData[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

async function fetchUsers(page: number, search: string): Promise<UsersResponse> {
  const params = new URLSearchParams({ page: page.toString(), limit: '20' });
  if (search) params.set('search', search);
  const res = await fetch(`/api/admin/users?${params}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function updateUser(id: string, body: { status?: string; role?: string }) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<UserData | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => fetchUsers(page, search),
  });

  const mutation = useMutation({
    mutationFn: () => updateUser(editUser!.id, {
      status: editUser!.status,
      role: editUser!.role,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'User updated successfully', variant: 'success' });
      setEditUser(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500">Manage platform users</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-slate-500">User</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                              <span className="text-emerald-700 font-semibold">
                                {user.firstName?.[0] || user.email[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {user.role === 'super_admin' && <Shield className="h-4 w-4 text-red-500" />}
                            <Badge variant="outline">{user.role}</Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          {timeAgo(new Date(user.createdAt))}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditUser(user)}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-slate-500">
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="font-medium text-slate-900">{editUser.email}</p>
                <p className="text-sm text-slate-500">
                  {editUser._count.wallets} wallets, {editUser._count.transactions} transactions
                </p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-4"
                  value={editUser.status}
                  onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-4"
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditUser(null)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => mutation.mutate()}>
                  {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
