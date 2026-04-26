'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Gift, CheckCircle, XCircle, Clock, AlertTriangle, Package, RefreshCw, Search, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/toast';

interface GiftCardOrder {
  id: string;
  userId: string;
  reference: string;
  amount: number;
  status: string;
  createdAt: string;
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
  metadata: Record<string, unknown> | null;
}

interface OrderStats {
  total: number;
  pending: number;
  manualQueue: number;
  completed: number;
  failed: number;
  flagged: number;
}

interface GiftCardsResponse {
  orders: GiftCardOrder[];
  stats: OrderStats;
  statuses: Record<string, string>;
}

const STATUS_COLORS: Record<string, string> = {
  initiated: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  auto_attempt: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  manual_queue: 'bg-purple-100 text-purple-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-red-100 text-red-700',
  flagged: 'bg-red-100 text-red-700',
};

const getMetaField = (meta: Record<string, unknown> | null, field: string, fallback = ''): string => {
  if (!meta) return fallback;
  const value = meta[field];
  return value !== undefined ? String(value) : fallback;
};

async function fetchGiftCards(view?: string): Promise<GiftCardsResponse> {
  const params = view ? `?view=${view}` : '';
  const res = await fetch(`/api/admin/giftcards${params}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function fulfillOrder(transactionId: string, cardCode: string) {
  const res = await fetch('/api/admin/giftcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionId, cardCode, action: 'fulfill' }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

async function rejectOrder(transactionId: string, reason: string) {
  const res = await fetch('/api/admin/giftcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionId, reason, action: 'reject' }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

async function flagOrder(transactionId: string, reason: string) {
  const res = await fetch('/api/admin/giftcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionId, reason, action: 'flag' }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

export default function AdminGiftCardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<GiftCardOrder | null>(null);
  const [cardCode, setCardCode] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [actionMode, setActionMode] = useState<'fulfill' | 'reject' | 'flag' | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-giftcards', view],
    queryFn: () => fetchGiftCards(view || undefined),
  });

  const fulfillMutation = useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) => fulfillOrder(id, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-giftcards'] });
      toast({ title: 'Order fulfilled successfully', variant: 'success' });
      setSelectedOrder(null);
      setCardCode('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-giftcards'] });
      toast({ title: 'Order rejected and refunded', variant: 'success' });
      setSelectedOrder(null);
      setRejectReason('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => flagOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-giftcards'] });
      toast({ title: 'Order flagged for review', variant: 'success' });
      setSelectedOrder(null);
      setFlagReason('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleAction = () => {
    if (!selectedOrder) return;
    if (actionMode === 'fulfill' && cardCode) {
      fulfillMutation.mutate({ id: selectedOrder.id, code: cardCode });
    } else if (actionMode === 'reject' && rejectReason) {
      rejectMutation.mutate({ id: selectedOrder.id, reason: rejectReason });
    } else if (actionMode === 'flag' && flagReason) {
      flagMutation.mutate({ id: selectedOrder.id, reason: flagReason });
    }
  };

  const getOrderStatus = (order: GiftCardOrder): string => {
    const meta = order.metadata;
    return getMetaField(meta, 'orderStatus', order.status);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gift Card Orders</h1>
          <p className="text-slate-500">Manage gift card purchases</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {data?.stats && (
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.stats.total}</p>
                  <p className="text-sm text-slate-500">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.stats.pending}</p>
                  <p className="text-sm text-slate-500">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.stats.manualQueue}</p>
                  <p className="text-sm text-slate-500">Manual Queue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.stats.completed}</p>
                  <p className="text-sm text-slate-500">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.stats.failed}</p>
                  <p className="text-sm text-slate-500">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.stats.flagged}</p>
                  <p className="text-sm text-slate-500">Flagged</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant={view === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('')}
            >
              All
            </Button>
            <Button
              variant={view === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('pending')}
            >
              Pending
            </Button>
            <Button
              variant={view === 'manual_queue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('manual_queue')}
            >
              Manual Queue
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
          ) : data?.orders.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No orders found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Reference</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">User</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.orders.map((order) => {
                    const meta = order.metadata as Record<string, unknown> | null;
                    const orderStatus = getOrderStatus(order);
                    const statusConfig = STATUS_COLORS[orderStatus] || 'bg-gray-100 text-gray-700';
                    
                    return (
                      <tr key={order.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm">{order.reference}</span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-slate-900">{order.user.email}</p>
                          <p className="text-xs text-slate-500">
                            {order.user.firstName} {order.user.lastName}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-slate-900">
                            {getMetaField(meta, 'productName', 'Gift Card')}
                          </p>
                          <p className="text-xs text-slate-500">
                            ${String(meta?.usdAmount ?? '')} - {String(meta?.brand ?? '')}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{formatAmount(order.amount)}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={statusConfig}>{orderStatus}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setActionMode('fulfill');
                              }}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setActionMode('reject');
                              }}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setActionMode('flag');
                              }}
                            >
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedOrder && actionMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {actionMode === 'fulfill' && 'Fulfill Order'}
                {actionMode === 'reject' && 'Reject Order'}
                {actionMode === 'flag' && 'Flag Order'}
              </CardTitle>
              <CardDescription>
                Reference: {selectedOrder.reference}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Product</p>
                <p className="font-medium">
                  {(selectedOrder.metadata?.productName as string) || 'Gift Card'}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  ${String(selectedOrder.metadata?.usdAmount ?? '')} - {String(selectedOrder.metadata?.brand ?? '')}
                </p>
                <p className="font-medium mt-2">
                  {formatAmount(selectedOrder.amount)}
                </p>
              </div>

              {actionMode === 'fulfill' && (
                <div className="space-y-2">
                  <Label>Gift Card Code</Label>
                  <Input
                    placeholder="Enter card code"
                    value={cardCode}
                    onChange={(e) => setCardCode(e.target.value)}
                  />
                </div>
              )}

              {actionMode === 'reject' && (
                <div className="space-y-2">
                  <Label>Reason for Rejection</Label>
                  <Input
                    placeholder="Enter reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              )}

              {actionMode === 'flag' && (
                <div className="space-y-2">
                  <Label>Reason for Flagging</Label>
                  <Input
                    placeholder="Enter reason"
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedOrder(null);
                    setCardCode('');
                    setRejectReason('');
                    setFlagReason('');
                    setActionMode(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  disabled={
                    (actionMode === 'fulfill' && !cardCode) ||
                    (actionMode === 'reject' && !rejectReason) ||
                    (actionMode === 'flag' && !flagReason) ||
                    fulfillMutation.isPending ||
                    rejectMutation.isPending ||
                    flagMutation.isPending
                  }
                  onClick={handleAction}
                >
                  {fulfillMutation.isPending || rejectMutation.isPending || flagMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {actionMode === 'fulfill' && 'Fulfill'}
                      {actionMode === 'reject' && 'Reject & Refund'}
                      {actionMode === 'flag' && 'Flag'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}