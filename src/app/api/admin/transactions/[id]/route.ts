import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get transaction' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as { id: string; role?: string };
    if (currentUser.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Only super admins can delete transactions' }, { status: 403 });
    }

    const transaction = await prisma.transaction.findUnique({ where: { id: params.id } });
    if (!transaction) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    await prisma.transaction.delete({ where: { id: params.id } });

    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'DELETE_TRANSACTION',
        entityType: 'transaction',
        entityId: params.id,
        details: `Deleted transaction ${transaction.reference} (${transaction.type}, ${transaction.amount})`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      },
    });

    return NextResponse.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete transaction' }, { status: 500 });
  }
}
