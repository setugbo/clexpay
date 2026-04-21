import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createPaymentLink, verifyPayment } from '@/lib/services/flutterwave';
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
    const { amount, verify } = body;

    if (verify) {
      const result = await verifyPayment(verify);
      
      if (result.success) {
        const transaction = await prisma.transaction.findUnique({
          where: { reference: verify },
        });

        if (!transaction || transaction.status !== 'success') {
          const user = await prisma.user.findUnique({
            where: { id: userId },
          });

          const wallet = await prisma.wallet.findUnique({
            where: { userId_currency: { userId, currency: 'NGN' } },
          });

          if (wallet && user) {
            await prisma.$transaction([
              prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: result.amount } },
              }),
              prisma.transaction.create({
                data: {
                  userId,
                  type: 'deposit',
                  currency: 'NGN',
                  amount: result.amount,
                  fee: 0,
                  status: 'success',
                  reference: verify,
                  description: 'Wallet funding via Flutterwave',
                },
              }),
            ]);
          }
        }

        return NextResponse.json({
          success: true,
          verified: true,
          amount: result.amount,
        });
      }

      return NextResponse.json({
        success: false,
        verified: false,
        status: result.status,
      });
    }

    if (!amount || amount < 100) {
      return NextResponse.json(
        { success: false, error: 'Minimum amount is NGN 100' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const reference = generateReference();

    await prisma.transaction.create({
      data: {
        userId,
        type: 'deposit',
        currency: 'NGN',
        amount,
        fee: 0,
        status: 'pending',
        reference,
        description: 'Pending wallet funding',
      },
    });

    const { paymentUrl } = await createPaymentLink(userId, user.email, amount, reference);

    return NextResponse.json({
      success: true,
      paymentUrl,
      reference,
    });
  } catch (error) {
    console.error('Fund wallet error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (reference) {
      const result = await verifyPayment(reference);
      return NextResponse.json({
        success: result.success,
        status: result.status,
        amount: result.amount,
      });
    }

    return NextResponse.json({ error: 'Reference required' }, { status: 400 });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}