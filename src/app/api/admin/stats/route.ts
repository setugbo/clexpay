import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type DateRange = {
  start: Date;
  end: Date;
};

function getDateRange(range: string): DateRange {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  switch (range) {
    case 'today':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
        end,
      };
    case 'week':
      return {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end,
      };
    case 'month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end,
      };
    case 'year':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end,
      };
    default:
      return {
        start: new Date(0),
        end,
      };
  }
}

export async function GET(request: Request) {
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
    const range = searchParams.get('range') || 'month';

    const dateRange = getDateRange(range);

    const [
      userStats,
      transactionStats,
      walletStats,
      recentTransactions,
      topUsers,
      dailyStats,
    ] = await Promise.all([
      prisma.user.aggregate({
        where: { createdAt: { gte: dateRange.start } },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: dateRange.start } },
        _count: true,
        _sum: { amount: true, fee: true },
      }),
      prisma.wallet.aggregate({
        _sum: { balance: true },
      }),
      prisma.transaction.findMany({
        where: { createdAt: { gte: dateRange.start } },
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: dateRange.start } },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          _count: { select: { transactions: true, wallets: true } },
        },
        orderBy: { transactions: { _count: 'desc' } },
        take: 10,
      }),
      getDailyStats(dateRange),
    ]);

    const volumeByType = await prisma.transaction.groupBy({
      by: ['type'],
      where: { createdAt: { gte: dateRange.start } },
      _sum: { amount: true },
      _count: true,
    });

    const revenueStats = await prisma.transaction.aggregate({
      where: { 
        createdAt: { gte: dateRange.start },
        status: 'success',
      },
      _sum: { fee: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          newUsers: userStats._count || 0,
          totalTransactions: transactionStats._count || 0,
          totalVolume: transactionStats._sum?.amount || 0,
          platformRevenue: revenueStats._sum?.fee || 0,
        },
        walletBalances: {
          totalHeld: walletStats._sum?.balance || 0,
        },
        volumeByType: volumeByType.reduce((acc, item) => {
          acc[item.type] = {
            count: item._count,
            volume: item._sum?.amount || 0,
          };
          return acc;
        }, {} as Record<string, { count: number; volume: number }>),
        recentTransactions,
        topUsers,
        dailyStats,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get statistics' }, { status: 500 });
  }
}

async function getDailyStats(dateRange: DateRange) {
  const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (24 * 60 * 60 * 1000));
  const stats = [];

  for (let i = 0; i < Math.min(days, 30); i++) {
    const dayStart = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    const [dayTransactions, dayUsers] = await Promise.all([
      prisma.transaction.aggregate({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.user.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
      }),
    ]);

    stats.push({
      date: dayStart.toISOString().split('T')[0],
      transactions: dayTransactions._count || 0,
      volume: dayTransactions._sum?.amount || 0,
      newUsers: dayUsers,
    });
  }

  return stats;
}