import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createPaymentLink, verifyPayment } from '@/lib/services/flutterwave';
import { generateReference } from '@/lib/utils';
import { sendTransactionEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const MIN_FUNDING = 100;
const MAX_FUNDING = 10000000;

function validateAmount(amount: unknown): { valid: boolean; message: string } {
  if (amount === undefined || amount === null) {
    return { valid: false, message: 'Amount is required' };
  }
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, message: 'Invalid amount format' };
  }
  if (amount < MIN_FUNDING) {
    return { valid: false, message: `Minimum funding amount is NGN ${MIN_FUNDING.toLocaleString()}` };
  }
  if (amount > MAX_FUNDING) {
    return { valid: false, message: `Maximum funding amount is NGN ${MAX_FUNDING.toLocaleString()}` };
  }
  return { valid: true, message: 'Valid' };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id!;
    const body = await request.json();
    const { amount, verify } = body;

    if (verify) {
      console.log('[FUND] Verifying payment:', verify);
      
      const result = await verifyPayment(verify);
      
      if (!result.success) {
        console.log('[FUND] Payment verification failed:', result.status);
        return NextResponse.json({
          success: false,
          verified: false,
          status: result.status || 'failed',
          message: 'Payment verification failed',
        });
      }

      const transaction = await prisma.transaction.findUnique({
        where: { reference: verify },
      });

      if (transaction && transaction.status === 'success') {
        console.log('[FUND] Transaction already credited:', verify);
        return NextResponse.json({
          success: true,
          verified: true,
          alreadyCredited: true,
          amount: result.amount,
          message: 'Payment already credited to wallet',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true },
      });

      const wallet = await prisma.wallet.findUnique({
        where: { userId_currency: { userId, currency: 'NGN' } },
      });

      if (!wallet) {
        console.error('[FUND] No NGN wallet found for user:', userId);
        return NextResponse.json({
          success: false,
          error: 'Wallet not found. Please contact support.',
        }, { status: 404 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: result.amount } },
        });

        if (transaction) {
          await tx.transaction.update({
            where: { id: transaction.id },
            data: { status: 'success' },
          });
        } else {
          await tx.transaction.create({
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
          });
        }

        await tx.activityLog.create({
          data: {
            userId,
            action: 'wallet.funded',
            entityType: 'transaction',
            entityId: verify,
            details: { amount: result.amount, reference: verify, source: 'flutterwave' },
          },
        });
      });

      if (user?.email) {
        await sendTransactionEmail(user.email, {
          type: 'Wallet Funding',
          amount: result.amount.toLocaleString(),
          currency: 'NGN',
          reference: verify,
          status: 'success',
        });
      }

      console.log('[FUND] Payment successfully credited:', verify, 'Amount:', result.amount);

      return NextResponse.json({
        success: true,
        verified: true,
        amount: result.amount,
        message: 'Payment successfully credited to wallet',
      });
    }

    const amountValidation = validateAmount(amount);
    if (!amountValidation.valid) {
      return NextResponse.json({ success: false, error: amountValidation.message }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
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

    const { paymentUrl, error: paymentError } = await createPaymentLink(userId, user.email, amount, reference);

    if (!paymentUrl) {
      console.error('[FUND] Failed to create payment link:', paymentError);
      await prisma.transaction.update({
        where: { reference },
        data: { status: 'failed', description: 'Failed to create payment link' },
      });
      return NextResponse.json({
        success: false,
        error: paymentError || 'Failed to create payment. Please try again.',
      }, { status: 500 });
    }

    console.log('[FUND] Payment link created:', reference, 'URL:', paymentUrl);

    return NextResponse.json({
      success: true,
      paymentUrl,
      reference,
      message: 'Payment link created. Complete payment to fund wallet.',
    });
  } catch (error) {
    console.error('[FUND] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ success: false, error: 'Reference required' }, { status: 400 });
    }

    const result = await verifyPayment(reference);
    
    return NextResponse.json({
      success: result.success,
      status: result.status,
      amount: result.amount,
    });
  } catch (error) {
    console.error('[FUND] Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}