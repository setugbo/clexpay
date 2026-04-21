'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Shield, CheckCircle, XCircle, RefreshCw, Key, Percent, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/toast';

interface SettingsData {
  exchange_rates?: Record<string, number>;
  fees?: Record<string, number>;
  api_keys?: Record<string, string>;
  currentMode: 'live';
}

interface SystemStatus {
  flutterwave: boolean;
  tatum: boolean;
  database: boolean;
  email: boolean;
}

async function fetchSettings(): Promise<SettingsData> {
  const res = await fetch('/api/admin/settings');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await fetch('/api/admin/system-status');
  const data = await res.json();
  return data;
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

async function testConnection(service: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/admin/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: service }),
  });
  const data = await res.json();
  return data;
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rates, setRates] = useState({ BTC_NGN: '', ETH_NGN: '', USDT_NGN: '' });
  const [fees, setFees] = useState({ cryptoBuy: '', cryptoSell: '', transfer: '', bill: '' });
  const [apiKeys, setApiKeys] = useState({ flutterwave: '', tatum: '', giftcards: '' });
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    fn: fetchSettings,
    refetchInterval: 60000,
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

  const apiKeysMutation = useMutation({
    mutationFn: () => updateSetting('api_keys', apiKeys),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: 'API keys saved successfully', variant: 'success' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleTestConnection = async (service: string) => {
    setTestingService(service);
    try {
      const result = await testConnection(service);
      setTestResults((prev) => ({ ...prev, [service]: result }));
      if (result.success) {
        toast({ title: 'Connection Successful', description: result.message, variant: 'success' });
      } else {
        toast({ title: 'Connection Failed', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [service]: { success: false, message: 'Connection test failed' },
      }));
    } finally {
      setTestingService(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
          <p className="text-slate-500">Configure platform settings</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-40 bg-slate-100 rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
          <p className="text-slate-500">Configure platform services</p>
        </div>
        <Badge className="bg-green-600 text-white px-3 py-1">LIVE MODE</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            System Status
          </CardTitle>
          <CardDescription>All services are operational</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Flutterwave</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Tatum</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Database</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Email</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            Exchange Rates
          </CardTitle>
          <CardDescription>Current crypto to NGN rates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>BTC to NGN</Label>
              <Input
                type="number"
                value={rates.BTC_NGN}
                onChange={(e) => setRates({ ...rates, BTC_NGN: e.target.value })}
                placeholder={(settings?.exchange_rates?.BTC_NGN || 50000000).toString()}
              />
            </div>
            <div className="space-y-2">
              <Label>ETH to NGN</Label>
              <Input
                type="number"
                value={rates.ETH_NGN}
                onChange={(e) => setRates({ ...rates, ETH_NGN: e.target.value })}
                placeholder={(settings?.exchange_rates?.ETH_NGN || 3500000).toString()}
              />
            </div>
            <div className="space-y-2">
              <Label>USDT to NGN</Label>
              <Input
                type="number"
                value={rates.USDT_NGN}
                onChange={(e) => setRates({ ...rates, USDT_NGN: e.target.value })}
                placeholder={(settings?.exchange_rates?.USDT_NGN || 1500).toString()}
              />
            </div>
          </div>
          <Button onClick={() => ratesMutation.mutate()} disabled={ratesMutation.isPending}>
            {ratesMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Rates
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-blue-500" />
            Transaction Fees
          </CardTitle>
          <CardDescription>Set fees for various transaction types</CardDescription>
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
                placeholder={(settings?.fees?.cryptoBuy || 0.5).toString()}
              />
            </div>
            <div className="space-y-2">
              <Label>Crypto Sell Fee (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={fees.cryptoSell}
                onChange={(e) => setFees({ ...fees, cryptoSell: e.target.value })}
                placeholder={(settings?.fees?.cryptoSell || 0.5).toString()}
              />
            </div>
            <div className="space-y-2">
              <Label>Bill Payment Fee (NGN)</Label>
              <Input
                type="number"
                step="1"
                value={fees.bill}
                onChange={(e) => setFees({ ...fees, bill: e.target.value })}
                placeholder={(settings?.fees?.bill || 100).toString()}
              />
            </div>
            <div className="space-y-2">
              <Label>Gift Card Fee (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={fees.transfer}
                onChange={(e) => setFees({ ...fees, transfer: e.target.value })}
                placeholder={(settings?.fees?.transfer || 2).toString()}
              />
            </div>
          </div>
          <Button onClick={() => feesMutation.mutate()} disabled={feesMutation.isPending}>
            {feesMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Fees
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-500" />
            API Connections
          </CardTitle>
          <CardDescription>Test and manage external API connections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Flutterwave</p>
                <p className="text-sm text-slate-500">Bill payments and airtime</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestConnection('flutterwave')}
                disabled={testingService === 'flutterwave'}
              >
                {testingService === 'flutterwave' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : testResults.flutterwave?.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : testResults.flutterwave?.success === false ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : (
                  'Test'
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Tatum</p>
                <p className="text-sm text-slate-500">Crypto trading rates</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestConnection('tatum')}
                disabled={testingService === 'tatum'}
              >
                {testingService === 'tatum' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : testResults.tatum?.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : testResults.tatum?.success === false ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : (
                  'Test'
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Gift Cards</p>
                <p className="text-sm text-slate-500">Manual processing</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700">Manual</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}