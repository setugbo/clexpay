'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Send, Download, Wallet as WalletIcon, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatCrypto, timeAgo } from '@/lib/utils';
import { useToast } from '@/hooks/toast';
import { useSearchParams, useRouter } from 'next/navigation';

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

interface BankData {
  code: string;
  name: string;
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

async function fetchBanks(): Promise<BankData[]> {
  const res = await fetch('/api/wallet/withdraw');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function fundWallet(amount: number): Promise<{ paymentUrl: string; reference: string }> {
  const res = await fetch('/api/wallet/fund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function withdrawFunds(body: { amount: number; bankCode: string; accountNumber: string; accountName: string }) {
  const res = await fetch('/api/wallet/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function transferFunds(body: { amount: number; currency: string; toEmail: string }) {
  const res = await fetch('/api/wallet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'transfer', ...body }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

type ModalType = 'fund' | 'withdraw' | 'transfer' | null;

function WalletContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [modal, setModal] = useState<ModalType>(null);
  const [formData, setFormData] = useState({
    amount: '',
    toEmail: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  });

  const funded = searchParams.get('funded');

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: fetchWallets,
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });

  const { data: banks } = useQuery({
    queryKey: ['banks'],
    queryFn: fetchBanks,
  });

  useEffect(() => {
    if (funded === 'true') {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: 'Success',
        description: 'Wallet funded successfully!',
        variant: 'success',
      });
      router.replace('/dashboard/wallet');
    }
  }, [funded]);

  const fundMutation = useMutation({
    mutationFn: () => fundWallet(parseFloat(formData.amount)),
    onSuccess: (data) => {
      toast({
        title: 'Redirecting to payment...',
        description: 'Complete payment to fund your wallet',
      });
      window.open(data.paymentUrl, '_blank');
      setModal(null);
      setFormData({ ...formData, amount: '' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawFunds({
      amount: parseFloat(formData.amount),
      bankCode: formData.bankCode,
      accountNumber: formData.accountNumber,
      accountName: formData.accountName,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: 'Success',
        description: `Withdrawal initiated. Ref: ${data.reference}`,
        variant: 'success',
      });
      setModal(null);
      setFormData({ amount: '', toEmail: '', bankCode: '', accountNumber: '', accountName: '' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const transferMutation = useMutation({
    mutationFn: () => transferFunds({
      amount: parseFloat(formData.amount),
      currency: 'NGN',
      toEmail: formData.toEmail,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: 'Success',
        description: 'Transfer successful!',
        variant: 'success',
      });
      setModal(null);
      setFormData({ amount: '', toEmail: '', bankCode: '', accountNumber: '', accountName: '' });
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
    if (modal === 'withdraw' && (!formData.bankCode || !formData.accountNumber)) {
      toast({ title: 'Error', description: 'Please enter bank details', variant: 'destructive' });
      return;
    }
    if (modal === 'fund') fundMutation.mutate();
    else if (modal === 'withdraw') withdrawMutation.mutate();
    else if (modal === 'transfer') transferMutation.mutate();
  };

  const totalBalance = wallets?.reduce((sum: number, w: WalletData) => {
    if (w.currency === 'NGN') return sum + Number(w.balance);
    return sum;
  }, 0) || 0;

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
                <p className="text-emerald-100 text-sm font-medium">NGN Balance</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(totalBalance)}
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
              <CardTitle className="capitalize">
                {modal === 'fund' ? 'Fund Wallet' : modal === 'withdraw' ? 'Withdraw Funds' : 'Transfer to User'}
              </CardTitle>
              <CardDescription>
                {modal === 'fund' && 'Fund via Flutterwave payment (Min: NGN 100)'}
                {modal === 'withdraw' && 'Withdraw to Nigerian bank account (Min: NGN 500)'}
                {modal === 'transfer' && 'Transfer to another Clexpay user'}
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

                {modal === 'withdraw' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="accountName">Account Name</Label>
                      <Input
                        id="accountName"
                        placeholder="Account holder name"
                        value={formData.accountName}
                        onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankCode">Bank</Label>
                      <select
                        id="bankCode"
                        className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                        value={formData.bankCode}
                        onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                        required
                      >
                        <option value="">Select Bank</option>
                        {banks?.map((bank: BankData) => (
                          <option key={bank.code} value={bank.code}>{bank.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        placeholder="1234567890"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Amount ({modal === 'fund' || modal === 'withdraw' ? 'NGN' : formData.amount ? 'NGN' : 'NGN'})
                  </Label>
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
                  <Button 
                    type="submit" 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700" 
                    disabled={fundMutation.isPending || withdrawMutation.isPending || transferMutation.isPending}
                  >
                    {fundMutation.isPending || withdrawMutation.isPending || transferMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      modal === 'fund' ? 'Proceed to Payment' : 'Confirm'
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

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <WalletContent />
    </Suspense>
  );
}