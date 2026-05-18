import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getApiErrors, resolveApiError, getErrorStats } from '@/lib/api-error-logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const resolved = searchParams.get('resolved');
    const endpoint = searchParams.get('endpoint');

    const result = await getApiErrors({
      page,
      limit,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
      endpoint: endpoint || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result.errors,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get API errors error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get errors' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { errorId } = body;

    if (!errorId) {
      return NextResponse.json({ success: false, error: 'Error ID required' }, { status: 400 });
    }

    const resolved = await resolveApiError(errorId, (session.user as { email?: string }).email || 'admin');

    if (!resolved) {
      return NextResponse.json({ success: false, error: 'Error not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Error marked as resolved',
    });
  } catch (error) {
    console.error('Resolve API error error:', error);
    return NextResponse.json({ success: false, error: 'Failed to resolve error' }, { status: 500 });
  }
}