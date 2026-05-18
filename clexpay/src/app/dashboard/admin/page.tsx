'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, CreditCard, ArrowLeftRight, Gift, Zap, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface StatsData {
  overview: {
    newUsers: number;
    totalTransactions: number;
    totalVolume: number;
    platformRevenue: number;
  };
  walletBalances: {
    totalHeld: number;
  };
  volumeByType: Record<string, { count: number; volume: number }>;
}

async function fetchStats(range = 'month'): Promise<StatsData> {
  const res = await fetch(`/api/admin/stats?range=${range}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

const STATS_CARDS = [
  { key: 'newUsers', label: 'New Users', icon: Users, color: 'bg-blue-100 text-blue-600' },
  { key: 'totalTransactions', label: 'Transactions', icon: Activity, color: 'bg-green-100 text-green-600' },
  { key: 'totalVolume', label: 'Volume', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600', isCurrency: true },
  { key: 'platformRevenue', label: 'Revenue', icon: TrendingUp, color: 'bg-purple-100 text-purple-600', isCurrency: true },
];

const QUICK_LINKS = [
  { name: 'Users', href: '/dashboard/admin/users', icon: Users, color: 'bg-blue-100 text-blue-600' },
  { name: 'Transactions', href: '/dashboard/admin/transactions', icon: CreditCard, color: 'bg-green-100 text-green-600' },
  { name: 'Gift Cards', href: '/dashboard/admin/giftcards', icon: Gift, color: 'bg-pink-100 text-pink-600' },
  { name: 'Settings', href: '/dashboard/admin/settings', icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
];

export default function AdminDashboardPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => fetchStats('month'),
    refetchInterval: 60000,
  });

  const stats = data?.overview as Record<string, number> || { newUsers: 0, totalTransactions: 0, totalVolume: 0, platformRevenue: 0 };
  const volume = data?.volumeByType as Record<string, { count: number; volume: number }> || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500">Platform overview and management</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STATS_CARDS.map((stat) => {
          const Icon = stat.icon;
          const statKey = stat.key as string;
          const statValue = stats[statKey] || 0;
          const value = stat.isCurrency 
            ? formatCurrency(Number(statValue))
            : String(statValue);
          
          return (
            <Card key={stat.key}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="hover:border-emerald-500 cursor-pointer transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl ${link.color} flex items-center justify-center`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{link.name}</p>
                      <p className="text-sm text-slate-500">Manage {link.name.toLowerCase()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Volume by Type</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(volume).map(([type, data]) => (
              <div key={type} className="p-4 rounded-xl bg-slate-50">
                <p className="text-sm text-slate-500 capitalize">{type}</p>
                <p className="text-xl font-bold">{formatCurrency(data.volume)}</p>
                <p className="text-sm text-slate-500">{data.count} transactions</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}