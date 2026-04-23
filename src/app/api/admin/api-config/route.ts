import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isFlutterwaveConfigured } from '@/lib/services/flutterwave';
import { isTatumConfigured } from '@/lib/services/implementations/live/tatum.crypto.service';

export const dynamic = 'force-dynamic';

interface ApiConfig {
  name: string;
  configured: boolean;
  envVar: string;
  description: string;
  docsUrl: string;
}

interface ConnectionTest {
  service: string;
  status: 'configured' | 'not_configured' | 'tested' | 'error';
  latency?: number;
  message: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    const configs: ApiConfig[] = [
      {
        name: 'Flutterwave',
        configured: isFlutterwaveConfigured(),
        envVar: 'FLUTTERWAVE_SECRET_KEY',
        description: 'Payments, bills, and bank transfers for Nigerian transactions',
        docsUrl: 'https://developer.flutterwave.com/docs',
      },
      {
        name: 'Tatum',
        configured: isTatumConfigured(),
        envVar: 'TATUM_API_KEY',
        description: 'Cryptocurrency trading, wallet management, and exchange rates',
        docsUrl: 'https://tatum.io/apidoc.php',
      },
      {
        name: 'Neon Database',
        configured: !!process.env.DATABASE_URL,
        envVar: 'DATABASE_URL',
        description: 'PostgreSQL database for storing all application data',
        docsUrl: 'https://neon.tech/docs',
      },
      {
        name: 'Email (SMTP)',
        configured: !!(process.env.EMAIL_HOST && process.env.EMAIL_USER),
        envVar: 'EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD',
        description: 'SMTP server for sending transactional emails',
        docsUrl: 'https://nodemailer.com',
      },
    ];

    const tests: ConnectionTest[] = [];
    const startTime = Date.now();

    try {
      await prisma.$queryRaw`SELECT 1`;
      tests.push({
        service: 'Database',
        status: 'tested',
        latency: Date.now() - startTime,
        message: 'Connected successfully',
      });
    } catch (error) {
      tests.push({
        service: 'Database',
        status: 'error',
        message: 'Connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    if (isFlutterwaveConfigured()) {
      const fwStart = Date.now();
      try {
        const response = await fetch('https://api.flutterwave.com/v3/banks/NG', {
          method: 'GET',
          headers: new Headers({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          }),
        });
        tests.push({
          service: 'Flutterwave',
          status: response.ok ? 'tested' : 'error',
          latency: Date.now() - fwStart,
          message: response.ok ? 'API responding' : 'API error',
          error: response.ok ? undefined : `HTTP ${response.status}`,
        });
      } catch (error) {
        tests.push({
          service: 'Flutterwave',
          status: 'error',
          latency: Date.now() - fwStart,
          message: 'Connection failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      tests.push({
        service: 'Flutterwave',
        status: 'not_configured',
        message: 'FLUTTERWAVE_SECRET_KEY not set',
      });
    }

    if (isTatumConfigured()) {
      const tatumStart = Date.now();
      try {
        const response = await fetch('https://api.tatum.io/v3/rates', {
          method: 'GET',
          headers: new Headers({
            'x-api-key': process.env.TATUM_API_KEY || '',
            'Content-Type': 'application/json',
          }),
        });
        tests.push({
          service: 'Tatum',
          status: response.ok ? 'tested' : 'error',
          latency: Date.now() - tatumStart,
          message: response.ok ? 'API responding' : 'API error',
          error: response.ok ? undefined : `HTTP ${response.status}`,
        });
      } catch (error) {
        tests.push({
          service: 'Tatum',
          status: 'error',
          latency: Date.now() - tatumStart,
          message: 'Connection failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      tests.push({
        service: 'Tatum',
        status: 'not_configured',
        message: 'TATUM_API_KEY not set',
      });
    }

    tests.push({
      service: 'Email',
      status: process.env.EMAIL_HOST ? 'configured' : 'not_configured',
      message: process.env.EMAIL_HOST ? 'SMTP configured' : 'SMTP not configured',
    });

    const allConfigured = configs.every(c => c.configured);
    const allTested = tests.filter(t => t.status !== 'not_configured').every(t => t.status === 'tested');

    return NextResponse.json({
      success: true,
      data: {
        configs,
        tests,
        summary: {
          allConfigured,
          allTested,
          systemStatus: allConfigured && allTested ? 'healthy' : allConfigured ? 'degraded' : 'needs_attention',
        },
      },
    });
  } catch (error) {
    console.error('[API-CONFIG] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get API configuration' }, { status: 500 });
  }
}