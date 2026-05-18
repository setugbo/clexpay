import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  // Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@clexpay.com',
      passwordHash: await bcrypt.hash('Clexpay@2024', 12),
      firstName: 'Admin',
      lastName: 'User',
      phone: '+2348012345678',
      role: 'super_admin',
      status: 'active',
      emailVerified: true,
    },
  });

  // Create demo wallets for super admin
  await prisma.wallet.createMany({
    data: [
      { userId: superAdmin.id, currency: 'NGN', balance: 10000000, isCrypto: false },
      { userId: superAdmin.id, currency: 'BTC', balance: 1.5, isCrypto: true },
      { userId: superAdmin.id, currency: 'ETH', balance: 10, isCrypto: true },
      { userId: superAdmin.id, currency: 'USDT', balance: 50000, isCrypto: true },
    ],
  });

  console.log('✅ Created Super Admin: admin@clexpay.com / Clexpay@2024');

  // Create Admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@clexpay.com',
      passwordHash: await bcrypt.hash('Admin@123', 12),
      firstName: 'Platform',
      lastName: 'Admin',
      phone: '+2348098765432',
      role: 'admin',
      status: 'active',
      emailVerified: true,
    },
  });

  await prisma.wallet.createMany({
    data: [
      { userId: admin.id, currency: 'NGN', balance: 5000000, isCrypto: false },
      { userId: admin.id, currency: 'BTC', balance: 0.5, isCrypto: true },
      { userId: admin.id, currency: 'ETH', balance: 5, isCrypto: true },
      { userId: admin.id, currency: 'USDT', balance: 25000, isCrypto: true },
    ],
  });

  console.log('✅ Created Admin: admin@clexpay.com / Admin@123');

  // Create demo users
  const demoUsers = [
    { email: 'john.doe@example.com', firstName: 'John', lastName: 'Doe', balance: 500000 },
    { email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith', balance: 750000 },
    { email: 'bob.wilson@example.com', firstName: 'Bob', lastName: 'Wilson', balance: 1000000 },
    { email: 'alice.johnson@example.com', firstName: 'Alice', lastName: 'Johnson', balance: 2500000 },
    { email: 'charlie.brown@example.com', firstName: 'Charlie', lastName: 'Brown', balance: 5000000 },
  ];

  for (const userData of demoUsers) {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: await bcrypt.hash('Demo@1234', 12),
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: '+2348012345678',
        role: 'user',
        status: 'active',
        emailVerified: true,
      },
    });

    await prisma.wallet.createMany({
      data: [
        { userId: user.id, currency: 'NGN', balance: userData.balance, isCrypto: false },
        { userId: user.id, currency: 'BTC', balance: 0.01, isCrypto: true },
        { userId: user.id, currency: 'ETH', balance: 0.1, isCrypto: true },
        { userId: user.id, currency: 'USDT', balance: 100, isCrypto: true },
      ],
    });

    console.log(`✅ Created User: ${userData.email} / Demo@1234`);
  }

  // Create settings
  await prisma.setting.upsert({
    where: { key: 'system_mode' },
    update: { value: { mode: 'demo' } },
    create: { key: 'system_mode', value: { mode: 'demo' }, description: 'System operation mode: demo or live' },
  });

  await prisma.setting.upsert({
    where: { key: 'exchange_rates' },
    update: { value: { BTC_NGN: 50000000, ETH_NGN: 3500000, USDT_NGN: 1500 } },
    create: { key: 'exchange_rates', value: { BTC_NGN: 50000000, ETH_NGN: 3500000, USDT_NGN: 1500 }, description: 'Crypto exchange rates' },
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

  console.log('✅ Created system settings');

  console.log('\n🎉 Seeding completed!\n');
  console.log('=====================================');
  console.log('LOGIN CREDENTIALS');
  console.log('=====================================');
  console.log('');
   console.log('🔐 SUPER ADMIN (Full Access):');
   console.log('   Email: admin@clexpay.com');
   console.log('   Password: Clexpay@2024');
  console.log('');
  console.log('🔐 ADMIN:');
  console.log('   Email: admin@clexpay.com');
  console.log('   Password: Admin@123');
  console.log('');
  console.log('🔐 DEMO USERS:');
  console.log('   Email: john.doe@example.com / Demo@1234');
  console.log('   Email: jane.smith@example.com / Demo@1234');
  console.log('   Email: bob.wilson@example.com / Demo@1234');
  console.log('');
  console.log('=====================================');
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
