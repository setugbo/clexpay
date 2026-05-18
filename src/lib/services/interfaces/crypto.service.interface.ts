import { ExchangeRates, Transaction } from '@/types';

export interface ICryptoService {
  getRates(): Promise<ExchangeRates>;
  buyCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction>;
  sellCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction>;
  swapCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction>;
}
