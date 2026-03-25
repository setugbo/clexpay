import { IWalletService } from '../../interfaces/wallet.service.interface';
import { Wallet, Transaction } from '@/types';

export class LiveWalletService implements IWalletService {
  async getWallets(userId: string): Promise<Wallet[]> {
    throw new Error('Live wallet service not implemented yet. Configure API keys in admin settings.');
  }

  async getWallet(userId: string, currency: string): Promise<Wallet | null> {
    throw new Error('Live wallet service not implemented yet. Configure API keys in admin settings.');
  }

  async fundWallet(userId: string, currency: string, amount: number): Promise<Transaction> {
    throw new Error('Live wallet service not implemented yet. Configure API keys in admin settings.');
  }

  async withdraw(userId: string, currency: string, amount: number): Promise<Transaction> {
    throw new Error('Live wallet service not implemented yet. Configure API keys in admin settings.');
  }

  async transfer(fromUserId: string, toEmail: string, currency: string, amount: number): Promise<Transaction> {
    throw new Error('Live wallet service not implemented yet. Configure API keys in admin settings.');
  }
}
