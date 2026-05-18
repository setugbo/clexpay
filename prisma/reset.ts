import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting database to fresh state...');

  await prisma.activityLog.deleteMany();
  await prisma.apiError.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  console.log('  Wiped all transactions, logs, wallets, and users');

  const adminPw = await bcrypt.hash('Clexpay@2024', 12);
  const demoPw = await bcrypt.hash('Demo@1234', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@clexpay.com',
      passwordHash: adminPw,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+2348012345678',
      role: 'super_admin',
      status: 'active',
      emailVerified: true,
    },
  });

  await prisma.wallet.createMany({
    data: [
      { userId: admin.id, currency: 'NGN', balance: 1_000_000_000, isCrypto: false },
      { userId: admin.id, currency: 'BTC', balance: 50, isCrypto: true },
      { userId: admin.id, currency: 'ETH', balance: 500, isCrypto: true },
      { userId: admin.id, currency: 'USDT', balance: 2_000_000, isCrypto: true },
    ],
  });

  console.log('  Super admin: admin@clexpay.com / Clexpay@2024');

  const demo = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      passwordHash: demoPw,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+2348012345678',
      role: 'user',
      status: 'active',
      emailVerified: true,
    },
  });

  await prisma.wallet.createMany({
    data: [
      { userId: demo.id, currency: 'NGN', balance: 10_000_000, isCrypto: false },
      { userId: demo.id, currency: 'BTC', balance: 2, isCrypto: true },
      { userId: demo.id, currency: 'ETH', balance: 20, isCrypto: true },
      { userId: demo.id, currency: 'USDT', balance: 50_000, isCrypto: true },
    ],
  });

  console.log('  Demo user: john.doe@example.com / Demo@1234');

  await prisma.setting.upsert({
    where: { key: 'system_mode' },
    update: { value: { mode: 'demo' } },
    create: { key: 'system_mode', value: { mode: 'demo' }, description: 'System operation mode: demo or live' },
  });

  await prisma.setting.upsert({
    where: { key: 'exchange_rates' },
    update: { value: { BTC_NGN: 50_000_000, ETH_NGN: 3_500_000, USDT_NGN: 1_500 } },
    create: { key: 'exchange_rates', value: { BTC_NGN: 50_000_000, ETH_NGN: 3_500_000, USDT_NGN: 1_500 }, description: 'Crypto exchange rates' },
  });

  await prisma.setting.upsert({
    where: { key: 'fees' },
    update: { value: { cryptoBuy: 0.5, cryptoSell: 0.5, transfer: 0, bill: 100 } },
    create: { key: 'fees', value: { cryptoBuy: 0.5, cryptoSell: 0.5, transfer: 0, bill: 100 }, description: 'Transaction fees' },
  });

  await prisma.setting.upsert({
    where: { key: 'api_keys' },
    update: { value: { crypto: '', bills: '', giftcards: '' } },
    create: { key: 'api_keys', value: { crypto: '', bills: '', giftcards: '' }, description: 'API keys for live services' },
  });

  console.log('  Settings preserved');

  console.log('\nDatabase reset complete. Fresh state ready.');
  console.log('=============================================');
  console.log('  Super Admin: admin@clexpay.com / Clexpay@2024');
  console.log('  Demo User:   john.doe@example.com    / Demo@1234');
  console.log('=============================================');
}

main()
  .catch((e) => {
    console.error('Reset failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
