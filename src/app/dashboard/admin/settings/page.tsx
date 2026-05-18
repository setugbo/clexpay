'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Shield, CheckCircle, XCircle, RefreshCw, Key, Percent, TrendingUp, AlertCircle, Trash2 } from 'lucide-react';
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
  currentMode: 'demo' | 'live';
}

interface SystemStatus {
  status: string;
  services: {
    paystack?: { status: string; message: string };
    vtpass?: { status: string; message: string };
    tatum?: { status: string; message: string };
    email?: { status: string; message: string };
    database?: { status: string; message: string };
  };
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
  return data.data || data;
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

async function resetDatabase(): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/reset', { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
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
  const [fees, setFees] = useState({ cryptoBuy: '', cryptoSell: '', swap: '', bill: '', transfer: '', giftcard: '' });
  const [apiKeys, setApiKeys] = useState({ PAYSTACK_SECRET_KEY: '', VTPASS_API_KEY: '', TATUM_API_KEY: '', RELOADLY_CLIENT_ID: '', RELOADLY_CLIENT_SECRET: '' });
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [resetting, setResetting] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: fetchSettings,
    refetchInterval: 60000,
  });

  const { data: systemStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['system-status'],
    queryFn: fetchSystemStatus,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (settings?.exchange_rates) {
      setRates({
        BTC_NGN: settings.exchange_rates.BTC_NGN?.toString() || '',
        ETH_NGN: settings.exchange_rates.ETH_NGN?.toString() || '',
        USDT_NGN: settings.exchange_rates.USDT_NGN?.toString() || '',
      });
    }
    if (settings?.fees) {
      setFees({
        cryptoBuy: settings.fees.cryptoBuy?.toString() || '',
        cryptoSell: settings.fees.cryptoSell?.toString() || '',
        swap: settings.fees.swap?.toString() || '',
        bill: settings.fees.bill?.toString() || '',
        transfer: settings.fees.transfer?.toString() || '',
        giftcard: settings.fees.giftcard?.toString() || '',
      });
    }
    if (settings?.api_keys) {
      setApiKeys(prev => ({ ...prev, ...settings.api_keys }));
    }
  }, [settings]);

  const ratesMutation = useMutation({
    mutationFn: () => updateSetting('exchange_rates', {
      BTC_NGN: parseFloat(rates.BTC_NGN) || 0,
      ETH_NGN: parseFloat(rates.ETH_NGN) || 0,
      USDT_NGN: parseFloat(rates.USDT_NGN) || 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: 'Rates updated successfully', variant: 'success' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const feesMutation = useMutation({
    mutationFn: () => updateSetting('fees', {
      cryptoBuy: parseFloat(fees.cryptoBuy) || 0,
      cryptoSell: parseFloat(fees.cryptoSell) || 0,
      swap: parseFloat(fees.swap) || 0,
      bill: parseFloat(fees.bill) || 0,
      transfer: parseFloat(fees.transfer) || 0,
      giftcard: parseFloat(fees.giftcard) || 0,
    }),
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
      refetchStatus();
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [service]: { success: false, message: 'Connection test failed' },
      }));
    } finally {
      setTestingService(null);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset the entire database? This will delete all users, transactions, and data except your account. Type "RESET" to confirm.')) return;
    const confirmation = window.prompt('Type RESET to confirm database reset:');
    if (confirmation !== 'RESET') return;
    setResetting(true);
    try {
      const result = await resetDatabase();
      toast({ title: 'Database Reset', description: result.message, variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    } catch (error) {
      toast({ title: 'Reset Failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    if (status === 'healthy') return <Badge className="bg-green-100 text-green-700">Operational</Badge>;
    if (status === 'degraded') return <Badge className="bg-yellow-100 text-yellow-700">Degraded</Badge>;
    return <Badge variant="destructive">Down</Badge>;
  };

  if (isLoading || statusLoading) {
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
        <Badge className={`px-3 py-1 ${settings?.currentMode === 'live' ? 'bg-emerald-600 text-white' : 'bg-yellow-600 text-white'}`}>
          {(settings?.currentMode || 'demo').toUpperCase()} MODE
        </Badge>
      </div>

      {/* System Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              <CardTitle>System Status</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchStatus()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Overall status: {systemStatus?.status === 'healthy' ? (
              <span className="text-green-600 font-medium">All systems operational</span>
            ) : systemStatus?.status === 'degraded' ? (
              <span className="text-yellow-600 font-medium">Some issues detected</span>
            ) : (
              <span className="text-red-600 font-medium">Critical issues</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { key: 'paystack', label: 'Paystack', icon: '💳' },
              { key: 'vtpass', label: 'VTPass', icon: '⚡' },
              { key: 'tatum', label: 'Tatum', icon: '₿' },
              { key: 'email', label: 'Email', icon: '✉' },
              { key: 'database', label: 'Database', icon: '🗄' },
            ].map(({ key, label, icon }) => {
              const service = systemStatus?.services?.[key as keyof typeof systemStatus.services];
              return (
                <div key={key} className="flex items-center gap-2 p-3 rounded-lg border">
                  <span className="text-lg">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{label}</p>
                    {getStatusBadge(service?.status)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rates Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            <CardTitle>Exchange Rates</CardTitle>
          </div>
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

      {/* Transaction Fees Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-blue-500" />
            <CardTitle>Transaction Fees</CardTitle>
          </div>
          <CardDescription>Set fees for various transaction types</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <Label>Crypto Swap Fee (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={fees.swap}
                onChange={(e) => setFees({ ...fees, swap: e.target.value })}
                placeholder={(settings?.fees?.swap || 0.3).toString()}
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
              <Label>Transfer Fee (NGN)</Label>
              <Input
                type="number"
                step="1"
                value={fees.transfer}
                onChange={(e) => setFees({ ...fees, transfer: e.target.value })}
                placeholder={(settings?.fees?.transfer || 10).toString()}
              />
            </div>
            <div className="space-y-2">
              <Label>Gift Card Fee (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={fees.giftcard}
                onChange={(e) => setFees({ ...fees, giftcard: e.target.value })}
                placeholder={(settings?.fees?.giftcard || 3).toString()}
              />
            </div>
          </div>
          <Button onClick={() => feesMutation.mutate()} disabled={feesMutation.isPending}>
            {feesMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Fees
          </Button>
        </CardContent>
      </Card>

      {/* API Keys Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-500" />
            <CardTitle>API Keys</CardTitle>
          </div>
          <CardDescription>Manage external API credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Paystack Secret Key</Label>
              <Input
                type="password"
                value={apiKeys.PAYSTACK_SECRET_KEY}
                onChange={(e) => setApiKeys({ ...apiKeys, PAYSTACK_SECRET_KEY: e.target.value })}
                placeholder="psk_..."
              />
            </div>
            <div className="space-y-2">
              <Label>VTPass API Key</Label>
              <Input
                type="password"
                value={apiKeys.VTPASS_API_KEY}
                onChange={(e) => setApiKeys({ ...apiKeys, VTPASS_API_KEY: e.target.value })}
                placeholder="Bearer token..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tatum API Key</Label>
              <Input
                type="password"
                value={apiKeys.TATUM_API_KEY}
                onChange={(e) => setApiKeys({ ...apiKeys, TATUM_API_KEY: e.target.value })}
                placeholder="tatum-api-key..."
              />
            </div>
            <div className="space-y-2">
              <Label>Reloadly Client ID</Label>
              <Input
                type="text"
                value={apiKeys.RELOADLY_CLIENT_ID}
                onChange={(e) => setApiKeys({ ...apiKeys, RELOADLY_CLIENT_ID: e.target.value })}
                placeholder="Reloadly client ID..."
              />
            </div>
            <div className="space-y-2">
              <Label>Reloadly Client Secret</Label>
              <Input
                type="password"
                value={apiKeys.RELOADLY_CLIENT_SECRET}
                onChange={(e) => setApiKeys({ ...apiKeys, RELOADLY_CLIENT_SECRET: e.target.value })}
                placeholder="Reloadly client secret..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => apiKeysMutation.mutate()} disabled={apiKeysMutation.isPending}>
              {apiKeysMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save API Keys
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTestConnection('paystack')}
              disabled={testingService === 'paystack'}
            >
              {testingService === 'paystack' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : testResults.paystack?.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : testResults.paystack?.success === false ? (
                <XCircle className="h-4 w-4 text-red-600" />
              ) : (
                'Test Paystack'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTestConnection('vtpass')}
              disabled={testingService === 'vtpass'}
            >
              {testingService === 'vtpass' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : testResults.vtpass?.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : testResults.vtpass?.success === false ? (
                <XCircle className="h-4 w-4 text-red-600" />
              ) : (
                'Test VTPass'
              )}
            </Button>
            <Button
              variant="outline"
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
                'Test Tatum'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </div>
          <CardDescription className="text-red-500">
            Irreversible actions — use with caution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <p className="font-medium text-red-800">Reset Database</p>
              <p className="text-sm text-red-600">Delete all data and re-seed with default admin and demo accounts</p>
            </div>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={resetting}
              className="shrink-0"
            >
              {resetting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Reset Database
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
