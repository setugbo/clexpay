import { PrismaClient } from '@prisma/client';
import { IWalletService } from './interfaces/wallet.service.interface';
import { ICryptoService } from './interfaces/crypto.service.interface';
import { IBillService } from './interfaces/bill.service.interface';
import { IGiftCardService } from './interfaces/giftcard.service.interface';
import { DemoWalletService } from './implementations/demo/demo.wallet.service';
import { DemoCryptoService } from './implementations/demo/demo.crypto.service';
import { DemoBillService } from './implementations/demo/demo.bill.service';
import { DemoGiftCardService } from './implementations/demo/demo.giftcard.service';
import { LiveWalletService } from './implementations/live/live.wallet.service';
import { LiveCryptoService } from './implementations/live/live.crypto.service';
import { LiveBillService } from './implementations/live/live.bill.service';
import { LiveGiftCardService } from './implementations/live/live.giftcard.service';

const prisma = new PrismaClient();

async function getSystemMode(): Promise<'demo' | 'live'> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'system_mode' },
    });

    if (setting && typeof setting.value === 'object' && setting.value !== null) {
      const value = setting.value as { mode?: string };
      if (value.mode === 'demo' || value.mode === 'live') {
        return value.mode;
      }
    }

    const existingSetting = await prisma.setting.findUnique({
      where: { key: 'system_mode' },
    });

    if (!existingSetting) {
      await prisma.setting.create({
        data: {
          key: 'system_mode',
          value: { mode: 'demo' },
          description: 'System operating mode: demo or live',
        },
      });
    }

    return 'demo';
  } catch (error) {
    console.error('Error fetching system mode:', error);
    return 'demo';
  }
}

export async function setSystemMode(mode: 'demo' | 'live'): Promise<void> {
  try {
    await prisma.setting.upsert({
      where: { key: 'system_mode' },
      update: { value: { mode } },
      create: { key: 'system_mode', value: { mode }, description: 'System operating mode: demo or live' },
    });
  } catch (error) {
    console.error('Error setting system mode:', error);
    throw error;
  }
}

export async function walletServiceFactory(): Promise<IWalletService> {
  const mode = await getSystemMode();
  return mode === 'demo' ? new DemoWalletService() : new LiveWalletService();
}

export async function cryptoServiceFactory(): Promise<ICryptoService> {
  const mode = await getSystemMode();
  return mode === 'demo' ? new DemoCryptoService() : new LiveCryptoService();
}

export async function billServiceFactory(): Promise<IBillService> {
  const mode = await getSystemMode();
  return mode === 'demo' ? new DemoBillService() : new LiveBillService();
}

export async function giftCardServiceFactory(): Promise<IGiftCardService> {
  const mode = await getSystemMode();
  return mode === 'demo' ? new DemoGiftCardService() : new LiveGiftCardService();
}

export async function getCurrentMode(): Promise<'demo' | 'live'> {
  return getSystemMode();
}

export async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'exchange_rates' },
    });

    if (setting && typeof setting.value === 'object' && setting.value !== null) {
      return setting.value as Record<string, number>;
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
