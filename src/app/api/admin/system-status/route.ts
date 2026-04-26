import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isPaystackConfigured } from '@/lib/services/paystack';
import { isTatumConfigured } from '@/lib/services/implementations/live/tatum.crypto.service';
import { isVtpassConfigured } from '@/lib/services/vtpass';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    let dbStatus = false;
    let emailStatus = false;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = true;
    } catch (error) {
      console.error('[SYSTEM] Database check failed:', error);
    }

    try {
      const result = await fetch(process.env.EMAIL_HOST || 'mail.clexpay.com', { 
        method: 'HEAD',
        signal: timeout(3000)
      });
      emailStatus = result.ok;
    } catch {
      emailStatus = false;
    }

    return NextResponse.json({
      success: true,
      database: dbStatus,
      paystack: isPaystackConfigured(),
      tatum: isTatumConfigured(),
      vtpass: isVtpassConfigured(),
      email: emailStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SYSTEM] Status check error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get system status' }, { status: 500 });
  }
}

function timeout(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}