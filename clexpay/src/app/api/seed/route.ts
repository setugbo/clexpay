import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    await prisma.transaction.deleteMany({});
    await prisma.activityLog.deleteMany({});
    await prisma.wallet.deleteMany({});
    await prisma.user.deleteMany({});

    const superAdmin = await prisma.user.create({
      data: {
        email: 'wordpressgee@gmail.com',
        passwordHash: await hashPassword('Super@2024'),
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        status: 'active',
        emailVerified: true,
      },
    });

    const admin = await prisma.user.create({
      data: {
        email: 'admin@clexpay.com',
        passwordHash: await hashPassword('Admin@123'),
        firstName: 'Clexpay',
        lastName: 'Admin',
        role: 'admin',
        status: 'active',
        emailVerified: true,
      },
    });

    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@clexpay.com',
        passwordHash: await hashPassword('Demo@1234'),
        firstName: 'Demo',
        lastName: 'User',
        role: 'user',
        status: 'active',
        emailVerified: true,
      },
    });

    for (const user of [superAdmin, admin, demoUser]) {
      await prisma.wallet.createMany({
        data: [
          { userId: user.id, currency: 'NGN', balance: 500000, isCrypto: false },
          { userId: user.id, currency: 'BTC', balance: 0.05, isCrypto: true },
          { userId: user.id, currency: 'ETH', balance: 0.5, isCrypto: true },
          { userId: user.id, currency: 'USDT', balance: 1000, isCrypto: true },
        ],
      });
    }

    await prisma.setting.upsert({
      where: { key: 'system_mode' },
      update: { value: { mode: 'live' } },
      create: { key: 'system_mode', value: { mode: 'live' }, description: 'System operating mode' },
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
  return NextResponse.json({ success: false, error: 'Use POST to seed' }, { status: 405 });
}
