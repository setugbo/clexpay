'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Eye, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, timeAgo } from '@/lib/utils';

interface TransactionData {
  id: string;
  userId: string;
  type: string;
  subtype: string | null;
  currency: string | null;
  amount: string;
  fee: string;
  status: string;
  reference: string;
  description: string | null;
  createdAt: string;
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
}

interface TransactionsResponse {
  transactions: TransactionData[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

async function deleteTransaction(id: string) {
  const res = await fetch(`/api/admin/transactions/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

async function fetchTransactions(page: number, type: string, status: string): Promise<TransactionsResponse> {
  const params = new URLSearchParams({ page: page.toString(), limit: '20' });
  if (type) params.set('type', type);
  if (status) params.set('status', status);
  const res = await fetch(`/api/admin/transactions?${params}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-700',
};

const TYPE_COLORS: Record<string, string> = {
  deposit: 'text-green-600',
  withdrawal: 'text-red-600',
  transfer: 'text-blue-600',
  trade: 'text-purple-600',
  bill: 'text-orange-600',
  giftcard: 'text-pink-600',
};

export default function AdminTransactionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [selectedTx, setSelectedTx] = useState<TransactionData | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-transactions', page, type, status],
    queryFn: () => fetchTransactions(page, type, status),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      setSelectedTx(null);
    },
    onError: (error: Error) => {
      alert('Failed to delete: ' + error.message);
    },
  });

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-transactions', page, type, status] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
        <p className="text-slate-500">View and manage all transactions</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-4">
            <select
              className="h-10 rounded-lg border px-3 text-sm"
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
            >
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
              <option value="trade">Trade</option>
              <option value="bill">Bill</option>
              <option value="giftcard">Gift Card</option>
            </select>
            <select
              className="h-10 rounded-lg border px-3 text-sm"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 font-medium">Failed to load transactions</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Reference</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">User</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.transactions.map((tx) => (
                      <tr key={tx.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm">{tx.reference}</span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-slate-900">{tx.user.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-medium capitalize ${TYPE_COLORS[tx.type]}`}>
                            {tx.type} {tx.subtype && `(${tx.subtype})`}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">
                            {formatCurrency(Number(tx.amount))}
                          </p>
                          <p className="text-xs text-slate-500">{tx.currency}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={STATUS_COLORS[tx.status]}>{tx.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          {timeAgo(new Date(tx.createdAt))}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedTx(tx)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                if (window.confirm(`Delete transaction ${tx.reference}? This cannot be undone.`)) {
                                  deleteMutation.mutate(tx.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
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

      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Reference</p>
                  <p className="font-mono font-medium">{selectedTx.reference}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge className={STATUS_COLORS[selectedTx.status]}>{selectedTx.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Type</p>
                  <p className="font-medium capitalize">{selectedTx.type}{selectedTx.subtype ? ` ${selectedTx.subtype}` : ''}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Amount</p>
                  <p className="font-bold text-lg">{formatCurrency(Number(selectedTx.amount))}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Fee</p>
                  <p className="font-medium">{formatCurrency(Number(selectedTx.fee))}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Currency</p>
                  <p className="font-medium">{selectedTx.currency}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">User</p>
                  <p className="font-medium">{selectedTx.user.email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Description</p>
                  <p className="font-medium">{selectedTx.description || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Date</p>
                  <p className="font-medium">{new Date(selectedTx.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedTx(null)}>
                  Close
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    if (window.confirm(`Delete transaction ${selectedTx.reference}? This cannot be undone.`)) {
                      deleteMutation.mutate(selectedTx.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4 mr-2" />Delete</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
