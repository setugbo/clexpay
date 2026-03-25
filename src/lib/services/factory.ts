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

let systemMode: 'demo' | 'live' = 'demo';
let modeChecked = false;

async function getSystemMode(): Promise<'demo' | 'live'> {
  if (modeChecked) return systemMode;

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'system_mode' },
    });

    if (setting && typeof setting.value === 'object' && setting.value !== null) {
      const value = setting.value as { mode?: string };
      if (value.mode === 'demo' || value.mode === 'live') {
        systemMode = value.mode;
      }
    } else {
      await prisma.setting.upsert({
        where: { key: 'system_mode' },
        update: { value: { mode: 'demo' } },
        create: { key: 'system_mode', value: { mode: 'demo' } },
      });
    }

    modeChecked = true;
  } catch {
    console.warn('Could not fetch system mode, defaulting to demo');
  }

  return systemMode;
}

export async function setSystemMode(mode: 'demo' | 'live'): Promise<void> {
  systemMode = mode;
  modeChecked = true;

  await prisma.setting.upsert({
    where: { key: 'system_mode' },
    update: { value: { mode } },
    create: { key: 'system_mode', value: { mode } },
  });
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
  return systemMode;
}
