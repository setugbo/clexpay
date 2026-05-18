import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { walletServiceFactory } from '@/lib/services/factory';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as { id?: string }).id!;
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency');

    const walletService = await walletServiceFactory();

    if (currency) {
      const wallet = await walletService.getWallet(userId, currency);
      return NextResponse.json({
        success: true,
        data: wallet,
      });
    }

    const wallets = await walletService.getWallets(userId);
    return NextResponse.json({
      success: true,
      data: wallets,
    });
  } catch (error) {
    console.error('Get wallets error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get wallets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as { id?: string }).id!;
    const body = await request.json();
    const { action, currency, amount, toEmail } = body;

    const walletService = await walletServiceFactory();

    let transaction;
    switch (action) {
      case 'fund':
        transaction = await walletService.fundWallet(userId, currency, amount);
        break;
      case 'withdraw':
        transaction = await walletService.withdraw(userId, currency, amount);
        break;
      case 'transfer':
        transaction = await walletService.transfer(userId, toEmail, currency, amount);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Wallet action error:', error);
    const message = error instanceof Error ? error.message : 'Action failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
