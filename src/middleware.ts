import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = {
  auth: 10,
  default: 100,
  write: 30,
};

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.ip || 'unknown';
}

function isRateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (entry.count >= limit) {
    return true;
  }

  entry.count++;
  return false;
}

function getLimitForRoute(path: string): number {
  if (path.includes('/api/auth')) return RATE_LIMIT_MAX.auth;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].some(m => path.includes(m))) return RATE_LIMIT_MAX.write;
  return RATE_LIMIT_MAX.default;
}

setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetTime) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => rateLimitMap.delete(key));
}, RATE_LIMIT_WINDOW);

export function middleware(request: NextRequest) {
  const ip = getClientIP(request);
  const key = `${ip}:${request.nextUrl.pathname}`;
  const limit = getLimitForRoute(request.nextUrl.pathname);

  if (isRateLimited(key, limit)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000),
      },
      { status: 429 }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(limit - 1));

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};