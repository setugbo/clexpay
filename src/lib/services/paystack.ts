const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_BASE_URL = process.env.PAYSTACK_URL || 'https://api.paystack.co';

export function isPaystackConfigured(): boolean {
  return !!PAYSTACK_SECRET_KEY;
}

export async function initializeTransaction(
  email: string,
  amount: number,
  reference: string,
  metadata?: Record<string, unknown>
): Promise<{ authorizationUrl: string; reference: string }> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack not configured');
  }

  const redirectUrl = `${process.env.NEXTAUTH_URL || 'https://clexpay.vercel.app'}/dashboard/wallet?funded=true`;

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      reference,
      callback_url: redirectUrl,
      metadata: {
        ...metadata,
        redirectUrl,
      },
    }),
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || 'Failed to initialize payment');
  }

  return {
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  };
}

export async function verifyTransaction(reference: string): Promise<{
  success: boolean;
  amount: number;
  status: string;
  message?: string;
}> {
  if (!PAYSTACK_SECRET_KEY) {
    return { success: false, amount: 0, status: 'error', message: 'Paystack not configured' };
  }

  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (data.status && data.data.status === 'success') {
      return {
        success: true,
        amount: data.data.amount / 100,
        status: 'success',
      };
    }

    return {
      success: false,
      amount: data.data?.amount ? data.data.amount / 100 : 0,
      status: data.data?.status || 'failed',
      message: data.message || 'Payment not completed',
    };
  } catch (error) {
    console.error('[PAYSTACK] verifyTransaction error:', error);
    return { success: false, amount: 0, status: 'error', message: 'Verification failed' };
  }
}

export async function createTransferRecipient(
  name: string,
  accountNumber: string,
  bankCode: string
): Promise<{ success: boolean; recipientCode?: string; message?: string }> {
  if (!PAYSTACK_SECRET_KEY) {
    return { success: false, message: 'Paystack not configured' };
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        type: 'nuban',
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    });

    const data = await response.json();

    if (data.status) {
      return {
        success: true,
        recipientCode: data.data.recipient_code,
      };
    }

    return {
      success: false,
      message: data.message || 'Failed to create transfer recipient',
    };
  } catch (error) {
    console.error('[PAYSTACK] createTransferRecipient error:', error);
    return { success: false, message: 'Failed to create transfer recipient' };
  }
}

export async function initiateTransfer(
  amount: number,
  recipientCode: string,
  reference: string,
  reason?: string
): Promise<{ success: boolean; message: string; transferId?: string }> {
  if (!PAYSTACK_SECRET_KEY) {
    return { success: false, message: 'Paystack not configured' };
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(amount * 100),
        recipient: recipientCode,
        reference,
        reason: reason || 'Clexpay Withdrawal',
      }),
    });

    const data = await response.json();

    if (data.status) {
      return {
        success: true,
        message: 'Transfer initiated successfully',
        transferId: data.data.transfer_id,
      };
    }

    return {
      success: false,
      message: data.message || 'Transfer failed',
    };
  } catch (error) {
    console.error('[PAYSTACK] initiateTransfer error:', error);
    return { success: false, message: 'Failed to initiate transfer' };
  }
}

export async function getBanks(): Promise<{ banks: Array<{ id: string; code: string; name: string }> }> {
  if (!PAYSTACK_SECRET_KEY) {
    return { banks: FALLBACK_BANKS };
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (data.status && Array.isArray(data.data)) {
      return {
        banks: data.data.map((b: { id: number; code: string; name: string }) => ({
          id: String(b.id),
          code: b.code,
          name: b.name,
        })),
      };
    }

    return { banks: FALLBACK_BANKS };
  } catch (error) {
    console.error('[PAYSTACK] getBanks error:', error);
    return { banks: FALLBACK_BANKS };
  }
}

const FALLBACK_BANKS = [
  { id: '1', code: '044', name: 'Access Bank' },
  { id: '2', code: '011', name: 'First Bank of Nigeria' },
  { id: '3', code: '058', name: 'Guaranty Trust Bank' },
  { id: '4', code: '232', name: 'Sterling Bank' },
  { id: '5', code: '033', name: 'United Bank for Africa' },
  { id: '6', code: '032', name: 'Union Bank of Nigeria' },
  { id: '7', code: '039', name: 'Stanbic IBTC Bank' },
  { id: '8', code: '050', name: 'Ecobank Nigeria' },
  { id: '9', code: '057', name: 'Zenith Bank' },
  { id: '10', code: '076', name: 'Polaris Bank' },
  { id: '11', code: '214', name: 'First City Monument Bank' },
  { id: '12', code: '023', name: 'Citi Bank Nigeria' },
  { id: '13', code: '000', name: 'Opay' },
];