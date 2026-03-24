import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cryptoServiceFactory } from '@/lib/services/factory';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const cryptoService = await cryptoServiceFactory();
    const rates = await cryptoService.getRates();

    return NextResponse.json({
      success: true,
      data: rates,
    });
  } catch (error) {
    console.error('Get rates error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get rates' },
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
    const { action, fromCurrency, toCurrency, amount } = body;

    const cryptoService = await cryptoServiceFactory();

    let transaction;
    switch (action) {
      case 'buy':
        transaction = await cryptoService.buyCrypto(userId, fromCurrency, toCurrency, amount);
        break;
      case 'sell':
        transaction = await cryptoService.sellCrypto(userId, fromCurrency, toCurrency, amount);
        break;
      case 'swap':
        transaction = await cryptoService.swapCrypto(userId, fromCurrency, toCurrency, amount);
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
    console.error('Crypto action error:', error);
    const message = error instanceof Error ? error.message : 'Action failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
