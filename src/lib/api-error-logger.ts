import prisma from '@/lib/prisma';

export async function logApiError(
  endpoint: string,
  method: string,
  errorMessage: string,
  options?: {
    errorCode?: string;
    stackTrace?: string;
    requestData?: Record<string, unknown>;
    statusCode?: number;
  }
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action: 'api.error',
        entityType: 'api',
        entityId: options?.errorCode || 'UNKNOWN',
        details: {
          endpoint,
          method,
          errorMessage: errorMessage.substring(0, 500),
          statusCode: options?.statusCode || 500,
        } as object,
      },
    });
  } catch (logError) {
    console.error('[API_ERROR_LOG] Failed to log error:', logError);
  }
}

export async function getApiErrors(options?: {
  page?: number;
  limit?: number;
  resolved?: boolean;
  endpoint?: string;
}) {
  const page = options?.page || 1;
  const limit = Math.min(options?.limit || 50, 100);
  const where: Record<string, unknown> = {
    action: 'api.error',
  };

  if (options?.endpoint) {
    where.details = { endpoint: { contains: options.endpoint } };
  }

  const [errors, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    errors,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function resolveApiError(errorId: string, resolvedBy: string): Promise<boolean> {
  try {
    await prisma.activityLog.update({
      where: { id: errorId },
      data: {
        details: { resolved: true, resolvedBy, resolvedAt: new Date().toISOString() } as object,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function getErrorStats() {
  const total = await prisma.activityLog.count({ where: { action: 'api.error' } });

  return {
    total,
    unresolved: total,
    byEndpoint: [{ endpoint: 'api.error', count: total }],
  };
}