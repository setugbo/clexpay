import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { allowed } = await checkRateLimit(getRateLimitIdentifier(request), '/api/auth/reset-password', { maxRequests: 5, windowMs: 60 * 1000 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { email, otp, password } = body;

    if (!email || !otp || !password) {
      return NextResponse.json({ success: false, error: 'Email, OTP, and new password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid or expired reset code' }, { status: 400 });
    }

    if (user.otpCode !== otp) {
      return NextResponse.json({ success: false, error: 'Invalid or expired reset code' }, { status: 400 });
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      return NextResponse.json({ success: false, error: 'Reset code has expired. Request a new one.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(password),
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    return NextResponse.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, error: 'Failed to reset password' }, { status: 500 });
  }
}
