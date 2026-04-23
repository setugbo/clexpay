import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ManualGiftCardService } from '@/lib/services/implementations/live/manual.giftcard.service';
import { sendTransactionEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const giftCardService = new ManualGiftCardService();

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

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'pending';

    const orders = await prisma.transaction.findMany({
      where: {
        type: 'giftcard' as const,
        ...(statusFilter !== 'all' ? { status: statusFilter as 'pending' | 'success' | 'failed' } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = await prisma.transaction.aggregate({
      where: { type: 'giftcard' },
      _count: true,
      _sum: { amount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        orders,
        stats: {
          total: stats._count || 0,
          totalAmount: stats._sum?.amount || 0,
          pending: orders.filter(o => o.status === 'pending').length,
          completed: orders.filter(o => o.status === 'success').length,
        },
      },
    });
  } catch (error) {
    console.error('Get gift card orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get orders' },
      { status: 500 }
    );
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
    const { transactionId, cardCode, action } = body;

    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'Transaction ID required' }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: true },
    });

    if (!transaction) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.type !== 'giftcard') {
      return NextResponse.json({ success: false, error: 'Invalid transaction type' }, { status: 400 });
    }

    if (action === 'reject') {
      await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId_currency: { userId: transaction.userId, currency: 'NGN' } },
        });

        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: transaction.amount } },
          });
        }

        await tx.transaction.update({
          where: { id: transactionId },
          data: { status: 'failed', metadata: { ...transaction.metadata as object, rejectedAt: new Date().toISOString() } },
        });
      });

      await prisma.activityLog.create({
        data: {
          userId: transaction.userId,
          action: 'giftcard_order_rejected',
          entityType: 'transaction',
          entityId: transaction.id,
          details: {
            adminId: (session.user as { id?: string }).id,
            reason: body.reason || 'Order rejected by admin',
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Order rejected and funds refunded',
      });
    }

    if (!cardCode) {
      return NextResponse.json({ success: false, error: 'Card code is required for fulfillment' }, { status: 400 });
    }

    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cardCode)) {
      return NextResponse.json({ success: false, error: 'Invalid card code format' }, { status: 400 });
    }

    await giftCardService.fulfillOrder(transactionId, cardCode);

    await prisma.activityLog.create({
      data: {
        userId: transaction.userId,
        action: 'giftcard_fulfilled_by_admin',
        entityType: 'transaction',
        entityId: transaction.id,
        details: {
          adminId: (session.user as { id?: string }).id,
          cardCode,
        },
      },
    });

    if (transaction.user?.email) {
      await sendTransactionEmail(transaction.user.email, {
        type: 'Gift Card Delivered',
        amount: String(transaction.amount),
        currency: 'NGN',
        reference: transaction.reference,
        status: 'success',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Gift card fulfilled successfully',
      data: {
        cardCode,
        transactionId,
      },
    });
  } catch (error) {
    console.error('Fulfill gift card error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fulfill order' },
      { status: 500 }
    );
  }
}