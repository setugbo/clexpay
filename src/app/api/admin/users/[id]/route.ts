export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

    const { id } = params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        kycStatus: true,
        createdAt: true,
        updatedAt: true,
        wallets: {
          select: {
            currency: true,
            balance: true,
            isCrypto: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as { id: string; role?: string; email?: string };
    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, role } = body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (currentUser.id === id) {
      return NextResponse.json({ success: false, error: 'Cannot modify your own account through this endpoint' }, { status: 400 });
    }

    if (targetUser.role === 'super_admin') {
      return NextResponse.json({ success: false, error: 'Cannot modify super admin accounts' }, { status: 403 });
    }

    if (role && currentUser.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Only super admins can change user roles' }, { status: 403 });
    }

    if (role && role === 'super_admin') {
      return NextResponse.json({ success: false, error: 'Cannot assign super admin role' }, { status: 400 });
    }

    const updateData: Record<string, string> = {};
    if (status) updateData.status = status;
    if (role) updateData.role = role;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        status: true,
        role: true,
        updatedAt: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'UPDATE_USER',
        details: `Updated user ${targetUser.email}: ${JSON.stringify(updateData)}`,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as { id: string; role?: string; email?: string };
    if (currentUser.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Only super admins can delete users' }, { status: 403 });
    }

    const { id } = params;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (currentUser.id === id) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 });
    }

    if (targetUser.role === 'super_admin') {
      return NextResponse.json({ success: false, error: 'Cannot delete super admin accounts' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'DELETE_USER',
        entityType: 'user',
        entityId: id,
        details: `Permanently deleted user ${targetUser.email} (${targetUser.firstName} ${targetUser.lastName})`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      },
    });

    return NextResponse.json({ success: true, message: 'User permanently deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}
