import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  message?: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    const [database, external] = await Promise.all([
      checkDatabase(),
      checkExternalServices(),
    ]);

    const overallStatus = calculateOverallStatus(database, external);

    return NextResponse.json({
      success: true,
      data: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services: {
          database,
          external,
        },
        system: {
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'production',
          uptime: process.uptime(),
        },
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { success: false, error: 'Health check failed' },
      { status: 500 }
    );
  }
}

async function checkDatabase(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    return {
      status: latency < 100 ? 'healthy' : 'degraded',
      latency,
      message: latency < 100 ? 'Database responding normally' : 'Database responding slowly',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: Date.now() - start,
      message: 'Database connection failed',
    };
  }
}

async function checkExternalServices(): Promise<Record<string, HealthStatus>> {
  const services: Record<string, Promise<HealthStatus>> = {
    flutterwave: checkUrl('https://api.flutterwave.com/v3/ping', 'FLUTTERWAVE_SECRET_KEY'),
    tatum: checkUrl('https://api.tatum.io/v3/health', 'TATUM_API_KEY'),
    email: checkEmailService(),
  };

  const results: Record<string, HealthStatus> = {};
  for (const [name, checkPromise] of Object.entries(services)) {
    results[name] = await checkPromise;
  }
  return results;
}

async function checkUrl(url: string, envKey: string): Promise<HealthStatus> {
  if (!process.env[envKey]) {
    return { status: 'degraded', message: `${envKey} not configured` };
  }

  const start = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const latency = Date.now() - start;

    if (response.ok) {
      return { status: 'healthy', latency, message: 'Service responding' };
    }
    return { status: 'degraded', latency, message: `Service returned ${response.status}` };
  } catch {
    return { status: 'unhealthy', latency: Date.now() - start, message: 'Service unreachable' };
  }
}

async function checkEmailService(): Promise<HealthStatus> {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    return { status: 'degraded', message: 'Email not configured' };
  }

  const start = Date.now();
  try {
    const response = await fetch(`https://${process.env.EMAIL_HOST}`, {
      method: 'HEAD',
    });
    const latency = Date.now() - start;

    if (response.ok || response.status === 301 || response.status === 302) {
      return { status: 'healthy', latency, message: 'Email service configured' };
    }
    return { status: 'degraded', latency, message: 'Email service may have issues' };
  } catch {
    return { status: 'unhealthy', latency: Date.now() - start, message: 'Email service unreachable' };
  }
}

function calculateOverallStatus(
  database: HealthStatus,
  external: Record<string, HealthStatus>
): 'healthy' | 'degraded' | 'unhealthy' {
  if (database.status === 'unhealthy') return 'unhealthy';
  
  const externalStatuses = Object.values(external).map(s => s.status);
  if (externalStatuses.includes('unhealthy')) return 'degraded';
  if (externalStatuses.includes('degraded')) return 'degraded';
  
  return 'healthy';
}