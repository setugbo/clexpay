'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, User, CheckCircle, XCircle, Clock, Search, Eye, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/toast';

interface KYCUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  kycStatus: string;
  bvnVerifiedAt: string | null;
  idVerifiedAt: string | null;
  phone: string | null;
  createdAt: string;
}

interface KYCStats {
  total: number;
  pending: number;
  verified: number;
}

interface KYCResponse {
  users: KYCUser[];
  stats: KYCStats;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-slate-100 text-slate-700',
  pending: 'bg-yellow-100 text-yellow-700',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

async function fetchKYC(status?: string, page = 1): Promise<KYCResponse> {
  const params = new URLSearchParams({ page: page.toString() });
  if (status) params.set('status', status);
  const res = await fetch(`/api/admin/kyc?${params}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function verifyKYC(userId: string) {
  const res = await fetch('/api/admin/kyc', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, action: 'verify' }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

async function rejectKYC(userId: string, reason: string) {
  const res = await fetch('/api/admin/kyc', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, action: 'reject', reason }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

export default function AdminKYCUPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<KYCUser | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-kyc', status],
    queryFn: () => fetchKYC(status || undefined),
  });

  const verifyMutation = useMutation({
    mutationFn: verifyKYC,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc'] });
      toast({ title: 'KYC Verified successfully', variant: 'success' });
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectKYC(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc'] });
      toast({ title: 'KYC Rejected', variant: 'success' });
      setSelectedUser(null);
      setShowRejectModal(false);
      setRejectReason('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleReject = () => {
    if (!selectedUser || !rejectReason) return;
    rejectMutation.mutate({ id: selectedUser.id, reason: rejectReason });
  };

  const stats = data?.stats || { total: 0, pending: 0, verified: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">KYC Verification</h1>
          <p className="text-slate-500">Verify user identity documents</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <User className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-slate-500">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-slate-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.verified}</p>
                <p className="text-sm text-slate-500">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant={status === '' ? 'default' : 'outline'} size="sm" onClick={() => setStatus('')}>
              All
            </Button>
            <Button variant={status === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setStatus('pending')}>
              Pending
            </Button>
            <Button variant={status === 'verified' ? 'default' : 'outline'} size="sm" onClick={() => setStatus('verified')}>
              Verified
            </Button>
            <Button variant={status === 'rejected' ? 'default' : 'outline'} size="sm" onClick={() => setStatus('rejected')}>
              Rejected
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : data?.users.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">User</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">BVN</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={STATUS_COLORS[user.kycStatus]}>
                          {user.kycStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {user.bvnVerifiedAt ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {user.idVerifiedAt ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {user.kycStatus === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => verifyMutation.mutate(user.id)}
                                disabled={verifyMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowRejectModal(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject KYC</CardTitle>
              <CardDescription>
                Reason is required for rejection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                <p className="text-sm text-slate-500">{selectedUser.email}</p>
              </div>
              <div className="space-y-2">
                <Label>Rejection Reason</Label>
                <Input
                  placeholder="Enter reason for rejection"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600"
                  onClick={handleReject}
                  disabled={!rejectReason || rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}