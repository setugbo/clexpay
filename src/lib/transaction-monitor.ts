import prisma from '@/lib/prisma';

export type TransactionStatus = 'pending' | 'success' | 'failed' | 'cancelled';

export interface TransactionMonitor {
  id: string;
  userId: string;
  type: string;
  subtype?: string;
  currency: string;
  amount: number;
  fee: number;
  status: TransactionStatus;
  reference: string;
  provider?: string;
  createdAt: Date;
  updatedAt: Date;
  failureReason?: string;
  retryCount: number;
}

export interface MonitoringAlert {
  type: 'stuck_transaction' | 'failed_transaction' | 'unusual_activity';
  transactionId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
}

const STUCK_THRESHOLD_MS = 15 * 60 * 1000;

export async function getStuckTransactions(): Promise<TransactionMonitor[]> {
  const threshold = new Date(Date.now() - STUCK_THRESHOLD_MS);
  
  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'pending',
      createdAt: { lt: threshold },
    },
    orderBy: { createdAt: 'asc' },
  });
  
  return transactions as TransactionMonitor[];
}

export async function getRecentFailures(hours = 24): Promise<TransactionMonitor[]> {
  const threshold = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'failed',
      updatedAt: { gte: threshold },
    },
    orderBy: { updatedAt: 'desc' },
  });
  
  return transactions as TransactionMonitor[];
}

export async function getTransactionStats(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day') {
  const now = new Date();
  let startDate: Date;
  
  switch (timeRange) {
    case 'hour':
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }
  
  const [totals, byType, byStatus, recentActivity] = await Promise.all([
    prisma.transaction.aggregate({
      where: { createdAt: { gte: startDate } },
      _count: true,
      _sum: { amount: true, fee: true },
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: { createdAt: { gte: startDate } },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }),
    prisma.transaction.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    }),
  ]);
  
  return {
    summary: {
      totalTransactions: totals._count || 0,
      totalVolume: totals._sum?.amount || 0,
      totalFees: totals._sum?.fee || 0,
    },
    byType: byType.map(t => ({
      type: t.type,
      count: t._count,
      volume: t._sum?.amount || 0,
    })),
    byStatus: byStatus.map(s => ({
      status: s.status,
      count: s._count,
    })),
    recentActivity,
    timeRange,
    generatedAt: now,
  };
}

export async function checkForAlerts(): Promise<MonitoringAlert[]> {
  const alerts: MonitoringAlert[] = [];
  
  const stuckTransactions = await getStuckTransactions();
  for (const tx of stuckTransactions) {
    alerts.push({
      type: 'stuck_transaction',
      transactionId: tx.id,
      message: `Transaction ${tx.reference} stuck in pending for over 15 minutes`,
      severity: 'high',
      createdAt: new Date(),
    });
  }
  
  const recentFailures = await getRecentFailures(1);
  if (recentFailures.length > 10) {
    alerts.push({
      type: 'failed_transaction',
      transactionId: 'batch',
      message: `High failure rate: ${recentFailures.length} failed transactions in the last hour`,
      severity: 'critical',
      createdAt: new Date(),
    });
  }
  
  return alerts;
}

export async function updateTransactionStatus(
  transactionId: string,
  status: TransactionStatus,
  failureReason?: string
): Promise<boolean> {
  try {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        metadata: failureReason ? { failureReason } : undefined,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function retryTransaction(transactionId: string): Promise<boolean> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });
  
  if (!transaction) return false;
  
  if (transaction.status !== 'failed') return false;
  
  try {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'pending' },
    });
    return true;
  } catch {
    return false;
  }
}