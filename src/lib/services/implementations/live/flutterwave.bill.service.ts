import crypto from 'crypto';
import { BillService, BillProduct, Transaction } from '@/types';
import { generateReference } from '@/lib/utils';
import { getFees } from '../../factory';

const FLUTTERWAVE_BASE_URL = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';
const FLUTTERWAVE_CLIENT_ID = process.env.FLUTTERWAVE_CLIENT_ID;
const FLUTTERWAVE_CLIENT_SECRET = process.env.FLUTTERWAVE_CLIENT_SECRET;
const FLUTTERWAVE_ENCRYPTION_KEY = process.env.FLUTTERWAVE_ENCRYPTION_KEY;

async function getAuthToken(): Promise<string> {
  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/v3/releases/ng/bills`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  return data.data?.token || '';
}

function encryptData(data: Record<string, unknown>): string {
  if (!FLUTTERWAVE_ENCRYPTION_KEY) throw new Error('Flutterwave encryption key not configured');
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(FLUTTERWAVE_ENCRYPTION_KEY, 'base64'),
    Buffer.alloc(16, 0)
  );
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

async function flutterwaveRequest(endpoint: string, body?: Record<string, unknown>): Promise<unknown> {
  const token = await getAuthToken();
  
  const response = await fetch(`${FLUTTERWAVE_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  
  if (data.status !== 'success') {
    throw new Error(data.message || 'Flutterwave API error');
  }
  
  return data.data;
}

const BILL_SERVICES: BillService[] = [
  {
    id: 'airtime',
    name: 'Airtime',
    category: 'airtime',
    icon: 'smartphone',
    products: [
      { id: 'mtn-airtime', serviceId: 'airtime', name: 'MTN', code: 'MTN', amount: 0 },
      { id: 'airtel-airtime', serviceId: 'airtime', name: 'Airtel', code: 'AIRTEL', amount: 0 },
      { id: 'glo-airtime', serviceId: 'airtime', name: 'Glo', code: 'GLO', amount: 0 },
      { id: '9mobile-airtime', serviceId: 'airtime', name: '9mobile', code: 'ETISALAT', amount: 0 },
    ],
  },
  {
    id: 'data',
    name: 'Data',
    category: 'data',
    icon: 'wifi',
    products: [
      { id: 'mtn-data-1gb', serviceId: 'data', name: 'MTN 1GB', code: 'MTN', amount: 350 },
      { id: 'mtn-data-2gb', serviceId: 'data', name: 'MTN 2GB', code: 'MTN', amount: 700 },
      { id: 'mtn-data-5gb', serviceId: 'data', name: 'MTN 5GB', code: 'MTN', amount: 1500 },
      { id: 'airtel-data-1gb', serviceId: 'data', name: 'Airtel 1GB', code: 'AIRTEL', amount: 350 },
      { id: 'airtel-data-2gb', serviceId: 'data', name: 'Airtel 2GB', code: 'AIRTEL', amount: 700 },
      { id: 'glo-data-1gb', serviceId: 'data', name: 'Glo 1GB', code: 'GLO', amount: 350 },
      { id: '9mobile-data-1gb', serviceId: 'data', name: '9mobile 1GB', code: 'ETISALAT', amount: 300 },
    ],
  },
  {
    id: 'electricity',
    name: 'Electricity',
    category: 'electricity',
    icon: 'zap',
    products: [
      { id: 'eko-electricity', serviceId: 'electricity', name: 'EEDC (Eko)', code: 'EKEDC', amount: 0 },
      { id: 'ikeja-electricity', serviceId: 'electricity', name: 'IKEDC (Ikeja)', code: 'IKEDC', amount: 0 },
      { id: 'abuja-electricity', serviceId: 'electricity', name: 'AEDC (Abuja)', code: 'AEDC', amount: 0 },
      { id: 'port-harcourt-electricity', serviceId: 'electricity', name: 'PHED (Port Harcourt)', code: 'PHED', amount: 0 },
    ],
  },
  {
    id: 'cable',
    name: 'Cable TV',
    category: 'cable',
    icon: 'tv',
    products: [
      { id: 'dstv-pcompact', serviceId: 'cable', name: 'DStv Compact', code: 'DSTV', amount: 3700 },
      { id: 'dstv-pcompact-plus', serviceId: 'cable', name: 'DStv Compact Plus', code: 'DSTV', amount: 5800 },
      { id: 'dstv-premium', serviceId: 'cable', name: 'DStv Premium', code: 'DSTV', amount: 10500 },
      { id: 'gotv-jinja', serviceId: 'cable', name: 'GOtv Jinja', code: 'GOTV', amount: 800 },
      { id: 'gotv-jolly', serviceId: 'cable', name: 'GOtv Jolly', code: 'GOTV', amount: 1600 },
      { id: 'startimes-token', serviceId: 'cable', name: 'Startimes', code: 'STARTIMES', amount: 0 },
    ],
  },
  {
    id: 'betting',
    name: 'Betting',
    category: 'betting',
    icon: 'gamepad-2',
    products: [
      { id: 'bet9ja', serviceId: 'betting', name: 'Bet9ja', code: 'BET9JA', amount: 0 },
      { id: 'nairabet', serviceId: 'betting', name: 'Nairabet', code: 'NAIRABET', amount: 0 },
      { id: 'betking', serviceId: 'betting', name: 'BetKing', code: 'BETKING', amount: 0 },
    ],
  },
];

export class FlutterwaveBillService {
  async getServices(): Promise<BillService[]> {
    return BILL_SERVICES;
  }

  async getProducts(serviceId: string): Promise<BillProduct[]> {
    const service = BILL_SERVICES.find((s) => s.id === serviceId);
    return service?.products || [];
  }

  async payBill(userId: string, serviceId: string, productId: string, customerId: string): Promise<Transaction> {
    const service = BILL_SERVICES.find((s) => s.id === serviceId);
    if (!service) throw new Error('Service not found');

    const product = service.products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');

    const fees = await getFees();
    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: 'NGN' } },
    });
    if (!wallet) throw new Error('NGN wallet not found');

    const amount = product.amount;
    const fee = fees.bill || 100;
    const totalAmount = amount + fee;

    if (amount > 0) {
      const balance = Number(wallet.balance);
      if (balance < totalAmount) throw new Error('Insufficient balance');
    }

    const reference = generateReference();

    try {
      await flutterwaveRequest('/v3/bills', {
        country: 'NG',
        customer: customerId,
        amount: amount.toString(),
        type: product.code,
        reference: reference,
      });
    } catch (error) {
      console.error('Flutterwave bill payment error:', error);
      throw new Error('Bill payment failed. Please try again.');
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'bill',
        subtype: service.category,
        currency: 'NGN',
        amount: totalAmount,
        fee,
        status: 'success',
        reference,
        description: `${product.name} payment for ${customerId}`,
        metadata: {
          serviceId,
          serviceName: service.name,
          productId,
          productName: product.name,
          customerId,
        },
      },
    });

    return transaction as unknown as Transaction;
  }

  async verifyPayment(reference: string): Promise<{ status: string; amount: number }> {
    const data = await flutterwaveRequest(`/v3/bills/${reference}`, {}) as { status?: string; amount?: number };
    return {
      status: data.status || 'pending',
      amount: data.amount || 0,
    };
  }
}

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();