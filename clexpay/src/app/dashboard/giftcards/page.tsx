'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Gamepad2, ShoppingBag, Play, Gamepad, Gift, CheckCircle, X, Clock, AlertTriangle, CreditCard, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/toast';

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

interface Transaction {
  id: string;
  reference: string;
  amount: number;
  status: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

const getMetaField = (meta: Record<string, unknown> | null, field: string, fallback = ''): string => {
  if (!meta) return fallback;
  const value = meta[field];
  return value !== undefined ? String(value) : fallback;
};

async function fetchCategories(): Promise<{ categories: GiftCardCategory[]; orders?: Transaction[] }> {
  const res = await fetch('/api/giftcards');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function calculatePrice(productId: string, amount: number) {
  const res = await fetch('/api/giftcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, amount, calculateOnly: true }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function buyGiftCard(productId: string, amount: number) {
  const res = await fetch('/api/giftcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, amount }),
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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  initiated: { label: 'Initiated', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', color: 'bg-yellow-100 text-yellow-700' },
  auto_attempt: { label: 'Auto Processing', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  manual_queue: { label: 'Manual Queue', color: 'bg-purple-100 text-purple-700' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'Refunded', color: 'bg-red-100 text-red-700' },
  flagged: { label: 'Flagged', color: 'bg-red-100 text-red-700' },
};

type View = 'categories' | 'products' | 'purchase' | 'orders';

export default function GiftCardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>('categories');
  const [selectedCategory, setSelectedCategory] = useState<GiftCardCategory | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<GiftCardProduct | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [priceQuote, setPriceQuote] = useState<any>(null);

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['giftcards'],
    queryFn: fetchCategories,
  });

  const categories = categoriesData?.categories || [];
  const orders = categoriesData?.orders || [];

  const calculateMutation = useMutation({
    mutationFn: ({ productId, amount }: { productId: string; amount: number }) => 
      calculatePrice(productId, amount),
    onSuccess: (data) => setPriceQuote(data),
  });

  const purchaseMutation = useMutation({
    mutationFn: ({ productId, amount }: { productId: string; amount: number }) => 
      buyGiftCard(productId, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['giftcards'] });
      
      const order = data.order;
      const meta = order.metadata || {};
      
      toast({
        title: 'Order Placed!',
        description: meta.deliveryType === 'instant' 
          ? 'Processing your gift card...'
          : 'Your order will be delivered shortly.',
        variant: 'success',
      });
      
      setSelectedProduct(null);
      setSelectedAmount(null);
      setCustomAmount('');
      setPriceQuote(null);
      setView('orders');
    },
    onError: (error: Error) => {
      toast({
        title: 'Purchase Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAmountSelect = (amt: number) => {
    setSelectedAmount(amt);
    setCustomAmount('');
    if (selectedProduct) {
      calculateMutation.mutate({ productId: selectedProduct.id, amount: amt });
    }
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    const amount = parseFloat(value);
    if (selectedProduct && amount >= selectedProduct.minAmount) {
      calculateMutation.mutate({ productId: selectedProduct.id, amount });
    }
  };

  const handlePurchase = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    if (selectedProduct && amount) {
      purchaseMutation.mutate({ productId: selectedProduct.id, amount });
    }
  };

  const maskCode = (code: string) => {
    if (!code) return '------';
    return code.substring(0, 4) + '-****-****';
  };

  const amount = selectedAmount || parseFloat(customAmount) || 0;
  const isValidAmount = selectedProduct && amount >= selectedProduct.minAmount && amount <= selectedProduct.maxAmount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gift Cards</h1>
          <p className="text-slate-500">Buy gift cards from top brands</p>
        </div>
        <Button variant="outline" onClick={() => setView(view === 'orders' ? 'categories' : 'orders')}>
          <Package className="h-4 w-4 mr-2" />
          {view === 'orders' ? 'Buy' : 'My Orders'}
        </Button>
      </div>

      {view === 'orders' && (
        <Card>
          <CardHeader>
            <CardTitle>My Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : orders?.length === 0 ? (
              <p className="text-center text-slate-500 p-8">No orders yet. Buy your first gift card!</p>
            ) : (
              <div className="space-y-3">
                {orders?.map((order) => {
                  const meta = order.metadata;
                  const orderStatus = getMetaField(meta, 'orderStatus');
                  const status = STATUS_LABELS[orderStatus] || { label: order.status, color: 'bg-gray-100' };
                  
                  return (
                    <div key={order.id} className="p-4 rounded-xl border bg-white">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{getMetaField(meta, 'productName', 'Gift Card')}</p>
                          <p className="text-sm text-slate-500">{getMetaField(meta, 'brand')} - ${getMetaField(meta, 'usdAmount')}</p>
                          <p className="text-xs text-slate-400 mt-1">Ref: {order.reference}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      
                      {getMetaField(meta, 'cardCode') && (
                        <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                          <p className="text-xs text-emerald-600 mb-1">Gift Card Code</p>
                          <p className="font-mono font-bold text-emerald-700">{maskCode(getMetaField(meta, 'cardCode'))}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {view === 'purchase' && selectedProduct && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              {selectedProduct.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-sm text-slate-500">Brand</p>
              <p className="font-semibold">{selectedProduct.brand}</p>
            </div>

            <div className="space-y-2">
              <Label>Select Amount (USD)</Label>
              <div className="grid grid-cols-4 gap-2">
                {AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    variant={selectedAmount === amt ? 'default' : 'outline'}
                    onClick={() => handleAmountSelect(amt)}
                    disabled={amt < selectedProduct.minAmount || amt > selectedProduct.maxAmount}
                    className={selectedAmount === amt ? 'bg-emerald-600' : ''}
                  >
                    ${amt}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => handleCustomAmount(e.target.value)}
                className="pl-7"
              />
              <p className="text-xs text-slate-500">
                Min: ${selectedProduct.minAmount} - Max: ${selectedProduct.maxAmount}
              </p>
            </div>

            {calculateMutation.isPending && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600 mr-2" />
                <span className="text-sm text-slate-500">Calculating...</span>
              </div>
            )}

            {priceQuote && !calculateMutation.isPending && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount</span>
                  <span className="font-medium">₦{priceQuote.totalNgn?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Fee ({priceQuote.feePercent || 3}%)</span>
                  <span className="font-medium">${(priceQuote.fee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="text-emerald-600">₦{priceQuote.totalNgn?.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  {priceQuote.deliveryType === 'instant' ? (
                    <><CheckCircle className="h-4 w-4 text-green-600" /> <span className="text-green-700">Instant Delivery</span></>
                  ) : (
                    <><Clock className="h-4 w-4 text-yellow-600" /> <span className="text-yellow-700">Processing - will be delivered shortly</span></>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => {
                setView('products');
                setSelectedAmount(null);
                setCustomAmount('');
                setPriceQuote(null);
              }}>
                Back
              </Button>
              <Button
                className="flex-1 bg-emerald-600"
                onClick={handlePurchase}
                disabled={!isValidAmount || purchaseMutation.isPending || !priceQuote}
              >
                {purchaseMutation.isPending ? (
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
      )}

      {view === 'products' && selectedCategory && (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setView('categories')}>
            ← Back to Categories
          </Button>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {selectedCategory.products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:border-emerald-500"
                onClick={() => {
                  setSelectedProduct(product);
                  setView('purchase');
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-xl ${COLORS[selectedCategory.id]} flex items-center justify-center`}>
                      {ICONS[selectedCategory.icon] || <Gift className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-slate-500">${product.minAmount} - ${product.maxAmount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {view === 'categories' && (
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
                className="cursor-pointer hover:border-emerald-500"
                onClick={() => {
                  setSelectedCategory(category);
                  setView('products');
                }}
              >
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-xl ${COLORS[category.id]} flex items-center justify-center mb-4`}>
                    {ICONS[category.icon] || <Gift className="h-6 w-6" />}
                  </div>
                  <h3 className="font-semibold">{category.name}</h3>
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