import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where = status ? { kycStatus: { equals: status as 'not_started' | 'pending' | 'verified' | 'rejected' } } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          kycStatus: true,
          bvnVerifiedAt: true,
          idVerifiedAt: true,
          phone: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const pending = users.filter(u => u.kycStatus === 'pending');
    const verified = users.filter(u => u.kycStatus === 'verified');

    return NextResponse.json({
      success: true,
      data: {
        users,
        stats: { total: users.length, pending: pending.length, verified: verified.length },
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('[ADMIN/KYC] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get KYC list' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = (session.user as { id?: string }).id!;
    const body = await request.json();
    const { userId, action, reason } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (action === 'verify') {
      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: 'verified' },
      });

      await prisma.activityLog.create({
        data: {
          userId,
          action: 'kyc.verified',
          entityType: 'user',
          entityId: userId,
          details: { adminId, reason },
        },
      });

      return NextResponse.json({ success: true, message: 'KYC verified' });
    }

    if (action === 'reject') {
      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: 'rejected' },
      });

      await prisma.activityLog.create({
        data: {
          userId,
          action: 'kyc.rejected',
          entityType: 'user',
          entityId: userId,
          details: { adminId, reason },
        },
      });

      return NextResponse.json({ success: true, message: 'KYC rejected' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[ADMIN/KYC] PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process KYC' }, { status: 500 });
  }
}