import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { setSystemMode, getCurrentMode } from '@/lib/services/factory';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
    const { mode } = body;

    if (mode !== 'demo' && mode !== 'live') {
      return NextResponse.json({ success: false, error: 'Invalid mode. Use "demo" or "live"' }, { status: 400 });
    }

    const previousMode = await getCurrentMode();
    await setSystemMode(mode);

    await prisma.activityLog.create({
      data: {
        userId: (session.user as { id?: string }).id,
        action: 'system.mode_changed',
        entityType: 'setting',
        entityId: 'system_mode',
        details: { from: previousMode, to: mode },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      },
    });

    return NextResponse.json({
      success: true,
      data: { mode },
    });
  } catch (error) {
    console.error('Switch mode error:', error);
    return NextResponse.json({ success: false, error: 'Failed to switch mode' }, { status: 500 });
  }
}
