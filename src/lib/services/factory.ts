import { PrismaClient } from '@prisma/client';
import { IWalletService } from './interfaces/wallet.service.interface';
import { ICryptoService } from './interfaces/crypto.service.interface';
import { IBillService } from './interfaces/bill.service.interface';
import { IGiftCardService } from './interfaces/giftcard.service.interface';
import { LiveWalletService } from './implementations/live/live.wallet.service';
import { TatumCryptoService } from './implementations/live/tatum.crypto.service';
import { FlutterwaveBillService } from './implementations/live/flutterwave.bill.service';
import { ManualGiftCardService } from './implementations/live/manual.giftcard.service';

const prisma = new PrismaClient();

export async function walletServiceFactory(): Promise<IWalletService> {
  return new LiveWalletService();
}

export async function cryptoServiceFactory(): Promise<ICryptoService> {
  return new TatumCryptoService();
}

export async function billServiceFactory(): Promise<IBillService> {
  return new FlutterwaveBillService();
}

export async function giftCardServiceFactory(): Promise<IGiftCardService> {
  return new ManualGiftCardService();
}

export async function getCurrentMode(): Promise<'live'> {
  return 'live';
}

export async function setSystemMode(mode: 'live'): Promise<void> {
  await prisma.setting.upsert({
    where: { key: 'system_mode' },
    update: { value: { mode: 'live' } },
    create: { key: 'system_mode', value: { mode: 'live' }, description: 'System operating mode' },
  });
}

export async function getExchangeRates(): Promise<{ BTC_NGN: number; ETH_NGN: number; USDT_NGN: number }> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'exchange_rates' },
    });

    if (setting && typeof setting.value === 'object' && setting.value !== null) {
      const rates = setting.value as Record<string, number>;
      return {
        BTC_NGN: rates.BTC_NGN || 50000000,
        ETH_NGN: rates.ETH_NGN || 3500000,
        USDT_NGN: rates.USDT_NGN || 1500,
      };
    }

    return {
      BTC_NGN: 50000000,
      ETH_NGN: 3500000,
      USDT_NGN: 1500,
    };
  } catch {
    return {
      BTC_NGN: 50000000,
      ETH_NGN: 3500000,
      USDT_NGN: 1500,
    };
  }
}

export async function getFees(): Promise<Record<string, number>> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'fees' },
    });

    if (setting && typeof setting.value === 'object' && setting.value !== null) {
      return setting.value as Record<string, number>;
    }

    return {
      cryptoBuy: 0.5,
      cryptoSell: 0.5,
      transfer: 0,
      bill: 100,
    };
  } catch {
    return {
      cryptoBuy: 0.5,
      cryptoSell: 0.5,
      transfer: 0,
      bill: 100,
    };
  }
}

export const COMPANY_INFO = {
  name: 'Clexpay',
  address: 'AAAA Excel Plaza, Okpanam Road, Off Jowin Academy by Kindgdom Hall, Asaba Delta State',
  phone: '+2349069015623',
  email: 'hello@clexpay.com',
  website: 'https://clexpay.vercel.app',
};