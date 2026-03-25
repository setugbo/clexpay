import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { generateOTP } from '@/lib/utils';
import { sendOTPEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        otpCode,
        otpExpiresAt,
      },
    });

    await prisma.wallet.createMany({
      data: [
        { userId: user.id, currency: 'NGN', isCrypto: false, balance: 100000 },
        { userId: user.id, currency: 'BTC', isCrypto: true, balance: 0.01 },
        { userId: user.id, currency: 'ETH', isCrypto: true, balance: 0.1 },
        { userId: user.id, currency: 'USDT', isCrypto: true, balance: 100 },
      ],
    });

    await sendOTPEmail(email, otpCode);

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: { userId: user.id, requiresVerification: true },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
