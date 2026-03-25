import { ICryptoService } from '../../interfaces/crypto.service.interface';
import { ExchangeRates, Transaction } from '@/types';

export class LiveCryptoService implements ICryptoService {
  async getRates(): Promise<ExchangeRates> {
    throw new Error('Live crypto service not implemented yet. Configure API keys in admin settings.');
  }

  async buyCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction> {
    throw new Error('Live crypto service not implemented yet. Configure API keys in admin settings.');
  }

  async sellCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction> {
    throw new Error('Live crypto service not implemented yet. Configure API keys in admin settings.');
  }

  async swapCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction> {
    throw new Error('Live crypto service not implemented yet. Configure API keys in admin settings.');
  }
}
