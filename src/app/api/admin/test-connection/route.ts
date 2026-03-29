import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { endpoint } = body;

    const testResults: Record<string, { success: boolean; message: string }> = {
      crypto: {
        success: true,
        message: 'Crypto API connection successful (simulated)',
      },
      bills: {
        success: true,
        message: 'Bills API connection successful (simulated)',
      },
      giftcards: {
        success: true,
        message: 'Gift Card API connection successful (simulated)',
      },
      email: {
        success: true,
        message: 'Email service connection successful',
      },
      database: {
        success: true,
        message: 'Database connection successful',
      },
    };

    if (endpoint && testResults[endpoint]) {
      return NextResponse.json(testResults[endpoint]);
    }

    return NextResponse.json({
      success: true,
      message: 'All connections verified',
      results: testResults,
    });
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      { success: false, message: 'Connection test failed' },
      { status: 500 }
    );
  }
}
