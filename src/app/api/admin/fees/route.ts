import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface FeeConfig {
  cryptoBuy: number;
  cryptoSell: number;
  transfer: number;
  bill: number;
  giftCard: number;
  withdrawal: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  minFunding: number;
  maxFunding: number;
}

const DEFAULT_FEES: FeeConfig = {
  cryptoBuy: 0.5,
  cryptoSell: 0.5,
  transfer: 0,
  bill: 100,
  giftCard: 2,
  withdrawal: 0,
  minWithdrawal: 500,
  maxWithdrawal: 5000000,
  minFunding: 100,
  maxFunding: 10000000,
};

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

    const feesSetting = await prisma.setting.findUnique({
      where: { key: 'fees' },
    });

    const fees = feesSetting?.value as FeeConfig | undefined;

    return NextResponse.json({
      success: true,
      data: {
        fees: fees || DEFAULT_FEES,
        default: DEFAULT_FEES,
      },
    });
  } catch (error) {
    console.error('Get fees error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get fees' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const { fees } = body as { fees: Partial<FeeConfig> };

    if (!fees || typeof fees !== 'object') {
      return NextResponse.json({ success: false, error: 'Fees object required' }, { status: 400 });
    }

    const validation = validateFees(fees);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.message }, { status: 400 });
    }

    const currentFees = (await prisma.setting.findUnique({ where: { key: 'fees' } })?.value as FeeConfig) || DEFAULT_FEES;
    const newFees: FeeConfig = { ...currentFees, ...fees };

    await prisma.setting.upsert({
      where: { key: 'fees' },
      update: {
        value: newFees,
        updatedAt: new Date(),
      },
      create: {
        key: 'fees',
        value: newFees,
        description: 'Transaction fees and limits configuration',
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as { id?: string }).id || '',
        action: 'settings.fees_updated',
        entityType: 'setting',
        entityId: 'fees',
        details: {
          oldFees: currentFees,
          newFees,
          changedBy: (session.user as { email?: string }).email,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Fees updated successfully',
      data: { fees: newFees },
    });
  } catch (error) {
    console.error('Update fees error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update fees' }, { status: 500 });
  }
}

function validateFees(fees: Partial<FeeConfig>): { valid: boolean; message: string } {
  const validations: { field: string; value: number; min: number; max: number }[] = [
    { field: 'cryptoBuy', value: fees.cryptoBuy ?? 0, min: 0, max: 10 },
    { field: 'cryptoSell', value: fees.cryptoSell ?? 0, min: 0, max: 10 },
    { field: 'transfer', value: fees.transfer ?? 0, min: 0, max: 10 },
    { field: 'bill', value: fees.bill ?? 0, min: 0, max: 1000 },
    { field: 'giftCard', value: fees.giftCard ?? 0, min: 0, max: 10 },
    { field: 'withdrawal', value: fees.withdrawal ?? 0, min: 0, max: 10 },
    { field: 'minWithdrawal', value: fees.minWithdrawal ?? 0, min: 0, max: 100000 },
    { field: 'maxWithdrawal', value: fees.maxWithdrawal ?? 0, min: 0, max: 100000000 },
    { field: 'minFunding', value: fees.minFunding ?? 0, min: 0, max: 100000 },
    { field: 'maxFunding', value: fees.maxFunding ?? 0, min: 0, max: 100000000 },
  ];

  for (const v of validations) {
    if (v.value < v.min || v.value > v.max) {
      return { valid: false, message: `${v.field} must be between ${v.min} and ${v.max}` };
    }
  }

  if (fees.minWithdrawal && fees.maxWithdrawal && fees.minWithdrawal >= fees.maxWithdrawal) {
    return { valid: false, message: 'Minimum withdrawal must be less than maximum withdrawal' };
  }

  if (fees.minFunding && fees.maxFunding && fees.minFunding >= fees.maxFunding) {
    return { valid: false, message: 'Minimum funding must be less than maximum funding' };
  }

  return { valid: true, message: 'Valid' };
}