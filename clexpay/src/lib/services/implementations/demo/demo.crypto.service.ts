import { PrismaClient } from '@prisma/client';
import { ICryptoService } from '../../interfaces/crypto.service.interface';
import { ExchangeRates, Transaction } from '@/types';
import { generateReference } from '@/lib/utils';

const prisma = new PrismaClient();

const DEMO_RATES: ExchangeRates = {
  BTC_NGN: 50000000,
  ETH_NGN: 3500000,
  USDT_NGN: 1500,
};

export class DemoCryptoService implements ICryptoService {
  async getRates(): Promise<ExchangeRates> {
    return DEMO_RATES;
  }

  private getRateForPair(fromCurrency: string, toCurrency: string): number {
    const directKey = `${toCurrency}_${fromCurrency}` as keyof ExchangeRates;
    if (DEMO_RATES[directKey]) return DEMO_RATES[directKey];

    if (fromCurrency === 'NGN') {
      const key = `${toCurrency}_NGN` as keyof ExchangeRates;
      return DEMO_RATES[key] || 0;
    }
    if (toCurrency === 'NGN') {
      const key = `${fromCurrency}_NGN` as keyof ExchangeRates;
      return DEMO_RATES[key] || 0;
    }

    const fromToNgn = DEMO_RATES[`${fromCurrency}_NGN` as keyof ExchangeRates];
    const ngnToTarget = DEMO_RATES[`${toCurrency}_NGN` as keyof ExchangeRates];
    if (fromToNgn && ngnToTarget) {
      return ngnToTarget / fromToNgn;
    }

    return 0;
  }

  async buyCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction> {
    const rate = this.getRateForPair(fromCurrency, toCurrency);
    if (!rate) throw new Error('Invalid currency pair');

    const fromWallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: fromCurrency } },
    });
    if (!fromWallet) throw new Error(`${fromCurrency} wallet not found`);

    const balance = Number(fromWallet.balance);
    if (balance < amount) throw new Error(`Insufficient ${fromCurrency} balance`);
    if (amount <= 0) throw new Error('Amount must be positive');

    const cryptoAmount = amount / rate;
    const fee = (amount * 0.5) / 100;
    const totalCost = amount + fee;

    let toWallet = await prisma.wallet.upsert({
      where: { userId_currency: { userId, currency: toCurrency } },
      create: {
        userId,
        currency: toCurrency,
        isCrypto: toCurrency !== 'NGN',
        balance: 0,
      },
      update: {},
    });

    const reference = generateReference();

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: fromWallet.id },
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
          },
        },
      });
    });

    return transaction as unknown as Transaction;
  }

  async sellCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction> {
    const rate = this.getRateForPair(fromCurrency, toCurrency);
    if (!rate) throw new Error('Invalid currency pair');

    const fromWallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: fromCurrency } },
    });
    if (!fromWallet) throw new Error(`${fromCurrency} wallet not found`);

    const balance = Number(fromWallet.balance);
    if (balance < amount) throw new Error(`Insufficient ${fromCurrency} balance`);
    if (amount <= 0) throw new Error('Amount must be positive');

    const fiatAmount = amount * rate;
    const fee = (fiatAmount * 0.5) / 100;
    const netAmount = fiatAmount - fee;

    let toWallet = await prisma.wallet.upsert({
      where: { userId_currency: { userId, currency: toCurrency } },
      create: {
        userId,
        currency: toCurrency,
        isCrypto: toCurrency !== 'NGN',
        balance: 0,
      },
      update: {},
    });

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
          },
        },
      });
    });

    return transaction as unknown as Transaction;
  }

  async swapCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction> {
    const rate = this.getRateForPair(fromCurrency, toCurrency);
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

    let toWallet = await prisma.wallet.upsert({
      where: { userId_currency: { userId, currency: toCurrency } },
      create: {
        userId,
        currency: toCurrency,
        isCrypto: toCurrency !== 'NGN',
        balance: 0,
      },
      update: {},
    });

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
          },
        },
      });
    });

    return transaction as unknown as Transaction;
  }
}
