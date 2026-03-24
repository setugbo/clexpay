'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Zap, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface SettingsData {
  exchange_rates?: Record<string, number>;
  fees?: Record<string, number>;
  api_keys?: Record<string, string>;
  currentMode: 'demo' | 'live';
}

async function fetchSettings(): Promise<SettingsData> {
  const res = await fetch('/api/admin/settings');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function updateSetting(key: string, value: unknown) {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function switchMode(mode: string) {
  const res = await fetch('/api/admin/settings/mode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rates, setRates] = useState({ BTC_NGN: '', ETH_NGN: '', USDT_NGN: '' });
  const [fees, setFees] = useState({ cryptoBuy: '', cryptoSell: '', transfer: '', bill: '' });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: fetchSettings,
  });

  const ratesMutation = useMutation({
    mutationFn: () => updateSetting('exchange_rates', rates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: 'Rates updated successfully', variant: 'success' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const feesMutation = useMutation({
    mutationFn: () => updateSetting('fees', fees),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: 'Fees updated successfully', variant: 'success' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const modeMutation = useMutation({
    mutationFn: (mode: string) => switchMode(mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: 'Mode switched successfully', variant: 'success' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleRatesSave = () => {
    ratesMutation.mutate();
  };

  const handleFeesSave = () => {
    feesMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-500">Configure platform settings</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-40 bg-slate-100 rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                System Mode
              </CardTitle>
              <CardDescription>
                Switch between DEMO and LIVE modes. Demo mode uses simulated data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => modeMutation.mutate('demo')}
                  disabled={modeMutation.isPending || settings?.currentMode === 'demo'}
                  className={`flex-1 p-6 rounded-xl border-2 transition-all ${
                    settings?.currentMode === 'demo'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">Demo Mode</span>
                    {settings?.currentMode === 'demo' && (
                      <span className="px-2 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium">Active</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">Uses simulated data for testing</p>
                </button>
                <button
                  onClick={() => modeMutation.mutate('live')}
                  disabled={modeMutation.isPending || settings?.currentMode === 'live'}
                  className={`flex-1 p-6 rounded-xl border-2 transition-all ${
                    settings?.currentMode === 'live'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">Live Mode</span>
                    {settings?.currentMode === 'live' && (
                      <span className="px-2 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium">Active</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">Uses real API integrations</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exchange Rates</CardTitle>
              <CardDescription>Set crypto to NGN exchange rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>BTC to NGN</Label>
                  <Input
                    type="number"
                    value={rates.BTC_NGN}
                    onChange={(e) => setRates({ ...rates, BTC_NGN: e.target.value })}
                    placeholder={settings?.exchange_rates?.BTC_NGN?.toString() || '50000000'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ETH to NGN</Label>
                  <Input
                    type="number"
                    value={rates.ETH_NGN}
                    onChange={(e) => setRates({ ...rates, ETH_NGN: e.target.value })}
                    placeholder={settings?.exchange_rates?.ETH_NGN?.toString() || '3500000'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>USDT to NGN</Label>
                  <Input
                    type="number"
                    value={rates.USDT_NGN}
                    onChange={(e) => setRates({ ...rates, USDT_NGN: e.target.value })}
                    placeholder={settings?.exchange_rates?.USDT_NGN?.toString() || '1500'}
                  />
                </div>
              </div>
              <Button onClick={handleRatesSave} disabled={ratesMutation.isPending}>
                {ratesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Rates
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction Fees</CardTitle>
              <CardDescription>Set fees as percentage (%)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Crypto Buy Fee (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={fees.cryptoBuy}
                    onChange={(e) => setFees({ ...fees, cryptoBuy: e.target.value })}
                    placeholder={settings?.fees?.cryptoBuy?.toString() || '0.5'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Crypto Sell Fee (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={fees.cryptoSell}
                    onChange={(e) => setFees({ ...fees, cryptoSell: e.target.value })}
                    placeholder={settings?.fees?.cryptoSell?.toString() || '0.5'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transfer Fee (NGN)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={fees.transfer}
                    onChange={(e) => setFees({ ...fees, transfer: e.target.value })}
                    placeholder={settings?.fees?.transfer?.toString() || '0'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bill Payment Fee (NGN)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={fees.bill}
                    onChange={(e) => setFees({ ...fees, bill: e.target.value })}
                    placeholder={settings?.fees?.bill?.toString() || '100'}
                  />
                </div>
              </div>
              <Button onClick={handleFeesSave} disabled={feesMutation.isPending}>
                {feesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Fees
              </Button>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Shield className="h-5 w-5" />
                API Keys (Live Mode)
              </CardTitle>
              <CardDescription className="text-amber-700">
                Configure API keys for live service integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Crypto API Key</Label>
                  <Input type="password" placeholder="Enter API key" />
                </div>
                <div className="space-y-2">
                  <Label>Bills API Key</Label>
                  <Input type="password" placeholder="Enter API key" />
                </div>
                <div className="space-y-2">
                  <Label>Gift Card API Key</Label>
                  <Input type="password" placeholder="Enter API key" />
                </div>
              </div>
              <Button variant="outline" className="bg-white">
                Save API Keys
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
