'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Smartphone, Wifi, Zap, Tv, Gamepad2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/toast';

interface BillService {
  id: string;
  name: string;
  category: string;
  icon: string;
  products: BillProduct[];
}

interface BillProduct {
  id: string;
  serviceId: string;
  name: string;
  code: string;
  amount: number;
}

async function fetchServices(): Promise<BillService[]> {
  const res = await fetch('/api/bills');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function fetchProducts(serviceId: string): Promise<BillProduct[]> {
  const res = await fetch(`/api/bills?serviceId=${serviceId}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function payBill(body: { serviceId: string; productId: string; customerId: string }) {
  const res = await fetch('/api/bills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

const ICONS: Record<string, React.ReactNode> = {
  smartphone: <Smartphone className="h-6 w-6" />,
  wifi: <Wifi className="h-6 w-6" />,
  zap: <Zap className="h-6 w-6" />,
  tv: <Tv className="h-6 w-6" />,
  'gamepad-2': <Gamepad2 className="h-6 w-6" />,
};

const COLORS: Record<string, string> = {
  airtime: 'bg-blue-100 text-blue-600',
  data: 'bg-green-100 text-green-600',
  electricity: 'bg-amber-100 text-amber-600',
  cable: 'bg-purple-100 text-purple-600',
  betting: 'bg-red-100 text-red-600',
};

export default function BillsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<BillService | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<BillProduct | null>(null);
  const [customerId, setCustomerId] = useState('');

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
  });

  const mutation = useMutation({
    mutationFn: () => payBill({
      serviceId: selectedService!.id,
      productId: selectedProduct!.id,
      customerId,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: 'Payment Successful',
        description: `Reference: ${data.reference}`,
        variant: 'success',
      });
      setSelectedProduct(null);
      setCustomerId('');
    },
    onError: (error: Error) => {
      toast({ title: 'Payment Failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleServiceSelect = (service: BillService) => {
    setSelectedService(service);
    setSelectedProduct(null);
    setCustomerId('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bill Payments</h1>
        <p className="text-slate-500">Pay your bills instantly</p>
      </div>

      {selectedProduct ? (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Confirm Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Service</span>
                <span className="font-medium">{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-bold text-lg text-emerald-600">
                  {selectedProduct.amount > 0 ? formatCurrency(selectedProduct.amount) : 'Varies'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerId">
                {selectedService?.id === 'airtime' || selectedService?.id === 'data'
                  ? 'Phone Number'
                  : selectedService?.id === 'electricity'
                  ? 'Meter Number'
                  : selectedService?.id === 'cable'
                  ? 'Smartcard Number'
                  : 'Customer ID'}
              </Label>
              <Input
                id="customerId"
                placeholder={
                  selectedService?.id === 'airtime' || selectedService?.id === 'data'
                    ? '0803...'
                    : selectedService?.id === 'electricity'
                    ? 'Meter number'
                    : selectedService?.id === 'cable'
                    ? 'Smartcard number'
                    : 'Customer ID'
                }
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedProduct(null)}>
                Back
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => mutation.mutate()}
                disabled={!customerId || mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : selectedService ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setSelectedService(null)}>
            ← Back to Services
          </Button>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {selectedService.products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all"
                onClick={() => setSelectedProduct(product)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-500">{product.code}</p>
                    </div>
                    <p className="font-bold text-emerald-600">
                      {product.amount > 0 ? formatCurrency(product.amount) : 'Varies'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 animate-pulse" />
                </CardContent>
              </Card>
            ))
          ) : (
            services?.map((service: BillService) => (
              <Card
                key={service.id}
                className="cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all"
                onClick={() => handleServiceSelect(service)}
              >
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-xl ${COLORS[service.category]} flex items-center justify-center mb-4`}>
                    {ICONS[service.icon] || <Smartphone className="h-6 w-6" />}
                  </div>
                  <h3 className="font-semibold text-slate-900">{service.name}</h3>
                  <p className="text-sm text-slate-500">{service.products.length} options</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
