'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Wallet, ArrowLeftRight, Phone, Gift, TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatCrypto, timeAgo } from '@/lib/utils';

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
  status: string;
  reference: string;
  description: string | null;
  createdAt: string;
}

interface ExchangeRates {
  BTC_NGN: number;
  ETH_NGN: number;
  USDT_NGN: number;
}

async function fetchWallets(): Promise<WalletData[]> {
  const res = await fetch('/api/wallet');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function fetchTransactions(): Promise<{ transactions: TransactionData[] }> {
  const res = await fetch('/api/transactions?limit=5');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function fetchRates(): Promise<ExchangeRates> {
  const res = await fetch('/api/crypto');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: fetchWallets,
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });

  const { data: rates } = useQuery({
    queryKey: ['rates'],
    queryFn: fetchRates,
  });

  const ngnWallet = wallets?.find((w: WalletData) => w.currency === 'NGN');
  const cryptoWallets = wallets?.filter((w: WalletData) => w.isCrypto) || [];

  const totalCryptoValue = cryptoWallets.reduce((sum: number, w: WalletData) => {
    const rate = w.currency === 'BTC' ? (rates?.BTC_NGN ?? 0) : w.currency === 'ETH' ? (rates?.ETH_NGN ?? 0) : (rates?.USDT_NGN ?? 1);
    const balance = typeof w.balance === 'string' ? parseFloat(w.balance) : w.balance;
    return sum + (balance * rate);
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-slate-500">Here&apos;s an overview of your account</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">NGN Balance</p>
                <p className="text-2xl font-bold mt-1">
                  {walletsLoading ? '...' : formatCurrency(Number(ngnWallet?.balance || 0))}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Crypto Value</p>
                <p className="text-2xl font-bold mt-1 text-slate-900">
                  {walletsLoading ? '...' : formatCurrency(totalCryptoValue)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-slate-500 text-sm font-medium">BTC Rate</p>
              <p className="text-2xl font-bold mt-1 text-slate-900">
                {rates ? formatCurrency(rates.BTC_NGN) : '...'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-slate-500 text-sm font-medium">ETH Rate</p>
              <p className="text-2xl font-bold mt-1 text-slate-900">
                {rates ? formatCurrency(rates.ETH_NGN) : '...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/crypto">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
                  <ArrowLeftRight className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm">Trade Crypto</span>
                </Button>
              </Link>
              <Link href="/dashboard/bills">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Pay Bills</span>
                </Button>
              </Link>
              <Link href="/dashboard/giftcards">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
                  <Gift className="h-5 w-5 text-purple-600" />
                  <span className="text-sm">Gift Cards</span>
                </Button>
              </Link>
              <Link href="/dashboard/wallet">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
                  <Wallet className="h-5 w-5 text-amber-600" />
                  <span className="text-sm">Fund Wallet</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Crypto Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            {walletsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {cryptoWallets.map((wallet: WalletData) => (
                  <div key={wallet.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        wallet.currency === 'BTC' ? 'bg-orange-100' :
                        wallet.currency === 'ETH' ? 'bg-indigo-100' : 'bg-green-100'
                      }`}>
                        <span className={`font-bold text-sm ${
                          wallet.currency === 'BTC' ? 'text-orange-600' :
                          wallet.currency === 'ETH' ? 'text-indigo-600' : 'text-green-600'
                        }`}>
                          {wallet.currency}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{wallet.currency}</p>
                        <p className="text-sm text-slate-500">
                          {formatCrypto(Number(wallet.balance), wallet.currency)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">
                        {formatCurrency(
                          Number(wallet.balance) * (
                            wallet.currency === 'BTC' ? (rates?.BTC_NGN || 0) :
                            wallet.currency === 'ETH' ? (rates?.ETH_NGN || 0) :
                            (rates?.USDT_NGN || 0)
                          )
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
          <Link href="/dashboard/wallet">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : transactionsData?.transactions?.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-2">
              {transactionsData?.transactions?.map((tx: TransactionData) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      tx.type === 'deposit' || tx.type === 'trade' ? 'bg-green-100' :
                      tx.type === 'withdrawal' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {tx.type === 'deposit' || (tx.type === 'trade' && tx.subtype === 'buy') ? (
                        <ArrowDownLeft className={`h-5 w-5 ${
                          tx.type === 'deposit' ? 'text-green-600' : 'text-green-600'
                        }`} />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 capitalize">
                        {tx.type} {tx.subtype && `(${tx.subtype})`}
                      </p>
                      <p className="text-sm text-slate-500">{timeAgo(new Date(tx.createdAt))}</p>
                    </div>
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
  );
}
