import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hybridGiftCardService, ORDER_STATUS } from '@/lib/services/implementations/live/hybrid.giftcard.service';
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
    const status = searchParams.get('status');

    let orders;
    if (status === 'manual_queue') {
      orders = await hybridGiftCardService.getManualQueueOrders();
    } else if (status === 'completed') {
      orders = await hybridGiftCardService.getCompletedOrders();
    } else if (status) {
      orders = await prisma.transaction.findMany({
        where: { type: 'giftcard', status: status as 'pending' | 'success' | 'failed' },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      orders = await prisma.transaction.findMany({
        where: { type: 'giftcard' },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    const stats = await hybridGiftCardService.getOrderStats();

    return NextResponse.json({
      success: true,
      data: {
        orders,
        stats: {
          ...stats,
          statuses: {
            initiated: ORDER_STATUS.INITIATED,
            processing: ORDER_STATUS.PROCESSING,
            autoFulfilled: ORDER_STATUS.AUTO_FULFILLED,
            manualQueue: ORDER_STATUS.MANUAL_QUEUE,
            completed: ORDER_STATUS.COMPLETED,
            failed: ORDER_STATUS.FAILED,
            refunded: ORDER_STATUS.REFUNDED,
            flagged: ORDER_STATUS.FLAGGED,
          },
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

    if (action === 'reject' || action === 'refund') {
      await hybridGiftCardService.rejectOrder(transactionId, body.reason);

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

    if (action === 'flag') {
      if (!body.reason) {
        return NextResponse.json({ success: false, error: 'Flag reason required' }, { status: 400 });
      }

      await hybridGiftCardService.flagOrder(transactionId, body.reason);

      return NextResponse.json({
        success: true,
        message: 'Order flagged for review',
      });
    }

    if (!cardCode) {
      return NextResponse.json({ success: false, error: 'Card code is required for fulfillment' }, { status: 400 });
    }

    await hybridGiftCardService.fulfillOrder(transactionId, cardCode);

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

    const meta = transaction.metadata as Record<string, unknown> | null;

    if (transaction.user?.email) {
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