import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SENSITIVE_FIELDS = ['password', 'passwordHash', 'otpCode', 'token', 'secret', 'apiKey', 'authorization'];

export function sanitizeRequestData(body: Record<string, unknown> | null): Record<string, unknown> {
  if (!body) return {};
  
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(body)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

export function withErrorLogging(
  handler: (request: NextRequest) => Promise<NextResponse>,
  endpoint: string
) {
  return async (request: NextRequest) => {
    const method = request.method;
    
    try {
      const response = await handler(request);
      return response;
    } catch (error) {
      console.error(`[API_ERROR] ${method} ${endpoint}:`, error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'An unexpected error occurred. Please try again.',
          code: 'INTERNAL_ERROR',
        },
        { status: 500 }
      );
    }
  };
}

export function withTransactionRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 100
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        resolve(result);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          console.log(`[TRANSACTION] Retry ${attempt}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    reject(lastError || new Error('Transaction failed after retries'));
  });
}

export const ERROR_CODES = {
  AUTH_001: { message: 'Invalid credentials', status: 401 },
  AUTH_002: { message: 'Account suspended', status: 403 },
  AUTH_003: { message: 'Email not verified', status: 403 },
  AUTH_004: { message: 'Session expired', status: 401 },
  
  WALLET_001: { message: 'Wallet not found', status: 404 },
  WALLET_002: { message: 'Insufficient balance', status: 400 },
  WALLET_003: { message: 'Invalid amount', status: 400 },
  WALLET_004: { message: 'Daily limit exceeded', status: 400 },
  
  TRANSFER_001: { message: 'Recipient not found', status: 404 },
  TRANSFER_002: { message: 'Cannot transfer to yourself', status: 400 },
  
  CRYPTO_001: { message: 'Invalid currency pair', status: 400 },
  CRYPTO_002: { message: 'Exchange rate unavailable', status: 503 },
  CRYPTO_003: { message: 'Crypto service unavailable', status: 503 },
  
  BILLS_001: { message: 'Invalid customer ID format', status: 400 },
  BILLS_002: { message: 'Service unavailable', status: 503 },
  BILLS_003: { message: 'Payment failed', status: 502 },
  
  GIFTCARD_001: { message: 'Product not found', status: 404 },
  GIFTCARD_002: { message: 'Invalid amount for product', status: 400 },
  GIFTCARD_003: { message: 'Order not found', status: 404 },
  
  PAYMENT_001: { message: 'Payment creation failed', status: 502 },
  PAYMENT_002: { message: 'Payment verification failed', status: 502 },
  PAYMENT_003: { message: 'Payment not completed', status: 400 },
  
  WEBHOOK_001: { message: 'Invalid webhook signature', status: 401 },
  WEBHOOK_002: { message: 'Webhook processing failed', status: 500 },
  
  ADMIN_001: { message: 'Admin access required', status: 403 },
  ADMIN_002: { message: 'Super admin access required', status: 403 },
  
  SYSTEM_001: { message: 'Database error', status: 500 },
  SYSTEM_002: { message: 'External API error', status: 502 },
  SYSTEM_003: { message: 'Rate limit exceeded', status: 429 },
  SYSTEM_004: { message: 'Invalid request', status: 400 },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export function createErrorResponse(code: ErrorCode, customMessage?: string) {
  const error = ERROR_CODES[code];
  return NextResponse.json(
    {
      success: false,
      error: customMessage || error.message,
      code,
    },
    { status: error.status }
  );
}