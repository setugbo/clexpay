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

    const userId = (session.user as { id?: string }).id!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        kycStatus: true,
        bvnVerifiedAt: true,
        idVerifiedAt: true,
        phone: true,
        address: true,
        dob: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        status: user?.kycStatus,
        bvnVerified: !!user?.bvnVerifiedAt,
        idVerified: !!user?.idVerifiedAt,
        phone: user?.phone,
        address: user?.address,
        dob: user?.dob,
      },
    });
  } catch (error) {
    console.error('[KYC] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get KYC status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id!;
    const body = await request.json();
    const { type, value, phone, address, dob } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user.kycStatus === 'verified') {
      return NextResponse.json({ success: false, error: 'KYC already verified' }, { status: 400 });
    }

    if (type === 'bvn') {
      if (!value || value.length !== 11) {
        return NextResponse.json({ success: false, error: 'BVN must be 11 digits' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: 'pending',
          bvn: value,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId,
          action: 'kyc.bvn_submitted',
          details: { bvn: value.slice(-4) + '****' },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'BVN submitted. Verification pending.',
        data: { status: 'pending' },
      });
    }

    if (type === 'id') {
      const { idType, idNumber } = body;
      if (!idType || !idNumber) {
        return NextResponse.json({ success: false, error: 'ID type and number required' }, { status: 400 });
      }

      const validIdTypes = ['nin', 'driver_license', 'passport', 'voter_id'];
      if (!validIdTypes.includes(idType)) {
        return NextResponse.json({ success: false, error: 'Invalid ID type' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: 'pending',
          idType,
          idNumber,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId,
          action: 'kyc.id_submitted',
          details: { idType },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'ID submitted. Verification pending.',
        data: { status: 'pending' },
      });
    }

    if (type === 'profile') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          phone: phone || user.phone,
          address,
          dob,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Profile updated',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid KYC type' }, { status: 400 });
  } catch (error) {
    console.error('[KYC] POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit KYC' }, { status: 500 });
  }
}