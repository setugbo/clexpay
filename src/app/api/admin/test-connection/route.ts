import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isPaystackConfigured } from '@/lib/services/paystack';

export const dynamic = 'force-dynamic';

interface TestResult {
  success: boolean;
  latency?: number;
  message: string;
  error?: string;
}

async function testDatabase(): Promise<TestResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    return {
      success: true,
      latency,
      message: latency < 100 ? 'Database responding normally' : 'Database responding slowly',
    };
  } catch (error) {
    return {
      success: false,
      latency: Date.now() - start,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testPaystack(): Promise<TestResult> {
  const apiKey = process.env.PAYSTACK_SECRET_KEY;
  if (!apiKey) {
    return { success: false, message: 'Paystack API key not configured', error: 'PAYSTACK_SECRET_KEY missing' };
  }

  const start = Date.now();
  try {
    const response = await fetch('https://api.paystack.co/bank', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const latency = Date.now() - start;

    if (response.ok) {
      return { success: true, latency, message: 'Paystack API responding normally' };
    }

    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      latency,
      message: `Paystack API error: ${response.status}`,
      error: (errorData as { message?: string }).message || `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      success: false,
      latency: Date.now() - start,
      message: 'Paystack API unreachable',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

async function testVtpass(): Promise<TestResult> {
  const apiKey = process.env.VTPASS_API_KEY;
  if (!apiKey) {
    return { success: false, message: 'VTPass API key not configured', error: 'VTPASS_API_KEY missing' };
  }

  const start = Date.now();
  try {
    const response = await fetch('https://vtpass.com/api/services', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const latency = Date.now() - start;

    if (response.ok) {
      return { success: true, latency, message: 'VTPass API responding normally' };
    }

    return {
      success: false,
      latency,
      message: `VTPass API error: ${response.status}`,
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      success: false,
      latency: Date.now() - start,
      message: 'VTPass API unreachable',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

async function testTatum(): Promise<TestResult> {
  const apiKey = process.env.TATUM_API_KEY;
  if (!apiKey) {
    return { success: false, message: 'Tatum API key not configured', error: 'TATUM_API_KEY missing' };
  }

  const start = Date.now();
  try {
    const response = await fetch('https://api.tatum.io/v3/rates', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const latency = Date.now() - start;

    if (response.ok) {
      return { success: true, latency, message: 'Tatum API responding normally' };
    }

    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      latency,
      message: `Tatum API error: ${response.status}`,
      error: (errorData as { message?: string }).message || `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      success: false,
      latency: Date.now() - start,
      message: 'Tatum API unreachable',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

async function testEmail(): Promise<TestResult> {
  const emailHost = process.env.EMAIL_HOST;
  if (!emailHost || !process.env.EMAIL_USER) {
    return { success: false, message: 'Email not configured', error: 'EMAIL_HOST or EMAIL_USER missing' };
  }

  const start = Date.now();
  try {
    const { transporter } = await import('@/lib/email');
    if (!transporter) {
      return { success: false, message: 'Email transport not available' };
    }
    await transporter.verify();
    const latency = Date.now() - start;
    return { success: true, latency, message: 'Email service configured and verified' };
  } catch (error) {
    return {
      success: false,
      latency: Date.now() - start,
      message: 'Email service verification failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testGiftCard(): Promise<TestResult> {
  return { success: true, message: 'Gift cards use manual fulfillment - no external API required' };
}

async function testNeonDatabase(): Promise<TestResult> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return { success: false, message: 'Database URL not configured', error: 'DATABASE_URL missing' };
  }

  const start = Date.now();
  try {
    const count = await prisma.user.count();
    const latency = Date.now() - start;

    return {
      success: true,
      latency,
      message: `Neon PostgreSQL connected (${count} users in database)`,
    };
  } catch (error) {
    return {
      success: false,
      latency: Date.now() - start,
      message: 'Neon PostgreSQL connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { endpoint } = body as { endpoint?: string };

    const results: Record<string, TestResult> = {};

    if (endpoint) {
      switch (endpoint) {
        case 'database':
          results.database = await testDatabase();
          break;
        case 'neon':
          results.neon = await testNeonDatabase();
          break;
        case 'paystack':
          results.paystack = await testPaystack();
          break;
        case 'vtpass':
          results.vtpass = await testVtpass();
          break;
        case 'tatum':
          results.tatum = await testTatum();
          break;
        case 'email':
          results.email = await testEmail();
          break;
        case 'giftcards':
          results.giftcards = await testGiftCard();
          break;
        default:
          return NextResponse.json(
            { success: false, error: `Unknown endpoint: ${endpoint}` },
            { status: 400 }
          );
      }
    } else {
      const [database, neon, paystack, vtpass, tatum, email, giftcards] = await Promise.all([
        testDatabase(),
        testNeonDatabase(),
        testPaystack(),
        testVtpass(),
        testTatum(),
        testEmail(),
        testGiftCard(),
      ]);

      results.database = database;
      results.neon = neon;
      results.paystack = paystack;
      results.vtpass = vtpass;
      results.tatum = tatum;
      results.email = email;
      results.giftcards = giftcards;
    }

    const allSuccess = Object.values(results).every((r) => r.success);
    const criticalFailed = ['database', 'neon', 'paystack'].some((k) => results[k]?.success === false);

    const summary = Object.entries(results).map(([key, result]) => ({
      service: key,
      success: result.success,
      latency: result.latency,
      message: result.message,
    }));

    await prisma.activityLog.create({
      data: {
        userId: (session.user as { id?: string }).id || '',
        action: 'admin.connection_test',
        entityType: 'system',
        entityId: 'test-connection',
        details: { summary, endpoint: endpoint || 'all', allSuccess, criticalFailed },
      },
    });

    return NextResponse.json({
      success: allSuccess,
      status: criticalFailed ? 'critical_issues' : allSuccess ? 'healthy' : 'degraded',
      data: summary,
      message: allSuccess
        ? 'All connections verified'
        : criticalFailed
        ? 'Critical issues detected - immediate attention required'
        : 'Some connections failed - review results',
    });
  } catch (error) {
    console.error('[TEST-CONNECTION] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Connection test failed' },
      { status: 500 }
    );
  }
}
