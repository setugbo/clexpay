import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

async function seedDatabase() {
  await prisma.transaction.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.rateLimit.deleteMany({});
  await prisma.apiError.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.user.deleteMany({});

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@clexpay.com',
      passwordHash: hashPassword('Clexpay@2024'),
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
      passwordHash: hashPassword('Demo@1234'),
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
}

export async function POST() {
  try {
    await seedDatabase();
    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const existingUsers = await prisma.user.count();
    if (existingUsers === 0) {
      await seedDatabase();
    }

    return new Response(
      `<!DOCTYPE html>
<html>
<head><title>Seed Database</title></head>
<body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f5f5;">
  <div style="text-align: center; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #16a34a;">Database Ready</h1>
    <p style="color: #374151;">Admin account: <strong>admin@clexpay.com</strong> / <strong>Clexpay@2024</strong></p>
    <p style="color: #374151;">Demo account: <strong>john.doe@example.com</strong> / <strong>Demo@1234</strong></p>
    <a href="/auth/login" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 2rem; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Go to Login</a>
  </div>
</body>
</html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    return new Response(`<html><body><h1>Seed Error</h1><pre>${error}</pre></body></html>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
