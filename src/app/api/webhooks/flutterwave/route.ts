import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/services/flutterwave';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('verif-hash') || '';
    const payload = await request.text();

    if (!verifyWebhookSignature(signature, payload)) {
      console.error('[WEBHOOK] Invalid signature received');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(payload);
    
    console.log('[WEBHOOK] Received event:', data.event, 'Status:', data.data?.status);

    if (data.event === 'charge.completed' && data.data.status === 'successful') {
      const txRef = data.data.tx_ref;
      const amount = parseFloat(data.data.amount);
      const userId = data.data.meta?.userId;

      if (!userId || !txRef) {
        console.error('[WEBHOOK] Missing userId or txRef', { userId, txRef });
        return NextResponse.json({ error: 'Missing data' }, { status: 400 });
      }

      const existingTransaction = await prisma.transaction.findUnique({
        where: { reference: txRef },
      });

      if (existingTransaction && existingTransaction.status === 'success') {
        console.log('[WEBHOOK] Transaction already processed:', txRef);
        return NextResponse.json({ status: 'already_processed' });
      }

      const wallet = await prisma.wallet.findFirst({
        where: { userId, currency: 'NGN' },
      });

      if (!wallet) {
        console.error('[WEBHOOK] No NGN wallet found for user:', userId);
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amount } },
        });

        if (existingTransaction) {
          await tx.transaction.update({
            where: { id: existingTransaction.id },
            data: { status: 'success' },
          });
        } else {
          await tx.transaction.create({
            data: {
              userId,
              type: 'deposit',
              currency: 'NGN',
              amount,
              fee: 0,
              status: 'success',
              reference: txRef,
              description: 'Wallet funding via Flutterwave',
            },
          });
        }

        await tx.activityLog.create({
          data: {
            userId,
            action: 'wallet.funded_via_webhook',
            entityType: 'transaction',
            entityId: txRef,
            details: { amount, reference: txRef, source: 'flutterwave' },
          },
        });
      });

      console.log('[WEBHOOK] Successfully processed payment:', txRef, 'Amount:', amount);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[WEBHOOK] Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}