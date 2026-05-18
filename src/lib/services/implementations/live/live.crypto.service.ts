import { PrismaClient } from '@prisma/client';
import { ICryptoService } from '../../interfaces/crypto.service.interface';
import { ExchangeRates, Transaction } from '@/types';
import { generateReference } from '@/lib/utils';
import { getExchangeRates, getFees } from '../../factory';

const prisma = new PrismaClient();

export class LiveCryptoService implements ICryptoService {
  async getRates(): Promise<ExchangeRates> {
    const rates = await getExchangeRates();
    return rates as unknown as ExchangeRates;
  }

  async buyCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction> {
    const rates = await getExchangeRates();
    const fees = await getFees();
    const rate = rates[`${toCurrency}_${fromCurrency}` as keyof ExchangeRates];
    
    if (!rate) throw new Error('Invalid currency pair');

    const fromWallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: fromCurrency } },
    });
    if (!fromWallet) throw new Error(`${fromCurrency} wallet not found`);

    const balance = Number(fromWallet.balance);
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
    const rates = await getExchangeRates();
    const fees = await getFees();
    const rate = rates[`${fromCurrency}_${toCurrency}` as keyof ExchangeRates];
    
    if (!rate) throw new Error('Invalid currency pair');

    const fromWallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: fromCurrency } },
    });
    if (!fromWallet) throw new Error(`${fromCurrency} wallet not found`);

    const balance = Number(fromWallet.balance);
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
    const rates = await getExchangeRates();
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
          },
        },
      });
    });

    return transaction as unknown as Transaction;
  }
}
