import { Decimal } from '@prisma/client/runtime/library';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  status: 'active' | 'suspended' | 'deleted';
  role: 'user' | 'admin' | 'super_admin';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  balance: Decimal | string;
  isCrypto: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'trade' | 'bill' | 'giftcard';
  subtype: string | null;
  currency: string | null;
  amount: Decimal | string;
  fee: Decimal | string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  reference: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExchangeRates {
  BTC_NGN: number;
  ETH_NGN: number;
  USDT_NGN: number;
}

export interface BillService {
  id: string;
  name: string;
  category: string;
  icon: string;
  products: BillProduct[];
}

export interface BillProduct {
  id: string;
  serviceId: string;
  name: string;
  code: string;
  amount: number;
}

export interface GiftCardCategory {
  id: string;
  name: string;
  icon: string;
  products: GiftCardProduct[];
}

export interface GiftCardProduct {
  id: string;
  categoryId: string;
  name: string;
  brand: string;
  minAmount: number;
  maxAmount: number;
  image: string;
  reloadlyId?: number;
}

export interface SystemSettings {
  mode: 'demo' | 'live';
  apiKeys: {
    crypto?: string;
    bills?: string;
    giftcards?: string;
  };
  exchangeRates: ExchangeRates;
  fees: {
    cryptoBuy: number;
    cryptoSell: number;
    transfer: number;
    bill: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type Currency = 'NGN' | 'BTC' | 'ETH' | 'USDT';

export const CRYPTO_CURRENCIES = ['BTC', 'ETH', 'USDT'] as const;
export const FIAT_CURRENCIES = ['NGN'] as const;
export const ALL_CURRENCIES = [...FIAT_CURRENCIES, ...CRYPTO_CURRENCIES] as const;
