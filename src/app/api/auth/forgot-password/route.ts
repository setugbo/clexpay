import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateOTP } from '@/lib/utils';
import { sendOTPEmail } from '@/lib/email';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { allowed } = await checkRateLimit(getRateLimitIdentifier(request), '/api/auth/forgot-password', { maxRequests: 3, windowMs: 60 * 1000 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ success: true, message: 'If the email exists, a reset code has been sent.' });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ success: false, error: 'Account is not active' }, { status: 400 });
    }

    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiresAt },
    });

    await sendOTPEmail(email, otpCode);

    return NextResponse.json({
      success: true,
      message: 'If the email exists, a reset code has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to process request' }, { status: 500 });
  }
}
