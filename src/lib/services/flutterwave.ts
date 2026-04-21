import crypto from 'crypto';

const FLUTTERWAVE_BASE_URL = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';
const FLUTTERWAVE_CLIENT_ID = process.env.FLUTTERWAVE_CLIENT_ID;
const FLUTTERWAVE_CLIENT_SECRET = process.env.FLUTTERWAVE_CLIENT_SECRET;
const FLUTTERWAVE_ENCRYPTION_KEY = process.env.FLUTTERWAVE_ENCRYPTION_KEY;
const FLUTTERWAVE_SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH;

interface FlutterwaveToken {
  token: string;
  expiresAt: number;
}

let cachedToken: FlutterwaveToken | null = null;

async function getAuthToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  if (!FLUTTERWAVE_CLIENT_ID || !FLUTTERWAVE_CLIENT_SECRET) {
    throw new Error('Flutterwave credentials not configured');
  }

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
    throw new Error('Failed to get Flutterwave token');
  }

  const data = await response.json();
  cachedToken = {
    token: data.data,
    expiresAt: Date.now() + (60 * 60 * 1000),
  };

  return cachedToken.token;
}

export async function createPaymentLink(
  userId: string,
  email: string,
  amount: number,
  reference: string
): Promise<{ paymentUrl: string; reference: string }> {
  const token = await getAuthToken();

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
      redirect_url: `${process.env.NEXTAUTH_URL || 'https://clexpay.vercel.app'}/dashboard/wallet?funded=true`,
      customer: {
        email: email,
      },
      meta: {
        userId: userId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment link');
  }

  const data = await response.json();
  
  return {
    paymentUrl: data.data.link,
    reference: reference,
  };
}

export async function verifyPayment(reference: string): Promise<{
  success: boolean;
  amount: number;
  status: string;
}> {
  const token = await getAuthToken();

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
    return { success: false, amount: 0, status: 'failed' };
  }

  const data = await response.json();
  
  return {
    success: data.status === 'successful',
    amount: parseFloat(data.data.amount),
    status: data.status,
  };
}

export async function createBankTransfer(
  bankCode: string,
  accountNumber: string,
  amount: number,
  reference: string
): Promise<{ success: boolean; message: string }> {
  const token = await getAuthToken();

  try {
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
    
    if (data.status === 'success') {
      return { success: true, message: 'Transfer initiated successfully' };
    }
    
    return { success: false, message: data.message || 'Transfer failed' };
  } catch (error) {
    return { success: false, message: 'Transfer failed' };
  }
}

export async function getBanks(): Promise<Array<{ code: string; name: string }>> {
  return [
    { code: '044', name: 'Access Bank' },
    { code: '063', name: 'Bank of Agriculture' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '214', name: 'First City Monument Bank' },
    { code: '058', name: 'Guaranty Trust Bank' },
    { code: '070', name: 'Nigerian Union Bank' },
    { code: '232', name: 'Sterling Bank' },
    { code: '033', name: 'United Bank for Africa' },
    { code: '101', name: 'Unity Bank' },
    { code: '032', name: 'Union Bank of Nigeria' },
    { code: '076', name: 'Skye Bank' },
    { code: '039', name: 'Stanbic IBTC Bank' },
    { code: '601', name: 'Fina Bank' },
    { code: '050', name: 'Ecobank Bank' },
    { code: '084', name: 'Enterprise Bank' },
    { code: '014', name: 'African Development Bank' },
  ];
}

export function verifyWebhookSignature(
  signature: string,
  payload: string
): boolean {
  if (!FLUTTERWAVE_SECRET_HASH) return true;
  
  const hash = crypto
    .createHash('sha256')
    .update(payload + FLUTTERWAVE_SECRET_HASH)
    .digest('hex');
  
  return hash === signature;
}

export { getAuthToken };