import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isPaystackConfigured } from '@/lib/services/paystack';
import { isTatumConfigured } from '@/lib/services/implementations/live/tatum.crypto.service';
import { isVtpassConfigured } from '@/lib/services/vtpass';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    let dbStatus = 'unhealthy';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'healthy';
    } catch (error) {
      console.error('[SYSTEM] Database check failed:', error);
    }

    const status = dbStatus === 'healthy' && isPaystackConfigured() && isTatumConfigured() && isVtpassConfigured()
      ? 'healthy'
      : dbStatus === 'unhealthy' || !isPaystackConfigured()
      ? 'unhealthy'
      : 'degraded';

    return NextResponse.json({
      success: true,
      data: {
        status,
        services: {
          paystack: { status: isPaystackConfigured() ? 'healthy' : 'unhealthy', message: isPaystackConfigured() ? 'Paystack API configured' : 'Paystack API key missing' },
          vtpass: { status: isVtpassConfigured() ? 'healthy' : 'unhealthy', message: isVtpassConfigured() ? 'VTPass API configured' : 'VTPass API key missing' },
          tatum: { status: isTatumConfigured() ? 'healthy' : 'unhealthy', message: isTatumConfigured() ? 'Tatum API configured' : 'Tatum API key missing' },
          email: { status: process.env.EMAIL_HOST ? 'healthy' : 'unhealthy', message: process.env.EMAIL_HOST ? 'Email configured' : 'Email not configured' },
          database: { status: dbStatus, message: dbStatus === 'healthy' ? 'Database connected' : 'Database connection failed' },
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[SYSTEM] Status check error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get system status' }, { status: 500 });
  }
}
