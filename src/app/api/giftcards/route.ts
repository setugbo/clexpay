import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { giftCardServiceFactory } from '@/lib/services/factory';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const giftCardService = await giftCardServiceFactory();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const orderId = searchParams.get('orderId');

    if (categoryId) {
      const products = await giftCardService.getProducts(categoryId);
      return NextResponse.json({ success: true, data: products });
    }

    if (orderId) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const order = await giftCardService.getOrderById(orderId);
      if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: order });
    }

    const categories = await giftCardService.getCategories();
    if (!categories || categories.length === 0) {
      return NextResponse.json({ success: false, error: 'No categories available' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: true, data: categories });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ success: true, data: categories });
    }
    const orders = await giftCardService.getUserOrders(userId);
    return NextResponse.json({ success: true, data: { categories, orders } });
  } catch (error) {
    console.error('Get giftcards error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get gift cards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const giftCardService = await giftCardServiceFactory();
    const userId = (session.user as { id?: string }).id!;
    const body = await request.json();
    const { productId, amount, calculateOnly } = body;

    if (!productId || !amount) {
      return NextResponse.json({ success: false, error: 'Missing productId or amount' }, { status: 400 });
    }

    if (calculateOnly) {
      const price = await giftCardService.calculatePrice(productId, amount);
      return NextResponse.json({ success: true, data: price });
    }

    const result = await giftCardService.createOrder(userId, productId, amount);

    return NextResponse.json({
      success: true,
      data: {
        order: result.order,
        deliveryType: result.deliveryType,
        message: result.deliveryType === 'instant' 
          ? 'Gift card order placed! Processing...'
          : 'Gift card order placed! Will be delivered shortly.',
      },
    });
  } catch (error) {
    console.error('Buy giftcard error:', error);
    const message = error instanceof Error ? error.message : 'Purchase failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}