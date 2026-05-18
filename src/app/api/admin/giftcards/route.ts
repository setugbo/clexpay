import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { giftCardService } from '@/lib/services/implementations/live/gift.card.service';

const ORDER_STATUS = {
  INITIATED: 'initiated',
  PROCESSING: 'processing',
  AUTO_ATTEMPT: 'auto_attempt',
  COMPLETED: 'completed',
  MANUAL_QUEUE: 'manual_queue',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  FLAGGED: 'flagged',
};
import { sendTransactionEmail } from '@/lib/email';

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

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let orders;
    let total = 0;
    if (view === 'manual_queue') {
      orders = await giftCardService.getManualQueueOrders();
      total = orders.length;
    } else if (view === 'pending') {
      orders = await giftCardService.getPendingOrders();
      total = orders.length;
    } else {
      [orders, total] = await Promise.all([
        prisma.transaction.findMany({
          where: { type: 'giftcard' },
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.transaction.count({ where: { type: 'giftcard' } }),
      ]);
    }

    const stats = await giftCardService.getOrderStats();

    return NextResponse.json({
      success: true,
      data: {
        orders,
        stats: {
          ...stats,
          statuses: ORDER_STATUS,
        },
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('Get gift card orders error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get orders' }, { status: 500 });
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

    const adminId = (session.user as { id?: string }).id!;
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
      await giftCardService.rejectOrder(transactionId, adminId, body.reason);
      return NextResponse.json({ success: true, message: 'Order rejected and refunded' });
    }

    if (action === 'flag') {
      if (!body.reason) {
        return NextResponse.json({ success: false, error: 'Flag reason required' }, { status: 400 });
      }
      await giftCardService.flagOrder(transactionId, adminId, body.reason);
      return NextResponse.json({ success: true, message: 'Order flagged for review' });
    }

    if (!cardCode) {
      return NextResponse.json({ success: false, error: 'Card code is required' }, { status: 400 });
    }

    await giftCardService.fulfillManualOrder(transactionId, cardCode, adminId);

    if (transaction.user?.email) {
      const meta = transaction.metadata as Record<string, any> | null;
      await sendTransactionEmail(transaction.user.email, {
        type: 'Gift Card Delivered',
        amount: String(transaction.amount),
        currency: 'NGN',
        reference: transaction.reference,
        status: 'success',
        cardCode,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Gift card fulfilled successfully',
      data: { cardCode, transactionId },
    });
  } catch (error) {
    console.error('Fulfill gift card error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fulfill order';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}