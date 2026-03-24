'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Gamepad2, ShoppingBag, Play, Gamepad, Gift, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface GiftCardCategory {
  id: string;
  name: string;
  icon: string;
  products: GiftCardProduct[];
}

interface GiftCardProduct {
  id: string;
  categoryId: string;
  name: string;
  brand: string;
  minAmount: number;
  maxAmount: number;
  image: string;
}

async function fetchCategories(): Promise<GiftCardCategory[]> {
  const res = await fetch('/api/giftcards');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function buyGiftCard(body: { productId: string; amount: number }) {
  const res = await fetch('/api/giftcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

const ICONS: Record<string, React.ReactNode> = {
  'gamepad-2': <Gamepad2 className="h-6 w-6" />,
  'shopping-bag': <ShoppingBag className="h-6 w-6" />,
  play: <Play className="h-6 w-6" />,
  gamepad: <Gamepad className="h-6 w-6" />,
  gift: <Gift className="h-6 w-6" />,
};

const COLORS: Record<string, string> = {
  entertainment: 'bg-orange-100 text-orange-600',
  shopping: 'bg-blue-100 text-blue-600',
  streaming: 'bg-red-100 text-red-600',
  gaming: 'bg-purple-100 text-purple-600',
};

const AMOUNTS = [10, 25, 50, 100];

export default function GiftCardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<GiftCardCategory | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<GiftCardProduct | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['giftcards'],
    queryFn: fetchCategories,
  });

  const mutation = useMutation({
    mutationFn: () => buyGiftCard({
      productId: selectedProduct!.id,
      amount: selectedAmount || parseFloat(customAmount),
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: 'Purchase Successful',
        description: `Your gift card code: ${data.metadata?.cardCode}`,
        variant: 'success',
      });
      setSelectedProduct(null);
      setSelectedAmount(null);
      setCustomAmount('');
    },
    onError: (error: Error) => {
      toast({ title: 'Purchase Failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleCategorySelect = (category: GiftCardCategory) => {
    setSelectedCategory(category);
    setSelectedProduct(null);
    setSelectedAmount(null);
  };

  const amount = selectedAmount || parseFloat(customAmount) || 0;
  const isValidAmount = selectedProduct && amount >= selectedProduct.minAmount && amount <= selectedProduct.maxAmount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gift Cards</h1>
        <p className="text-slate-500">Buy gift cards from top brands</p>
      </div>

      {selectedProduct ? (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Purchase {selectedProduct.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-sm text-slate-500 mb-1">Brand</p>
              <p className="font-semibold text-slate-900">{selectedProduct.brand}</p>
            </div>

            <div className="space-y-2">
              <Label>Select Amount (USD)</Label>
              <div className="grid grid-cols-4 gap-2">
                {AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    variant={selectedAmount === amt ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount('');
                    }}
                    className={selectedAmount === amt ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  >
                    ${amt}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <Input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-slate-500">
                Min: ${selectedProduct.minAmount} - Max: ${selectedProduct.maxAmount}
              </p>
            </div>

            {isValidAmount && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600">Amount</span>
                  <span className="font-medium">${amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600">Fee (2%)</span>
                  <span className="font-medium">${(amount * 0.02).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-emerald-600">${(amount * 1.02).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => {
                setSelectedProduct(null);
                setSelectedAmount(null);
                setCustomAmount('');
              }}>
                Back
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => mutation.mutate()}
                disabled={!isValidAmount || mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Purchase'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : selectedCategory ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setSelectedCategory(null)}>
            ← Back to Categories
          </Button>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {selectedCategory.products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all"
                onClick={() => setSelectedProduct(product)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-xl ${COLORS[selectedCategory.id] || 'bg-slate-100'} flex items-center justify-center`}>
                      {ICONS[selectedCategory.icon] || <Gift className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-500">{product.brand}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 animate-pulse" />
                </CardContent>
              </Card>
            ))
          ) : (
            categories?.map((category: GiftCardCategory) => (
              <Card
                key={category.id}
                className="cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all"
                onClick={() => handleCategorySelect(category)}
              >
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-xl ${COLORS[category.id] || 'bg-slate-100'} flex items-center justify-center mb-4`}>
                    {ICONS[category.icon] || <Gift className="h-6 w-6" />}
                  </div>
                  <h3 className="font-semibold text-slate-900">{category.name}</h3>
                  <p className="text-sm text-slate-500">{category.products.length} cards</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
