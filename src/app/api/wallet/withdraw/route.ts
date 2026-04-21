import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createBankTransfer, getBanks } from '@/lib/services/flutterwave';
import { generateReference } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id!;
    const body = await request.json();
    const { amount, bankCode, accountNumber, accountName } = body;

    if (!amount || amount < 500) {
      return NextResponse.json(
        { success: false, error: 'Minimum withdrawal is NGN 500' },
        { status: 400 }
      );
    }

    if (!bankCode || !accountNumber) {
      return NextResponse.json(
        { success: false, error: 'Bank code and account number required' },
        { status: 400 }
      );
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: 'NGN' } },
    });

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    const balance = Number(wallet.balance);
    if (balance < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    const reference = generateReference();

    const result = await createBankTransfer(
      bankCode,
      accountNumber,
      amount,
      reference
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
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
          metadata: {
            bankCode,
            accountNumber,
            accountName,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Withdrawal initiated successfully',
      reference,
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { success: false, error: 'Withdrawal failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const banks = await getBanks();
  return NextResponse.json({
    success: true,
    data: banks,
  });
}