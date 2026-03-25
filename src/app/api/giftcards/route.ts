import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { giftCardServiceFactory } from '@/lib/services/factory';

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

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const giftCardService = await giftCardServiceFactory();

    if (categoryId) {
      const products = await giftCardService.getProducts(categoryId);
      return NextResponse.json({
        success: true,
        data: products,
      });
    }

    const categories = await giftCardService.getCategories();
    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get gift cards error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get gift cards' },
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
    const { productId, amount } = body;

    if (!productId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const giftCardService = await giftCardServiceFactory();
    const transaction = await giftCardService.buyGiftCard(userId, productId, amount);

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Buy gift card error:', error);
    const message = error instanceof Error ? error.message : 'Purchase failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
