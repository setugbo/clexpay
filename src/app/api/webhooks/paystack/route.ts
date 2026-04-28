import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PAYSTACK_SECRET_KEY } from '@/lib/services/paystack';
import { sendTransactionEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paystack-signature');
    const body = await request.text();

    // Verify webhook signature
    if (PAYSTACK_SECRET_KEY && signature) {
      const crypto = await import('crypto');
      const hash = crypto
        .createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(body)
        .digest('hex');

      if (hash !== signature) {
        console.error('[PAYSTACK-WEBHOOK] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const data = event.data;

    console.log('[PAYSTACK-WEBHOOK] Event:', eventType, 'Reference:', data?.reference);

    switch (eventType) {
      case 'charge.success':
        await handleSuccessfulPayment(data);
        break;

      case 'transfer.success':
        await handleSuccessfulTransfer(data);
        break;

      case 'transfer.failed':
        await handleFailedTransfer(data);
        break;

      default:
        console.log('[PAYSTACK-WEBHOOK] Unhandled event:', eventType);
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('[PAYSTACK-WEBHOOK] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSuccessfulPayment(data: { reference: string; amount: number; customer?: { email?: string } }) {
  const reference = data.reference;
  if (!reference) return;

  const transaction = await prisma.transaction.findFirst({
    where: { reference },
  });

  if (!transaction) {
    console.error('[PAYSTACK-WEBHOOK] Transaction not found:', reference);
    return;
  }

  if (transaction.status === 'success') {
    console.log('[PAYSTACK-WEBHOOK] Transaction already processed:', reference);
    return;
  }

  const userId = transaction.userId;
  const currency = transaction.currency || 'NGN';

  // Update transaction and credit wallet
  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: 'success' },
    });

    await tx.wallet.update({
      where: { userId_currency: { userId, currency } },
      data: { balance: { increment: transaction.amount } },
    });
  });

  // Send confirmation email
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.email) {
    await sendTransactionEmail(user.email, {
      type: 'Wallet Funded',
      amount: transaction.amount.toLocaleString(),
      currency: currency,
      reference,
      status: 'success',
    });
  }

  console.log('[PAYSTACK-WEBHOOK] Payment credited:', reference);
}

async function handleSuccessfulTransfer(data: { reference: string }) {
  const reference = data.reference;
  if (!reference) return;

  const transaction = await prisma.transaction.findFirst({
    where: { reference },
  });

  if (!transaction) return;

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: 'success' },
  });

  console.log('[PAYSTACK-WEBHOOK] Transfer completed:', reference);
}

async function handleFailedTransfer(data: { reference: string }) {
  const reference = data.reference;
  if (!reference) return;

  const transaction = await prisma.transaction.findFirst({
    where: { reference },
  });

  if (!transaction) return;

  const userId = transaction.userId;
  const currency = transaction.currency || 'NGN';

  // Refund the wallet
  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: 'failed' },
    });

    await tx.wallet.update({
      where: { userId_currency: { userId, currency } },
      data: { balance: { increment: transaction.amount } },
    });
  });

  console.log('[PAYSTACK-WEBHOOK] Transfer failed, wallet refunded:', reference);
}
