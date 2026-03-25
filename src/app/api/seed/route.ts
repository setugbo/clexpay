import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const passwordHash = await bcrypt.hash('Clexpay@2024', 12);
    const adminHash = await bcrypt.hash('Admin@123', 12);
    const demoHash = await bcrypt.hash('Demo@1234', 12);

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

    const demoUsers = [
      { email: 'john.doe@example.com', firstName: 'John', lastName: 'Doe' },
      { email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith' },
      { email: 'demo@example.com', firstName: 'Demo', lastName: 'User' },
    ];

    const createdUsers = [];
    for (const demoUser of demoUsers) {
      const user = await prisma.user.upsert({
        where: { email: demoUser.email },
        update: {},
        create: {
          email: demoUser.email,
          passwordHash: demoHash,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          role: 'user',
          status: 'active',
          emailVerified: true,
        },
      });
      createdUsers.push(user);
    }

    for (const user of [superAdmin, admin, ...createdUsers]) {
      const currencies = ['NGN', 'BTC', 'ETH', 'USDT'];
      for (const currency of currencies) {
        await prisma.wallet.upsert({
          where: { userId_currency: { userId: user.id, currency } },
          update: {},
          create: {
            userId: user.id,
            currency,
            balance: currency === 'NGN' ? 100000 : 1,
            isCrypto: currency !== 'NGN',
          },
        });
      }
    }

    await prisma.setting.upsert({
      where: { key: 'system_mode' },
      update: {},
      create: {
        key: 'system_mode',
        value: 'demo',
        description: 'System operating mode: demo or live',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      users: {
        superAdmin: superAdmin.email,
        admin: admin.email,
        demoUsers: createdUsers.map((u) => u.email),
      },
      credentials: {
        superAdmin: 'wordpressgee@gmail.com / Clexpay@2024',
        admin: 'admin@clexpay.com / Admin@123',
        demoUsers: 'john.doe@example.com / Demo@1234',
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
