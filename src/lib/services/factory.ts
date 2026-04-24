import { PrismaClient } from '@prisma/client';
import { LiveWalletService } from './implementations/live/live.wallet.service';
import { TatumCryptoService } from './implementations/live/tatum.crypto.service';
import { FlutterwaveBillService } from './implementations/live/flutterwave.bill.service';
import { GiftCardService } from './implementations/live/gift.card.service';

const prisma = new PrismaClient();
const giftCardService = new GiftCardService();

export async function walletServiceFactory() {
  return new LiveWalletService();
}

export async function cryptoServiceFactory() {
  return new TatumCryptoService();
}

export async function billServiceFactory() {
  return new FlutterwaveBillService();
}

export async function giftCardServiceFactory() {
  return giftCardService;
}

export async function getCurrentMode() {
  return 'live' as const;
}

export async function setSystemMode(mode: 'live') {
  await prisma.setting.upsert({
    where: { key: 'system_mode' },
    update: { value: { mode: 'live' } },
    create: { key: 'system_mode', value: { mode: 'live' }, description: 'System operating mode' },
  });
}

export async function getExchangeRates() {
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

export async function getFees() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'fees' },
    });

    if (setting && typeof setting.value === 'object' && setting.value !== null) {
      return setting.value as Record<string, number>;
    }

    return {
      cryptoBuy: 1,
      cryptoSell: 1,
      transfer: 50,
      bill: 100,
    };
  } catch {
    return {
      cryptoBuy: 1,
      cryptoSell: 1,
      transfer: 50,
      bill: 100,
    };
  }
}