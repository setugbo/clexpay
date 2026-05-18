import { ExchangeRates, Transaction } from '@/types';
import { generateReference } from '@/lib/utils';
import { getExchangeRates } from '../../factory';
import prisma from '@/lib/prisma';

const TATUM_BASE_URL = process.env.TATUM_BASE_URL || 'https://api.tatum.io/v3';
const TATUM_API_KEY = process.env.TATUM_API_KEY;

const USD_TO_NGN = 1550;

interface TatumRates {
  [key: string]: { USD: number };
}

export function isTatumConfigured(): boolean {
  return !!TATUM_API_KEY;
}

async function tatumRequest(endpoint: string): Promise<unknown> {
  if (!TATUM_API_KEY) {
    throw new Error('Tatum API key not configured');
  }

  const response = await fetch(`${TATUM_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: new Headers({
      'x-api-key': TATUM_API_KEY,
      'Content-Type': 'application/json',
    }),
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
      const usdToNgn = USD_TO_NGN;

      return {
        BTC_NGN: (rates.bitcoin?.USD || 50000) * usdToNgn,
        ETH_NGN: (rates.ethereum?.USD || 3000) * usdToNgn,
        USDT_NGN: (rates.tether?.USD || 1) * usdToNgn,
      };
    } catch (error) {
      console.error('[TATUM] Failed to get rates from API:', error);
      return await getExchangeRates();
    }
  }

  private async getRateForPair(fromCurrency: string, toCurrency: string, rates: ExchangeRates): Promise<number> {
    const directKey = `${toCurrency}_${fromCurrency}` as keyof ExchangeRates;
    if (rates[directKey]) return rates[directKey];

    if (fromCurrency === 'NGN') {
      const key = `${toCurrency}_NGN` as keyof ExchangeRates;
      return rates[key] || 0;
    }
    if (toCurrency === 'NGN') {
      const key = `${fromCurrency}_NGN` as keyof ExchangeRates;
      return rates[key] || 0;
    }

    const fromToNgn = rates[`${fromCurrency}_NGN` as keyof ExchangeRates];
    const ngnToTarget = rates[`${toCurrency}_NGN` as keyof ExchangeRates];
    if (fromToNgn && ngnToTarget) {
      return ngnToTarget / fromToNgn;
    }

    return 0;
  }

  async getSupportedCrypto(): Promise<string[]> {
    return ['BTC', 'ETH', 'USDT'];
  }

  async buyCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction> {
    const rates = await this.getRates();
    const rate = await this.getRateForPair(fromCurrency, toCurrency, rates);
    if (!rate) throw new Error(`Exchange rate not available for ${toCurrency}_${fromCurrency}`);

    const cryptoAmount = amount / rate;
    const fee = (amount * 0.5) / 100;
    const totalCost = amount + fee;

    console.log('[TATUM] Buy crypto:', { userId, fromCurrency, toCurrency, amount, cryptoAmount, fee, totalCost, rate });

    return await this.executeTrade(userId, fromCurrency, toCurrency, totalCost, cryptoAmount, fee, 'buy');
  }

  async sellCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction> {
    const rates = await this.getRates();
    const rate = await this.getRateForPair(fromCurrency, toCurrency, rates);
    if (!rate) throw new Error(`Exchange rate not available for ${fromCurrency}_${toCurrency}`);

    const fiatAmount = amount * rate;
    const fee = (fiatAmount * 0.5) / 100;
    const netFiat = fiatAmount - fee;

    console.log('[TATUM] Sell crypto:', { userId, fromCurrency, toCurrency, amount, netFiat, fee, rate });

    return await this.executeTrade(userId, fromCurrency, toCurrency, amount, netFiat, fee, 'sell');
  }

  async swapCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction> {
    const rates = await this.getRates();
    const rate = await this.getRateForPair(fromCurrency, toCurrency, rates);
    if (!rate) throw new Error(`Exchange rate not available for ${toCurrency}_${fromCurrency}`);

    const toAmount = amount * rate;
    const fee = (toAmount * 0.3) / 100;
    const netAmount = toAmount - fee;

    console.log('[TATUM] Swap crypto:', { userId, fromCurrency, toCurrency, amount, netAmount, fee, rate });

    return await this.executeTrade(userId, fromCurrency, toCurrency, amount, netAmount, fee, 'swap');
  }

  private async executeTrade(
    userId: string,
    fromCurrency: string,
    toCurrency: string,
    fromAmount: number,
    toAmount: number,
    fee: number,
    action: string
  ): Promise<Transaction> {
    const reference = generateReference();

    const fromWallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: fromCurrency } },
    });

    if (!fromWallet) throw new Error(`${fromCurrency} wallet not found`);

    const fromBalance = Number(fromWallet.balance);
    if (fromBalance < fromAmount) throw new Error(`Insufficient ${fromCurrency} balance`);

    let toWallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: toCurrency } },
    });

    if (!toWallet) {
      toWallet = await prisma.wallet.upsert({
        where: { userId_currency: { userId, currency: toCurrency } },
        create: {
          userId,
          currency: toCurrency,
          isCrypto: ['BTC', 'ETH', 'USDT'].includes(toCurrency),
          balance: 0,
        },
        update: {},
      });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: fromWallet.id },
        data: { balance: { decrement: fromAmount } },
      });

      await tx.wallet.update({
        where: { id: toWallet!.id },
        data: { balance: { increment: toAmount } },
      });

      return tx.transaction.create({
        data: {
          userId,
          type: 'trade',
          subtype: action,
          currency: toCurrency,
          amount: toAmount,
          fee,
          status: 'success',
          reference,
          description: `${action} ${toAmount.toFixed(8)} ${toCurrency} with ${fromAmount.toFixed(2)} ${fromCurrency}`,
          metadata: { fromCurrency, toCurrency, fromAmount, action, provider: 'tatum' },
        },
      });
    });

    console.log('[TATUM] Trade completed:', reference);
    return transaction as unknown as Transaction;
  }
}
