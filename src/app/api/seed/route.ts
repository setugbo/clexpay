import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function POST() {
  try {
    await prisma.transaction.deleteMany({});
    await prisma.activityLog.deleteMany({});
    await prisma.wallet.deleteMany({});
    await prisma.user.deleteMany({});

    const superAdmin = await prisma.user.create({
      data: {
        email: 'admin@clexpay.com',
        passwordHash: await hashPassword('Clexpay@2024'),
        firstName: 'Admin',
        lastName: 'User',
        role: 'super_admin',
        status: 'active',
        emailVerified: true,
      },
    });

    const demoUser = await prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        passwordHash: await hashPassword('Demo@1234'),
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        status: 'active',
        emailVerified: true,
      },
    });

    for (const user of [superAdmin, demoUser]) {
      await prisma.wallet.createMany({
        data: [
          { userId: user.id, currency: 'NGN', balance: 10_000_000, isCrypto: false },
          { userId: user.id, currency: 'BTC', balance: 2, isCrypto: true },
          { userId: user.id, currency: 'ETH', balance: 20, isCrypto: true },
          { userId: user.id, currency: 'USDT', balance: 50_000, isCrypto: true },
        ],
      });
    }

    await prisma.setting.upsert({
      where: { key: 'system_mode' },
      update: { value: { mode: 'demo' } },
      create: { key: 'system_mode', value: { mode: 'demo' }, description: 'System operating mode' },
    });

    await prisma.setting.upsert({
      where: { key: 'exchange_rates' },
      update: {},
      create: {
        key: 'exchange_rates',
        value: { BTC_NGN: 50000000, ETH_NGN: 3500000, USDT_NGN: 1500 },
        description: 'Crypto exchange rates',
      },
    });

    await prisma.setting.upsert({
      where: { key: 'fees' },
      update: {},
      create: {
        key: 'fees',
        value: { cryptoBuy: 0.5, cryptoSell: 0.5, transfer: 0, bill: 100 },
        description: 'Transaction fees',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Send a POST request to this endpoint to seed the database with admin (admin@clexpay.com / Clexpay@2024) and demo (john.doe@example.com / Demo@1234) accounts.',
    instructions: 'curl -X POST https://your-domain.vercel.app/api/seed',
  });
}
