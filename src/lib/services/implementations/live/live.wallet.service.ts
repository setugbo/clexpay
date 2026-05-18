import { IWalletService } from '../../interfaces/wallet.service.interface';
import { Wallet, Transaction } from '@/types';
import { generateReference } from '@/lib/utils';
import { sendTransactionEmail } from '@/lib/email';
import prisma from '@/lib/prisma';

export class LiveWalletService implements IWalletService {
  async getWallets(userId: string): Promise<Wallet[]> {
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { currency: 'asc' },
    });

    if (wallets.length === 0) {
      return this.initializeWallets(userId);
    }

    return wallets as Wallet[];
  }

  async getWallet(userId: string, currency: string): Promise<Wallet | null> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });

    if (!wallet) {
      await this.initializeWallets(userId);
      return prisma.wallet.findUnique({
        where: { userId_currency: { userId, currency } },
      }) as Promise<Wallet | null>;
    }

    return wallet as Wallet;
  }

  async fundWallet(userId: string, currency: string, amount: number): Promise<Transaction> {
    if (currency === 'NGN') {
      if (amount < 100) {
        throw new Error('Minimum funding amount is NGN 100');
      }
    } else if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const wallet = await this.getWallet(userId, currency);
    if (!wallet) throw new Error('Wallet not found');

    const reference = generateReference();

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      return tx.transaction.create({
        data: {
          userId,
          type: 'deposit',
          currency,
          amount,
          fee: 0,
          status: 'success',
          reference,
          description: `Wallet funding - ${currency}`,
        },
      });
    });

    this.sendTransactionNotification(userId, 'Wallet Funding', amount, currency, reference, 'success');

    return transaction as unknown as Transaction;
  }

  async withdraw(userId: string, currency: string, amount: number): Promise<Transaction> {
    if (currency === 'NGN') {
      if (amount < 500) {
        throw new Error('Minimum withdrawal amount is NGN 500');
      }
    } else if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const wallet = await this.getWallet(userId, currency);
    if (!wallet) throw new Error('Wallet not found');

    const balance = Number(wallet.balance);
    if (balance < amount) throw new Error('Insufficient balance');

    const reference = generateReference();

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      return tx.transaction.create({
        data: {
          userId,
          type: 'withdrawal',
          currency,
          amount,
          fee: 0,
          status: 'success',
          reference,
          description: `Withdrawal - ${currency}`,
        },
      });
    });

    this.sendTransactionNotification(userId, 'Withdrawal', amount, currency, reference, 'success');

    return transaction as unknown as Transaction;
  }

  async transfer(fromUserId: string, toEmail: string, currency: string, amount: number): Promise<Transaction> {
    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    const fromWallet = await this.getWallet(fromUserId, currency);
    if (!fromWallet) throw new Error('Source wallet not found');

    const balance = Number(fromWallet.balance);
    if (balance < amount) throw new Error('Insufficient balance');

    const toUser = await prisma.user.findUnique({ where: { email: toEmail } });
    if (!toUser) throw new Error('Recipient not found');
    if (toUser.id === fromUserId) throw new Error('Cannot transfer to yourself');

    const toWallet = await this.getWallet(toUser.id, currency);
    if (!toWallet) throw new Error('Recipient wallet not found');

    const reference = generateReference();

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: fromWallet.id },
        data: { balance: { decrement: amount } },
      });

      await tx.wallet.update({
        where: { id: toWallet.id },
        data: { balance: { increment: amount } },
      });

      return tx.transaction.create({
        data: {
          userId: fromUserId,
          type: 'transfer',
          currency,
          amount,
          fee: 0,
          status: 'success',
          reference,
          description: `Transfer to ${toEmail}`,
          metadata: { recipientId: toUser.id, recipientEmail: toEmail },
        },
      });
    });

    this.sendTransactionNotification(fromUserId, 'Transfer Sent', amount, currency, reference, 'success');

    return transaction as unknown as Transaction;
  }

  private async initializeWallets(userId: string): Promise<Wallet[]> {
    const currencies = [
      { currency: 'NGN', isCrypto: false, balance: 0 },
      { currency: 'BTC', isCrypto: true, balance: 0 },
      { currency: 'ETH', isCrypto: true, balance: 0 },
      { currency: 'USDT', isCrypto: true, balance: 0 },
    ];

    const wallets = await prisma.$transaction(
      currencies.map((c) =>
        prisma.wallet.create({
          data: {
            userId,
            currency: c.currency,
            isCrypto: c.isCrypto,
            balance: c.balance,
          },
        })
      )
    );

    return wallets as unknown as Wallet[];
  }

  private async sendTransactionNotification(
    userId: string,
    type: string,
    amount: number,
    currency: string,
    reference: string,
    status: string
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.email) {
        await sendTransactionEmail(user.email, {
          type,
          amount: amount.toLocaleString(),
          currency,
          reference,
          status,
        });
      }
    } catch (error) {
      console.error('Failed to send transaction email:', error);
    }
  }
}