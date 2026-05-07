import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { billServiceFactory } from '@/lib/services/factory';

export const dynamic = 'force-dynamic';

function validatePhoneNumber(phone: string): boolean {
  return /^0[789][01]\d{8}$/.test(phone);
}

function validateMeterNumber(meter: string): boolean {
  return /^\d{10,13}$/.test(meter);
}

function validateCardNumber(card: string): boolean {
  return /^\d{10,16}$/.test(card);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    const billService = await billServiceFactory();

    if (serviceId) {
      const products = await billService.getProducts(serviceId);
      return NextResponse.json({ success: true, data: products });
    }

    const services = await billService.getServices();
    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error('Get bills error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get bill services' }, { status: 500 });
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
    const { serviceId, productId, customerId, amount } = body;

    const errors: string[] = [];

    if (!serviceId) errors.push('Service ID is required');
    if (!productId) errors.push('Product ID is required');
    if (!customerId) errors.push('Customer ID (phone/meter/card) is required');

    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: errors.join(', ') }, { status: 400 });
    }

    const validServices = ['airtime', 'data', 'electricity', 'cable', 'betting'];
    if (!validServices.includes(serviceId)) {
      return NextResponse.json({ success: false, error: 'Invalid service type' }, { status: 400 });
    }

    let isValidCustomerId = false;
    switch (serviceId) {
      case 'airtime':
        isValidCustomerId = validatePhoneNumber(customerId);
        break;
      case 'data':
        isValidCustomerId = validatePhoneNumber(customerId);
        break;
      case 'electricity':
        isValidCustomerId = validateMeterNumber(customerId);
        break;
      case 'cable':
        isValidCustomerId = validateCardNumber(customerId);
        break;
      case 'betting':
        isValidCustomerId = customerId.length >= 5 && customerId.length <= 20;
        break;
    }

    if (!isValidCustomerId) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid ${serviceId === 'airtime' || serviceId === 'data' ? 'phone number' : serviceId === 'electricity' ? 'meter number' : 'card number'} format`,
        },
        { status: 400 }
      );
    }

    if (serviceId === 'airtime' || serviceId === 'data') {
      if (!amount || amount < 50 || amount > 50000) {
        return NextResponse.json(
          { success: false, error: 'Amount must be between NGN 50 and NGN 50,000' },
          { status: 400 }
        );
      }
    }

    const billService = await billServiceFactory();
    const transaction = await billService.payBill(userId, serviceId, productId, customerId, amount);

    return NextResponse.json({
      success: true,
      message: 'Payment successful',
      data: transaction,
    });
  } catch (error) {
    console.error('Pay bill error:', error);
    const message = error instanceof Error ? error.message : 'Payment failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}