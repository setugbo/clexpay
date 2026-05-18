import { IWalletService } from '../../interfaces/wallet.service.interface';
import { Wallet, Transaction } from '@/types';
import { generateReference } from '@/lib/utils';
import prisma from '@/lib/prisma';

export class DemoWalletService implements IWalletService {
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
      const wallets = await this.initializeWallets(userId);
      return wallets.find(w => w.currency === currency) || null;
    }

    return wallet as Wallet;
  }

  async fundWallet(userId: string, currency: string, amount: number): Promise<Transaction> {
    const wallet = await this.getWallet(userId, currency);
    if (!wallet) throw new Error('Wallet not found');
    if (amount <= 0) throw new Error('Amount must be positive');

    const reference = generateReference();

    const [transaction] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
      prisma.transaction.create({
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
      }),
    ]);

    return transaction as unknown as Transaction;
  }

  async withdraw(userId: string, currency: string, amount: number): Promise<Transaction> {
    const wallet = await this.getWallet(userId, currency);
    if (!wallet) throw new Error('Wallet not found');
    if (amount <= 0) throw new Error('Amount must be positive');
    
    const balance = Number(wallet.balance);
    if (balance < amount) throw new Error('Insufficient balance');

    const reference = generateReference();

    const [transaction] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.transaction.create({
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
      }),
    ]);

    return transaction as unknown as Transaction;
  }

  async transfer(fromUserId: string, toEmail: string, currency: string, amount: number): Promise<Transaction> {
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

    return transaction as unknown as Transaction;
  }

  private async initializeWallets(userId: string): Promise<Wallet[]> {
    const currencies = [
      { currency: 'NGN', isCrypto: false, balance: 100000 },
      { currency: 'BTC', isCrypto: true, balance: 0.01 },
      { currency: 'ETH', isCrypto: true, balance: 0.1 },
      { currency: 'USDT', isCrypto: true, balance: 100 },
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
}
