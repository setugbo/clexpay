'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowLeftRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatCrypto } from '@/lib/utils';
import { useToast } from '@/hooks/toast';

interface WalletData {
  id: string;
  currency: string;
  balance: string;
  isCrypto: boolean;
}

interface ExchangeRates {
  BTC_NGN: number;
  ETH_NGN: number;
  USDT_NGN: number;
}

async function fetchRates(): Promise<ExchangeRates> {
  const res = await fetch('/api/crypto');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function fetchWallets(): Promise<WalletData[]> {
  const res = await fetch('/api/wallet');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function cryptoAction(action: string, body: Record<string, unknown>) {
  const res = await fetch('/api/crypto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

const CRYPTO_OPTIONS = ['BTC', 'ETH', 'USDT'];

export default function CryptoPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'buy' | 'sell' | 'swap'>('buy');
  const [fromCurrency, setFromCurrency] = useState('NGN');
  const [toCurrency, setToCurrency] = useState('BTC');
  const [amount, setAmount] = useState('');

  const { data: rates, isLoading: ratesLoading } = useQuery({
    queryKey: ['rates'],
    queryFn: fetchRates,
  });

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: fetchWallets,
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (tab === 'swap') {
        return cryptoAction('swap', { fromCurrency, toCurrency, amount: parseFloat(amount) });
      }
      return cryptoAction(tab, { fromCurrency, toCurrency, amount: parseFloat(amount) });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: 'Success',
        description: `${tab === 'buy' ? 'Purchase' : tab === 'sell' ? 'Sale' : 'Swap'} successful! Reference: ${data.reference}`,
        variant: 'success',
      });
      setAmount('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getRate = () => {
    if (!rates) return 0;
    if (tab === 'swap') {
      return rates[`${toCurrency}_${fromCurrency}` as keyof ExchangeRates] || 0;
    }
    if (tab === 'buy') {
      return rates[`${toCurrency}_${fromCurrency}` as keyof ExchangeRates] || 0;
    }
    return rates[`${fromCurrency}_${toCurrency}` as keyof ExchangeRates] || 0;
  };

  const getOutputAmount = () => {
    const rate = getRate();
    const inputAmount = parseFloat(amount) || 0;
    if (tab === 'swap') {
      return inputAmount * rate;
    }
    if (tab === 'buy') {
      return inputAmount / rate;
    }
    return inputAmount * rate;
  };

  const getFromWalletBalance = () => {
    const wallet = wallets?.find((w: WalletData) => w.currency === fromCurrency);
    return wallet ? Number(wallet.balance) : 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Crypto Trading</h1>
        <p className="text-slate-500">Buy, sell, and swap cryptocurrencies</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex gap-2">
                {(['buy', 'sell', 'swap'] as const).map((t) => (
                  <Button
                    key={t}
                    variant={tab === t ? 'default' : 'outline'}
                    onClick={() => setTab(t)}
                    className={tab === t ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  >
                    {t === 'buy' && <TrendingUp className="h-4 w-4 mr-1" />}
                    {t === 'sell' && <TrendingDown className="h-4 w-4 mr-1" />}
                    {t === 'swap' && <ArrowLeftRight className="h-4 w-4 mr-1" />}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>From</Label>
                      <span className="text-sm text-slate-500">
                        Balance: {fromCurrency === 'NGN' 
                          ? formatCurrency(getFromWalletBalance())
                          : formatCrypto(getFromWalletBalance(), fromCurrency)
                        }
                      </span>
                    </div>
                    <select
                      className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-lg font-semibold"
                      value={fromCurrency}
                      onChange={(e) => {
                        setFromCurrency(e.target.value);
                        if (e.target.value !== 'NGN' && e.target.value === toCurrency) {
                          setToCurrency('NGN');
                        }
                      }}
                    >
                      <option value="NGN">NGN - Nigerian Naira</option>
                      {CRYPTO_OPTIONS.filter(c => c !== toCurrency).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-xl h-14"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>To</Label>
                    <select
                      className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-lg font-semibold"
                      value={toCurrency}
                      onChange={(e) => {
                        setToCurrency(e.target.value);
                        if (e.target.value === 'NGN' && fromCurrency === 'NGN') {
                          setFromCurrency('BTC');
                        }
                      }}
                    >
                      {fromCurrency === 'NGN' && (
                        <>
                          {CRYPTO_OPTIONS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </>
                      )}
                      {fromCurrency !== 'NGN' && (
                        <option value="NGN">NGN - Nigerian Naira</option>
                      )}
                    </select>
                    <div className="h-14 rounded-xl border bg-slate-50 px-4 py-3 flex items-center">
                      <span className="text-xl font-semibold text-slate-700">
                        {amount ? getOutputAmount().toFixed(8) : '0.00000000'} {toCurrency}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Rate</span>
                    <span className="font-medium">
                      1 {toCurrency} = {formatCurrency(getRate())} {fromCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Fee ({tab === 'swap' ? '0.3%' : '0.5%'})</span>
                    <span className="font-medium">
                      {formatCurrency(
                        tab === 'swap' 
                          ? (parseFloat(amount) || 0) * 0.003 
                          : (parseFloat(amount) || 0) * 0.005
                      )} {fromCurrency}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => mutation.mutate()}
                  disabled={!amount || parseFloat(amount) <= 0 || mutation.isPending}
                  className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `${tab === 'buy' ? 'Buy' : tab === 'sell' ? 'Sell' : 'Swap'} ${toCurrency}`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exchange Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ratesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-orange-50">
                    <span className="font-semibold text-orange-700">BTC</span>
                    <span className="font-bold text-orange-700">{formatCurrency(rates?.BTC_NGN || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-indigo-50">
                    <span className="font-semibold text-indigo-700">ETH</span>
                    <span className="font-bold text-indigo-700">{formatCurrency(rates?.ETH_NGN || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-green-50">
                    <span className="font-semibold text-green-700">USDT</span>
                    <span className="font-bold text-green-700">{formatCurrency(rates?.USDT_NGN || 0)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Crypto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {wallets?.filter((w: WalletData) => w.isCrypto).map((wallet: WalletData) => (
                <div key={wallet.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                  <span className="font-semibold">{wallet.currency}</span>
                  <span className="font-bold">{formatCrypto(Number(wallet.balance), wallet.currency)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
