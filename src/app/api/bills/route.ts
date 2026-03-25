import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { billServiceFactory } from '@/lib/services/factory';

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
    const serviceId = searchParams.get('serviceId');

    const billService = await billServiceFactory();

    if (serviceId) {
      const products = await billService.getProducts(serviceId);
      return NextResponse.json({
        success: true,
        data: products,
      });
    }

    const services = await billService.getServices();
    return NextResponse.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Get bills error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get bills' },
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
    const { serviceId, productId, customerId } = body;

    if (!serviceId || !productId || !customerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const billService = await billServiceFactory();
    const transaction = await billService.payBill(userId, serviceId, productId, customerId);

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Pay bill error:', error);
    const message = error instanceof Error ? error.message : 'Payment failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
