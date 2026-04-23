import crypto from 'crypto';

const FLUTTERWAVE_BASE_URL = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';
const FLUTTERWAVE_CLIENT_ID = process.env.FLUTTERWAVE_CLIENT_ID;
const FLUTTERWAVE_CLIENT_SECRET = process.env.FLUTTERWAVE_CLIENT_SECRET;
const FLUTTERWAVE_ENCRYPTION_KEY = process.env.FLUTTERWAVE_ENCRYPTION_KEY;
const FLUTTERWAVE_SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH;

interface Bank {
  id: string;
  code: string;
  name: string;
  longcode: string;
  active: boolean;
  country: string;
  currency: string;
  type: string;
}

interface FlutterwaveToken {
  token: string;
  expiresAt: number;
}

interface ApiError {
  code: string;
  message: string;
  status: number;
}

let cachedToken: FlutterwaveToken | null = null;
let cachedBanks: Bank[] | null = null;
let banksCacheTime = 0;
const BANKS_CACHE_DURATION = 60 * 60 * 1000;

function handleApiError(response: Response, context: string): never {
  const error: ApiError = {
    code: `FLUTTERWAVE_${response.status}`,
    message: `Flutterwave API error in ${context}: ${response.statusText}`,
    status: response.status,
  };
  console.error(`[FLUTTERWAVE] ${context} failed:`, error);
  throw new Error(error.message);
}

async function getAuthToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  if (!FLUTTERWAVE_CLIENT_ID || !FLUTTERWAVE_CLIENT_SECRET) {
    const error = 'Flutterwave credentials not configured';
    console.error('[FLUTTERWAVE] ' + error);
    throw new Error(error);
  }

  try {
    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/v3/payments/generators/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: FLUTTERWAVE_CLIENT_ID,
        client_secret: FLUTTERWAVE_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      handleApiError(response, 'getAuthToken');
    }

    const data = await response.json();
    
    if (!data.status || !data.data) {
      throw new Error('Invalid response from Flutterwave token endpoint');
    }

    cachedToken = {
      token: data.data,
      expiresAt: Date.now() + (60 * 60 * 1000),
    };

    console.log('[FLUTTERWAVE] Token refreshed successfully');
    return cachedToken.token;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Flutterwave')) {
      throw error;
    }
    console.error('[FLUTTERWAVE] Token fetch error:', error);
    throw new Error('Failed to authenticate with Flutterwave');
  }
}

export async function createPaymentLink(
  userId: string,
  email: string,
  amount: number,
  reference: string
): Promise<{ paymentUrl: string | null; reference: string; error?: string }> {
  try {
    const token = await getAuthToken();
    const redirectUrl = `${process.env.NEXTAUTH_URL || 'https://clexpay.vercel.app'}/dashboard/wallet?funded=true`;

    console.log('[FLUTTERWAVE] Creating payment link:', { userId, amount, reference, redirectUrl });

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/v3/payments/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount: amount.toString(),
        currency: 'NGN',
        redirect_url: redirectUrl,
        customer: {
          email: email,
        },
        meta: {
          userId: userId,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[FLUTTERWAVE] Payment link creation failed:', data);
      return {
        paymentUrl: null,
        reference,
        error: data.message || 'Failed to create payment link',
      };
    }

    if (data.status !== 'success' || !data.data?.link) {
      console.error('[FLUTTERWAVE] Payment link API returned error:', data);
      return {
        paymentUrl: null,
        reference,
        error: data.message || 'Failed to create payment link',
      };
    }

    console.log('[FLUTTERWAVE] Payment link created:', data.data.link);
    return {
      paymentUrl: data.data.link,
      reference,
    };
  } catch (error) {
    console.error('[FLUTTERWAVE] createPaymentLink error:', error);
    return {
      paymentUrl: null,
      reference,
      error: error instanceof Error ? error.message : 'Failed to create payment link',
    };
  }
}

export async function verifyPayment(reference: string): Promise<{
  success: boolean;
  amount: number;
  status: string;
  message?: string;
}> {
  try {
    const token = await getAuthToken();

    console.log('[FLUTTERWAVE] Verifying payment:', reference);

    const response = await fetch(
      `${FLUTTERWAVE_BASE_URL}/v3/transactions/verify_by_tx_ref/${reference}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error('[FLUTTERWAVE] Verify payment failed:', response.status);
      return { success: false, amount: 0, status: 'failed', message: 'Verification request failed' };
    }

    const data = await response.json();

    if (data.status === 'successful') {
      console.log('[FLUTTERWAVE] Payment verified:', reference, data.data.amount);
      return {
        success: true,
        amount: parseFloat(data.data.amount),
        status: 'successful',
      };
    }

    console.log('[FLUTTERWAVE] Payment not successful:', reference, data.status);
    return {
      success: false,
      amount: parseFloat(data.data?.amount || '0'),
      status: data.status || 'unknown',
      message: data.message || 'Payment not completed',
    };
  } catch (error) {
    console.error('[FLUTTERWAVE] verifyPayment error:', error);
    return { success: false, amount: 0, status: 'error', message: 'Verification failed' };
  }
}

export async function createBankTransfer(
  bankCode: string,
  accountNumber: string,
  amount: number,
  reference: string
): Promise<{ success: boolean; message: string; transferId?: string }> {
  try {
    const token = await getAuthToken();

    console.log('[FLUTTERWAVE] Creating bank transfer:', { bankCode, accountNumber, amount, reference });

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/v3/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        account_bank: bankCode,
        account_number: accountNumber,
        amount: amount.toString(),
        currency: 'NGN',
        tx_ref: reference,
        narration: 'Clexpay Withdrawal',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[FLUTTERWAVE] Bank transfer failed:', data);
      return {
        success: false,
        message: data.message || data.error || 'Failed to initiate transfer',
      };
    }

    if (data.status === 'success') {
      console.log('[FLUTTERWAVE] Bank transfer initiated:', data.data?.id);
      return {
        success: true,
        message: 'Transfer initiated successfully',
        transferId: data.data?.id,
      };
    }

    console.log('[FLUTTERWAVE] Bank transfer API error:', data);
    return {
      success: false,
      message: data.message || data.error || 'Transfer failed',
    };
  } catch (error) {
    console.error('[FLUTTERWAVE] createBankTransfer error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to initiate transfer',
    };
  }
}

export async function getBanks(): Promise<{ banks: Bank[]; error?: string }> {
  if (cachedBanks && banksCacheTime > Date.now() - BANKS_CACHE_DURATION) {
    return { banks: cachedBanks };
  }

  if (!FLUTTERWAVE_CLIENT_ID) {
    console.warn('[FLUTTERWAVE] API key not configured, returning fallback banks');
    return {
      banks: FALLBACK_BANKS,
      error: 'Flutterwave API key not configured - using cached list',
    };
  }

  try {
    const token = await getAuthToken();

    console.log('[FLUTTERWAVE] Fetching banks from API');

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/v3/banks/NG`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('[FLUTTERWAVE] Get banks failed:', response.status);
      return {
        banks: cachedBanks || FALLBACK_BANKS,
        error: `Failed to fetch banks: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (data.status === 'success' && Array.isArray(data.data)) {
      cachedBanks = data.data.filter((bank: Bank) => bank.active && bank.country === 'NG');
      banksCacheTime = Date.now();
      console.log('[FLUTTERWAVE] Banks cached:', cachedBanks.length);
      return { banks: cachedBanks };
    }

    return {
      banks: cachedBanks || FALLBACK_BANKS,
      error: 'Invalid response from banks API',
    };
  } catch (error) {
    console.error('[FLUTTERWAVE] getBanks error:', error);
    return {
      banks: cachedBanks || FALLBACK_BANKS,
      error: error instanceof Error ? error.message : 'Failed to fetch banks',
    };
  }
}

export function verifyWebhookSignature(
  signature: string,
  payload: string
): boolean {
  if (!FLUTTERWAVE_SECRET_HASH) {
    console.warn('[FLUTTERWAVE] Webhook verification disabled - FLUTTERWAVE_SECRET_HASH not set');
    return true;
  }
  
  const hash = crypto
    .createHash('sha256')
    .update(payload + FLUTTERWAVE_SECRET_HASH)
    .digest('hex');
  
  const isValid = hash === signature;
  
  if (!isValid) {
    console.warn('[FLUTTERWAVE] Invalid webhook signature received');
  }
  
  return isValid;
}

export { getAuthToken };

const FALLBACK_BANKS: Bank[] = [
  { id: '1', code: '044', name: 'Access Bank', longcode: '044', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '2', code: '011', name: 'First Bank of Nigeria', longcode: '011', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '3', code: '058', name: 'Guaranty Trust Bank', longcode: '058', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '4', code: '232', name: 'Sterling Bank', longcode: '232', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '5', code: '033', name: 'United Bank for Africa', longcode: '033', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '6', code: '032', name: 'Union Bank of Nigeria', longcode: '032', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '7', code: '039', name: 'Stanbic IBTC Bank', longcode: '039', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '8', code: '050', name: 'Ecobank Nigeria', longcode: '050', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '9', code: '070', name: 'Nigerian First Bank', longcode: '070', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '10', code: '076', name: 'Polaris Bank', longcode: '076', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '11', code: '214', name: 'First City Monument Bank', longcode: '214', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '12', code: '084', name: 'Nigerian Enterprise Bank', longcode: '084', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '13', code: '063', name: 'Bank of Agriculture', longcode: '063', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '14', code: '101', name: 'Unity Bank', longcode: '101', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '15', code: '023', name: 'Citi Bank Nigeria', longcode: '023', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '16', code: '035', name: 'Nigerian British Bank', longcode: '035', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '17', code: '057', name: 'Zenith Bank', longcode: '057', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '18', code: '075', name: 'Nigerian Commercial Bank', longcode: '075', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '19', code: '082', name: 'Nigerian Trust Bank', longcode: '082', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
  { id: '20', code: '000', name: 'Opay', longcode: '000', active: true, country: 'NG', currency: 'NGN', type: 'bank' },
];