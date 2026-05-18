import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cryptoServiceFactory } from '@/lib/services/factory';

export const dynamic = 'force-dynamic';

const VALID_CURRENCIES = ['BTC', 'ETH', 'USDT', 'NGN'];
const VALID_ACTIONS = ['buy', 'sell', 'swap'];

function validateAmount(amount: unknown): { valid: boolean; message: string } {
  if (amount === undefined || amount === null) {
    return { valid: false, message: 'Amount is required' };
  }
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, message: 'Amount must be a number' };
  }
  if (amount <= 0) {
    return { valid: false, message: 'Amount must be greater than 0' };
  }
  if (amount > 1000000000) {
    return { valid: false, message: 'Amount exceeds maximum allowed' };
  }
  return { valid: true, message: 'Valid' };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const cryptoService = await cryptoServiceFactory();
    const rates = await cryptoService.getRates();

    return NextResponse.json({
      success: true,
      data: {
        rates,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get rates error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get exchange rates' }, { status: 500 });
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
    const { action, fromCurrency, toCurrency, amount } = body;

    const errors: string[] = [];

    if (!action) errors.push('Action is required');
    if (!fromCurrency) errors.push('Source currency is required');
    if (!toCurrency) errors.push('Target currency is required');

    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: errors.join(', ') }, { status: 400 });
    }

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!VALID_CURRENCIES.includes(fromCurrency)) {
      return NextResponse.json(
        { success: false, error: `Invalid source currency. Must be one of: ${VALID_CURRENCIES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!VALID_CURRENCIES.includes(toCurrency)) {
      return NextResponse.json(
        { success: false, error: `Invalid target currency. Must be one of: ${VALID_CURRENCIES.join(', ')}` },
        { status: 400 }
      );
    }

    if (fromCurrency === toCurrency) {
      return NextResponse.json(
        { success: false, error: 'Source and target currencies cannot be the same' },
        { status: 400 }
      );
    }

    const amountValidation = validateAmount(amount);
    if (!amountValidation.valid) {
      return NextResponse.json({ success: false, error: amountValidation.message }, { status: 400 });
    }

    if (action === 'buy') {
      if (fromCurrency !== 'NGN') {
        return NextResponse.json(
          { success: false, error: 'To buy crypto, source currency must be NGN' },
          { status: 400 }
        );
      }
    }

    if (action === 'sell') {
      if (toCurrency !== 'NGN') {
        return NextResponse.json(
          { success: false, error: 'To sell crypto, target currency must be NGN' },
          { status: 400 }
        );
      }
    }

    const cryptoService = await cryptoServiceFactory();
    let transaction;

    try {
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
      }
    } catch (tradeError) {
      const message = tradeError instanceof Error ? tradeError.message : 'Trade failed';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${action.charAt(0).toUpperCase() + action.slice(1)} transaction completed`,
      data: transaction,
    });
  } catch (error) {
    console.error('Crypto action error:', error);
    return NextResponse.json({ success: false, error: 'Action failed. Please try again.' }, { status: 500 });
  }
}