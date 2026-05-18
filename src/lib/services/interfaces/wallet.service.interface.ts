import { Wallet, Transaction } from '@/types';

export interface IWalletService {
  getWallets(userId: string): Promise<Wallet[]>;
  getWallet(userId: string, currency: string): Promise<Wallet | null>;
  fundWallet(userId: string, currency: string, amount: number): Promise<Transaction>;
  withdraw(userId: string, currency: string, amount: number): Promise<Transaction>;
  transfer(fromUserId: string, toEmail: string, currency: string, amount: number): Promise<Transaction>;
}
