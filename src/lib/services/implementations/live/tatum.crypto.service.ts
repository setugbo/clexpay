import { ExchangeRates, Transaction } from '@/types';
import { generateReference } from '@/lib/utils';
import { getFees, getExchangeRates as getStoredRates } from '../../factory';

const TATUM_BASE_URL = process.env.TATUM_BASE_URL || 'https://api.tatum.io/v3';
const TATUM_API_KEY = process.env.TATUM_API_KEY;

interface TatumRates {
  bitcoin: { USD: number };
  ethereum: { USD: number };
  tether: { USD: number };
  [key: string]: { USD: number };
}

async function tatumRequest(endpoint: string): Promise<unknown> {
  if (!TATUM_API_KEY) {
    throw new Error('Tatum API key not configured');
  }

  const response = await fetch(`${TATUM_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'x-api-key': TATUM_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Tatum API error: ${response.statusText}`);
  }

  return response.json();
}

async function getTatumRates(): Promise<TatumRates> {
  const data = await tatumRequest('/v3/rates') as TatumRates;
  return data;
}

export class TatumCryptoService {
  async getRates(): Promise<ExchangeRates> {
    try {
      const rates = await getTatumRates();
      const usdToNgn = 1;

      return {
        BTC_NGN: rates.bitcoin?.USD || 50000000,
        ETH_NGN: rates.ethereum?.USD || 3500000,
        USDT_NGN: rates.tether?.USD || 1500,
      };
    } catch {
      const storedRates = await getStoredRates();
      return storedRates as unknown as ExchangeRates;
    }
  }

  async buyCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction> {
    const rates = await this.getRates();
    const fees = await getFees();
    const rate = rates[`${toCurrency}_${fromCurrency}` as keyof ExchangeRates];

    if (!rate) throw new Error('Invalid currency pair');

    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: fromCurrency } },
    });
    if (!wallet) throw new Error(`${fromCurrency} wallet not found`);

    const balance = Number(wallet.balance);
    if (balance < amount) throw new Error(`Insufficient ${fromCurrency} balance`);
    if (amount <= 0) throw new Error('Amount must be positive');

    const cryptoAmount = amount / rate;
    const fee = (amount * (fees.cryptoBuy || 0.5)) / 100;
    const totalCost = amount + fee;

    let toWallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: toCurrency } },
    });
    if (!toWallet) {
      toWallet = await prisma.wallet.create({
        data: { userId, currency: toCurrency, isCrypto: true, balance: 0 },
      });
    }

    const reference = generateReference();

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: totalCost } },
      });

      await tx.wallet.update({
        where: { id: toWallet!.id },
        data: { balance: { increment: cryptoAmount } },
      });

      return tx.transaction.create({
        data: {
          userId,
          type: 'trade',
          subtype: 'buy',
          currency: toCurrency,
          amount: cryptoAmount,
          fee,
          status: 'success',
          reference,
          description: `Buy ${cryptoAmount.toFixed(8)} ${toCurrency} with ${fromCurrency}`,
          metadata: {
            fromCurrency,
            toCurrency,
            fromAmount: totalCost,
            rate,
            provider: 'tatum',
          },
        },
      });
    });

    return transaction as unknown as Transaction;
  }

  async sellCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction> {
    const rates = await this.getRates();
    const fees = await getFees();
    const rate = rates[`${fromCurrency}_${toCurrency}` as keyof ExchangeRates];

    if (!rate) throw new Error('Invalid currency pair');

    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: fromCurrency } },
    });
    if (!wallet) throw new Error(`${fromCurrency} wallet not found`);

    const balance = Number(wallet.balance);
    if (balance < amount) throw new Error(`Insufficient ${fromCurrency} balance`);
    if (amount <= 0) throw new Error('Amount must be positive');

    const fiatAmount = amount * rate;
    const fee = (fiatAmount * (fees.cryptoSell || 0.5)) / 100;
    const netAmount = fiatAmount - fee;

    let toWallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: toCurrency } },
    });
    if (!toWallet) {
      toWallet = await prisma.wallet.create({
        data: { userId, currency: toCurrency, isCrypto: false, balance: 0 },
      });
    }

    const reference = generateReference();

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      await tx.wallet.update({
        where: { id: toWallet!.id },
        data: { balance: { increment: netAmount } },
      });

      return tx.transaction.create({
        data: {
          userId,
          type: 'trade',
          subtype: 'sell',
          currency: toCurrency,
          amount: netAmount,
          fee,
          status: 'success',
          reference,
          description: `Sell ${amount.toFixed(8)} ${fromCurrency} for ${toCurrency}`,
          metadata: {
            fromCurrency,
            toCurrency,
            cryptoAmount: amount,
            rate,
            provider: 'tatum',
          },
        },
      });
    });

    return transaction as unknown as Transaction;
  }

  async swapCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction> {
    const rates = await this.getRates();
    const rate = rates[`${toCurrency}_${fromCurrency}` as keyof ExchangeRates];

    if (!rate) throw new Error('Invalid currency pair');

    const fromWallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: fromCurrency } },
    });
    if (!fromWallet) throw new Error(`${fromCurrency} wallet not found`);

    const balance = Number(fromWallet.balance);
    if (balance < amount) throw new Error(`Insufficient ${fromCurrency} balance`);
    if (amount <= 0) throw new Error('Amount must be positive');

    const toAmount = amount * rate;
    const fee = (toAmount * 0.3) / 100;
    const netAmount = toAmount - fee;

    let toWallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: toCurrency } },
    });
    if (!toWallet) {
      toWallet = await prisma.wallet.create({
        data: { userId, currency: toCurrency, isCrypto: true, balance: 0 },
      });
    }

    const reference = generateReference();

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: fromWallet.id },
        data: { balance: { decrement: amount } },
      });

      await tx.wallet.update({
        where: { id: toWallet!.id },
        data: { balance: { increment: netAmount } },
      });

      return tx.transaction.create({
        data: {
          userId,
          type: 'trade',
          subtype: 'swap',
          currency: toCurrency,
          amount: netAmount,
          fee,
          status: 'success',
          reference,
          description: `Swap ${amount.toFixed(8)} ${fromCurrency} for ${toCurrency}`,
          metadata: {
            fromCurrency,
            toCurrency,
            fromAmount: amount,
            rate,
            provider: 'tatum',
          },
        },
      });
    });

    return transaction as unknown as Transaction;
  }

  async getSupportedCrypto(): Promise<string[]> {
    return ['BTC', 'ETH', 'USDT'];
  }
}

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();