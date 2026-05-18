import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

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

    await prisma.activityLog.deleteMany();
    await prisma.apiError.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.user.deleteMany();

    const admin = await prisma.user.create({
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

    await prisma.wallet.createMany({
      data: [
        { userId: admin.id, currency: 'NGN', balance: 1_000_000_000, isCrypto: false },
        { userId: admin.id, currency: 'BTC', balance: 50, isCrypto: true },
        { userId: admin.id, currency: 'ETH', balance: 500, isCrypto: true },
        { userId: admin.id, currency: 'USDT', balance: 2_000_000, isCrypto: true },
      ],
    });

    const demo = await prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        passwordHash: await bcrypt.hash('Demo@1234', 12),
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

    await prisma.setting.upsert({
      where: { key: 'system_mode' },
      update: { value: { mode: 'demo' } },
      create: { key: 'system_mode', value: { mode: 'demo' }, description: 'System operating mode' },
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

    return NextResponse.json({ success: true, message: 'Database reset successfully' });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
