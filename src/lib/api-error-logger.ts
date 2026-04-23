import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    await prisma.apiError.create({
      data: {
        endpoint,
        method,
        errorCode: options?.errorCode || 'UNKNOWN',
        errorMessage: errorMessage.substring(0, 1000),
        stackTrace: options?.stackTrace?.substring(0, 2000),
        requestData: options?.requestData || {},
        statusCode: options?.statusCode || 500,
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
  const where: Record<string, unknown> = {};

  if (options?.resolved !== undefined) {
    where.resolved = options.resolved;
  }
  if (options?.endpoint) {
    where.endpoint = { contains: options.endpoint };
  }

  const [errors, total] = await Promise.all([
    prisma.apiError.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.apiError.count({ where }),
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
    await prisma.apiError.update({
      where: { id: errorId },
      data: {
        resolved: true,
        resolvedBy,
        resolvedAt: new Date(),
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function getErrorStats() {
  const [total, unresolved, byEndpoint, byStatus] = await Promise.all([
    prisma.apiError.count(),
    prisma.apiError.count({ where: { resolved: false } }),
    prisma.apiError.groupBy({
      by: ['endpoint'],
      where: { resolved: false },
      _count: true,
      orderBy: { _count: { endpoint: 'desc' } },
      take: 10,
    }),
    prisma.apiError.groupBy({
      by: ['statusCode'],
      where: { resolved: false },
      _count: true,
    }),
  ]);

  return {
    total,
    unresolved,
    byEndpoint: byEndpoint.map((e) => ({ endpoint: e.endpoint, count: e._count })),
    byStatus: byStatus.map((s) => ({ statusCode: s.statusCode, count: s._count })),
  };
}