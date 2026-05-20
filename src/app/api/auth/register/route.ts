import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateOTP } from '@/lib/utils';
import { sendOTPEmail } from '@/lib/email';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, message: 'Password is valid' };
}

export async function POST(request: NextRequest) {
  try {
    const { allowed } = await checkRateLimit(getRateLimitIdentifier(request), '/api/auth/register', { maxRequests: 5, windowMs: 60 * 1000 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { email, password, firstName, lastName, phone } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.message },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);
    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone,
        status: 'active',
        emailVerified: false,
        role: 'user',
        otpCode,
        otpExpiresAt,
      },
    });

    const wallets = await prisma.$transaction([
      prisma.wallet.create({
        data: { userId: user.id, currency: 'NGN', isCrypto: false, balance: 0 },
      }),
      prisma.wallet.create({
        data: { userId: user.id, currency: 'BTC', isCrypto: true, balance: 0 },
      }),
      prisma.wallet.create({
        data: { userId: user.id, currency: 'ETH', isCrypto: true, balance: 0 },
      }),
      prisma.wallet.create({
        data: { userId: user.id, currency: 'USDT', isCrypto: true, balance: 0 },
      }),
    ]);

    const otpSent = await sendOTPEmail(email, otpCode);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'user.registered',
        entityType: 'user',
        entityId: user.id,
        details: { email, firstName, lastName, otpSent },
      },
    });

    return NextResponse.json({
      success: true,
      message: otpSent 
        ? 'Account created! Please verify your email with the OTP sent.' 
        : 'Account created! Contact support if you don\'t receive OTP.',
      data: {
        userId: user.id,
        verified: false,
        requiresVerification: true,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}