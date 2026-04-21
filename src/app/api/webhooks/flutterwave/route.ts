import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/services/flutterwave';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('verif-hash');
    const payload = await request.text();

    if (!verifyWebhookSignature(signature || signature, payload)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(payload);
    
    if (data.event === 'charge.completed' && data.data.status === 'successful') {
      const txRef = data.data.tx_ref;
      const amount = parseFloat(data.data.amount);
      const userId = data.data.meta?.userId;

      if (!userId || !txRef) {
        return NextResponse.json({ error: 'Missing data' }, { status: 400 });
      }

      const transaction = await prisma.transaction.findUnique({
        where: { reference: txRef },
      });

      if (!transaction) {
        const wallet = await prisma.wallet.findFirst({
          where: { userId },
        });

        if (wallet) {
          await prisma.$transaction([
            prisma.wallet.update({
              where: { id: wallet.id },
              data: { balance: { increment: amount } },
            }),
            prisma.transaction.create({
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
            }),
          ]);
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}