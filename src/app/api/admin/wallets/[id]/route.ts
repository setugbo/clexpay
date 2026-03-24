import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { balance } = body;

    if (typeof balance !== 'number' || balance < 0) {
      return NextResponse.json({ success: false, error: 'Invalid balance' }, { status: 400 });
    }

    const wallet = await prisma.wallet.update({
      where: { id },
      data: { balance },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as { id?: string }).id,
        action: 'admin_update_wallet_balance',
        entityType: 'wallet',
        entityId: id,
        details: { previousBalance: wallet.balance, newBalance: balance },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, data: wallet });
  } catch (error) {
    console.error('Update wallet error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update wallet' }, { status: 500 });
  }
}
