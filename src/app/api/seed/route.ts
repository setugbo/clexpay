import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  return POST();
}

export async function POST() {
  try {
    const passwordHash = await bcrypt.hash('Clexpay@2024', 12);
    const adminHash = await bcrypt.hash('Admin@123', 12);
    const userHash = await bcrypt.hash('User@1234', 12);

    const superAdmin = await prisma.user.upsert({
      where: { email: 'wordpressgee@gmail.com' },
      update: {},
      create: {
        email: 'wordpressgee@gmail.com',
        passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        status: 'active',
        emailVerified: true,
      },
    });

    const admin = await prisma.user.upsert({
      where: { email: 'admin@clexpay.com' },
      update: {},
      create: {
        email: 'admin@clexpay.com',
        passwordHash: adminHash,
        firstName: 'Clexpay',
        lastName: 'Admin',
        role: 'admin',
        status: 'active',
        emailVerified: true,
      },
    });

    const testUser = await prisma.user.upsert({
      where: { email: 'test@clexpay.com' },
      update: {},
      create: {
        email: 'test@clexpay.com',
        passwordHash: userHash,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        status: 'active',
        emailVerified: true,
      },
    });

    const allUsers = [superAdmin, admin, testUser];

    for (const user of allUsers) {
      await prisma.wallet.upsert({
        where: { userId_currency: { userId: user.id, currency: 'NGN' } },
        update: {},
        create: {
          userId: user.id,
          currency: 'NGN',
          balance: 500000,
          isCrypto: false,
        },
      });

      await prisma.wallet.upsert({
        where: { userId_currency: { userId: user.id, currency: 'BTC' } },
        update: {},
        create: {
          userId: user.id,
          currency: 'BTC',
          balance: 0.05,
          isCrypto: true,
        },
      });

      await prisma.wallet.upsert({
        where: { userId_currency: { userId: user.id, currency: 'ETH' } },
        update: {},
        create: {
          userId: user.id,
          currency: 'ETH',
          balance: 0.5,
          isCrypto: true,
        },
      });

      await prisma.wallet.upsert({
        where: { userId_currency: { userId: user.id, currency: 'USDT' } },
        update: {},
        create: {
          userId: user.id,
          currency: 'USDT',
          balance: 1000,
          isCrypto: true,
        },
      });
    }

    await prisma.setting.upsert({
      where: { key: 'system_mode' },
      update: { value: { mode: 'live' } },
      create: {
        key: 'system_mode',
        value: { mode: 'live' },
        description: 'System operating mode',
      },
    });

    await prisma.setting.upsert({
      where: { key: 'exchange_rates' },
      update: {},
      create: {
        key: 'exchange_rates',
        value: {
          BTC_NGN: 50000000,
          ETH_NGN: 3500000,
          USDT_NGN: 1500,
        },
        description: 'Crypto exchange rates',
      },
    });

    await prisma.setting.upsert({
      where: { key: 'fees' },
      update: {},
      create: {
        key: 'fees',
        value: {
          cryptoBuy: 0.5,
          cryptoSell: 0.5,
          transfer: 0,
          bill: 100,
        },
        description: 'Transaction fees',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      users: {
        superAdmin: superAdmin.email,
        admin: admin.email,
        testUser: testUser.email,
      },
      credentials: {
        superAdmin: 'wordpressgee@gmail.com / Clexpay@2024',
        admin: 'admin@clexpay.com / Admin@123',
        testUser: 'test@clexpay.com / User@1234',
      },
      mode: 'live',
      balances: {
        NGN: 500000,
        BTC: 0.05,
        ETH: 0.5,
        USDT: 1000,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage, details: String(error) },
      { status: 500 }
    );
  }
}