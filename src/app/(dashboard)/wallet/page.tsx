'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Send, Download, Wallet as WalletIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatCrypto, timeAgo } from '@/lib/utils';
import { useToast } from '@/hooks/toast';

interface WalletData {
  id: string;
  currency: string;
  balance: string;
  isCrypto: boolean;
}

interface TransactionData {
  id: string;
  type: string;
  subtype: string | null;
  currency: string | null;
  amount: string;
  fee: string;
  status: string;
  reference: string;
  description: string | null;
  createdAt: string;
}

async function fetchWallets(): Promise<WalletData[]> {
  const res = await fetch('/api/wallet');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function fetchTransactions(): Promise<{ transactions: TransactionData[] }> {
  const res = await fetch('/api/transactions?limit=20');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function walletAction(action: string, body: Record<string, unknown>) {
  const res = await fetch('/api/wallet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

type ModalType = 'fund' | 'withdraw' | 'transfer' | null;

export default function WalletPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalType>(null);
  const [formData, setFormData] = useState({
    currency: 'NGN',
    amount: '',
    toEmail: '',
  });

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: fetchWallets,
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });

  const mutation = useMutation({
    mutationFn: () => walletAction(modal!, {
      ...(modal === 'transfer' && { toEmail: formData.toEmail }),
      currency: formData.currency,
      amount: parseFloat(formData.amount),
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: 'Success',
        description: `${modal} successful! Reference: ${data.reference}`,
        variant: 'success',
      });
      setModal(null);
      setFormData({ currency: 'NGN', amount: '', toEmail: '' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }
    if (modal === 'transfer' && !formData.toEmail) {
      toast({ title: 'Error', description: 'Please enter recipient email', variant: 'destructive' });
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
          <p className="text-slate-500">Manage your wallets and transactions</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Balance</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(
                    wallets?.reduce((sum: number, w: WalletData) => sum + Number(w.balance), 0) || 0
                  )}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <WalletIcon className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Button onClick={() => setModal('fund')} className="h-20 flex flex-col gap-1 bg-green-600 hover:bg-green-700">
          <Download className="h-5 w-5" />
          <span>Fund Wallet</span>
        </Button>
        <Button onClick={() => setModal('withdraw')} variant="outline" className="h-20 flex flex-col gap-1">
          <Send className="h-5 w-5" />
          <span>Withdraw</span>
        </Button>
        <Button onClick={() => setModal('transfer')} variant="outline" className="h-20 flex flex-col gap-1">
          <Send className="h-5 w-5 rotate-180" />
          <span>Transfer</span>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            {walletsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {wallets?.map((wallet: WalletData) => (
                  <div key={wallet.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold ${
                        wallet.currency === 'NGN' ? 'bg-emerald-100 text-emerald-700' :
                        wallet.currency === 'BTC' ? 'bg-orange-100 text-orange-700' :
                        wallet.currency === 'ETH' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {wallet.currency}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{wallet.currency} Wallet</p>
                        <p className="text-sm text-slate-500">{wallet.isCrypto ? 'Crypto' : 'Fiat'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-slate-900">
                        {wallet.isCrypto 
                          ? formatCrypto(Number(wallet.balance), wallet.currency)
                          : formatCurrency(Number(wallet.balance))
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : transactionsData?.transactions?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No transactions yet
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {transactionsData?.transactions?.map((tx: TransactionData) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900 capitalize">
                        {tx.type} {tx.subtype && `(${tx.subtype})`}
                      </p>
                      <p className="text-xs text-slate-500">{timeAgo(new Date(tx.createdAt))}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        tx.type === 'deposit' ? 'text-green-600' : 'text-slate-900'
                      }`}>
                        {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                      </p>
                      <p className="text-xs text-slate-500">{tx.reference}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="capitalize">{modal} {modal === 'fund' ? 'Wallet' : modal === 'withdraw' ? 'Funds' : 'to User'}</CardTitle>
              <CardDescription>
                {modal === 'fund' && 'Add funds to your wallet (Demo)'}
                {modal === 'withdraw' && 'Withdraw funds from your wallet'}
                {modal === 'transfer' && 'Transfer funds to another user'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {modal === 'transfer' && (
                  <div className="space-y-2">
                    <Label htmlFor="toEmail">Recipient Email</Label>
                    <Input
                      id="toEmail"
                      type="email"
                      placeholder="recipient@example.com"
                      value={formData.toEmail}
                      onChange={(e) => setFormData({ ...formData, toEmail: e.target.value })}
                      required
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    {wallets?.map((w: WalletData) => (
                      <option key={w.id} value={w.currency}>{w.currency}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={mutation.isPending}>
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
