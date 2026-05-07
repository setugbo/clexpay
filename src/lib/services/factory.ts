import prisma from '@/lib/prisma';
import { LiveWalletService } from './implementations/live/live.wallet.service';
import { TatumCryptoService } from './implementations/live/tatum.crypto.service';
import { VtpassBillService } from './implementations/live/vtpass.bill.service';
import { GiftCardService } from './implementations/live/gift.card.service';
import { DemoWalletService } from './implementations/demo/demo.wallet.service';
import { DemoCryptoService } from './implementations/demo/demo.crypto.service';
import { DemoBillService } from './implementations/demo/demo.bill.service';
import { DemoGiftCardService } from './implementations/demo/demo.giftcard.service';

export type SystemMode = 'demo' | 'live';

const liveGiftCardService = new GiftCardService();

export async function getCurrentMode(): Promise<SystemMode> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'system_mode' },
    });
    if (setting && typeof setting.value === 'object' && setting.value !== null) {
      const value = setting.value as { mode?: string };
      return value.mode === 'live' ? 'live' : 'demo';
    }
  } catch {
    // fall through
  }
  return 'demo';
}

export async function setSystemMode(mode: SystemMode) {
  await prisma.setting.upsert({
    where: { key: 'system_mode' },
    update: { value: { mode } },
    create: {
      key: 'system_mode',
      value: { mode },
      description: 'System operating mode (demo | live)',
    },
  });
}

export async function walletServiceFactory() {
  const mode = await getCurrentMode();
  return mode === 'demo' ? new DemoWalletService() : new LiveWalletService();
}

export async function cryptoServiceFactory() {
  const mode = await getCurrentMode();
  return mode === 'demo' ? new DemoCryptoService() : new TatumCryptoService();
}

export async function billServiceFactory() {
  const mode = await getCurrentMode();
  return mode === 'demo' ? new DemoBillService() : new VtpassBillService();
}

/** User-facing gift card flows (catalog + orders). Admin routes may still use live `giftCardService` for ops queues. */
export async function giftCardServiceFactory() {
  const mode = await getCurrentMode();
  return mode === 'demo' ? new DemoGiftCardService() : liveGiftCardService;
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
