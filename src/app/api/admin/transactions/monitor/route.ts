import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getStuckTransactions,
  getRecentFailures,
  getTransactionStats,
  checkForAlerts,
  updateTransactionStatus,
  retryTransaction,
} from '@/lib/transaction-monitor';

export const dynamic = 'force-dynamic';

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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'stats';
    const timeRange = (searchParams.get('timeRange') || 'day') as 'hour' | 'day' | 'week' | 'month';

    switch (type) {
      case 'stuck':
        const stuck = await getStuckTransactions();
        return NextResponse.json({ success: true, data: stuck });

      case 'failures':
        const hours = parseInt(searchParams.get('hours') || '24');
        const failures = await getRecentFailures(hours);
        return NextResponse.json({ success: true, data: failures });

      case 'alerts':
        const alerts = await checkForAlerts();
        return NextResponse.json({ success: true, data: alerts });

      case 'stats':
      default:
        const stats = await getTransactionStats(timeRange);
        return NextResponse.json({ success: true, data: stats });
    }
  } catch (error) {
    console.error('Transaction monitor error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get monitor data' }, { status: 500 });
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
    const { action, transactionId, status, reason } = body;

    const VALID_STATUSES = ['pending', 'success', 'failed', 'cancelled'];

    switch (action) {
      case 'update_status':
        if (!transactionId || !status) {
          return NextResponse.json({ success: false, error: 'Transaction ID and status required' }, { status: 400 });
        }
        if (!VALID_STATUSES.includes(status)) {
          return NextResponse.json({ success: false, error: 'Invalid status value' }, { status: 400 });
        }
        const updated = await updateTransactionStatus(transactionId, status, reason);
        if (!updated) {
          return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Transaction status updated' });

      case 'retry':
        if (!transactionId) {
          return NextResponse.json({ success: false, error: 'Transaction ID required' }, { status: 400 });
        }
        const retried = await retryTransaction(transactionId);
        if (!retried) {
          return NextResponse.json({ success: false, error: 'Cannot retry transaction' }, { status: 400 });
        }
        return NextResponse.json({ success: true, message: 'Transaction queued for retry' });

      case 'cancel':
        if (!transactionId) {
          return NextResponse.json({ success: false, error: 'Transaction ID required' }, { status: 400 });
        }
        const cancelled = await updateTransactionStatus(transactionId, 'cancelled', reason || 'Cancelled by admin');
        if (!cancelled) {
          return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Transaction cancelled' });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Transaction action error:', error);
    return NextResponse.json({ success: false, error: 'Action failed' }, { status: 500 });
  }
}