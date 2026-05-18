import prisma from '@/lib/prisma';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const defaults: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60 * 1000,
};

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: Partial<RateLimitConfig> = {}
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const { maxRequests, windowMs } = { ...defaults, ...config };
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);

  const record = await prisma.rateLimit.upsert({
    where: {
      identifier_endpoint_windowStart: {
        identifier,
        endpoint,
        windowStart,
      },
    },
    update: {
      count: { increment: 1 },
    },
    create: {
      identifier,
      endpoint,
      windowStart,
      count: 1,
    },
  });

  const allowed = record.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - record.count);
  const resetMs = windowStart.getTime() + windowMs - now.getTime();

  return { allowed, remaining, resetMs };
}

export function getRateLimitIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return `ip:${ip}`;
}
