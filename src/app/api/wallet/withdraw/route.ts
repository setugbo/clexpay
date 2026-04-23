import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createBankTransfer, getBanks } from '@/lib/services/flutterwave';
import { generateReference } from '@/lib/utils';
import { getFees } from '@/lib/services/factory';
import { sendTransactionEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const MIN_WITHDRAWAL = 500;
const MAX_WITHDRAWAL = 5000000;
const MAX_DAILY_WITHDRAWAL = 10000000;

function validateAccountNumber(accountNumber: string): boolean {
  return /^\d{10}$/.test(accountNumber);
}

function validateBankCode(bankCode: string): boolean {
  return /^\d{3}$/.test(bankCode);
}

export async function GET() {
  try {
    const result = await getBanks();
    const banks = result.banks.map(b => ({
      code: b.code,
      name: b.name,
      id: b.id,
    }));
    return NextResponse.json({
      success: true,
      data: banks,
      error: result.error,
    });
  } catch (error) {
    console.error('Get banks error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get banks' }, { status: 500 });
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
    const { amount, bankCode, accountNumber, accountName } = body;

    const errors: string[] = [];
    if (!amount) errors.push('Amount is required');
    if (!bankCode) errors.push('Bank code is required');
    if (!accountNumber) errors.push('Account number is required');

    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: errors.join(', ') }, { status: 400 });
    }

    if (typeof amount !== 'number' || isNaN(amount)) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { success: false, error: `Minimum withdrawal is NGN ${MIN_WITHDRAWAL.toLocaleString()}` },
        { status: 400 }
      );
    }

    if (amount > MAX_WITHDRAWAL) {
      return NextResponse.json(
        { success: false, error: `Maximum withdrawal is NGN ${MAX_WITHDRAWAL.toLocaleString()}` },
        { status: 400 }
      );
    }

    if (!validateAccountNumber(accountNumber)) {
      return NextResponse.json(
        { success: false, error: 'Account number must be exactly 10 digits' },
        { status: 400 }
      );
    }

    if (!validateBankCode(bankCode)) {
      return NextResponse.json({ success: false, error: 'Invalid bank code' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyWithdrawals = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'withdrawal',
        createdAt: { gte: today, lt: tomorrow },
      },
      _sum: { amount: true },
    });

    const dailyTotal = Number(dailyWithdrawals._sum?.amount || 0) + amount;
    if (dailyTotal > MAX_DAILY_WITHDRAWAL) {
      return NextResponse.json(
        { success: false, error: `Daily withdrawal limit of NGN ${MAX_DAILY_WITHDRAWAL.toLocaleString()} exceeded` },
        { status: 400 }
      );
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: 'NGN' } },
    });

    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 });
    }

    const balance = Number(wallet.balance);
    if (balance < amount) {
      return NextResponse.json({ success: false, error: 'Insufficient balance' }, { status: 400 });
    }

    const reference = generateReference();

    let transferResult;
    try {
      transferResult = await createBankTransfer(bankCode, accountNumber, amount, reference);
    } catch (transferError) {
      console.error('Bank transfer error:', transferError);
      return NextResponse.json(
        { success: false, error: 'Failed to initiate transfer. Please try again.' },
        { status: 500 }
      );
    }

    if (!transferResult.success) {
      return NextResponse.json({ success: false, error: transferResult.message }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'withdrawal',
          currency: 'NGN',
          amount,
          fee: 0,
          status: 'pending',
          reference,
          description: `Withdrawal to ${accountNumber} (${accountName || 'N/A'})`,
          metadata: { bankCode, accountNumber, accountName: accountName || 'Not provided' },
        },
      }),
    ]);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'withdrawal.initiated',
        entityType: 'transaction',
        entityId: reference,
        details: { amount, bankCode, accountNumber: accountNumber.slice(-4) + '****', reference },
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      await sendTransactionEmail(user.email, {
        type: 'Withdrawal Initiated',
        amount: amount.toLocaleString(),
        currency: 'NGN',
        reference,
        status: 'pending',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal initiated successfully',
      data: { reference, amount, status: 'pending' },
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json({ success: false, error: 'Withdrawal failed. Please try again.' }, { status: 500 });
  }
}