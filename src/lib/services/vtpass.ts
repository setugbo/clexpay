const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
const VTPASS_PUBLIC_KEY = process.env.VTPASS_PUBLIC_KEY;
const VTPASS_BASE_URL = process.env.VTPASS_BASE_URL || 'https://vtpass.com/api';

export function isVtpassConfigured(): boolean {
  return !!VTPASS_API_KEY;
}

interface Variations {
  variation_code: string;
  name: string;
  amount: string;
  fixed: boolean;
  min: string;
  max: string;
}

interface Service {
  serviceID: string;
  name: string;
  description: string;
  image: string;
  variations: Variations[];
}

export async function getServices(): Promise<{ services: Service[] }> {
  if (!VTPASS_API_KEY) {
    return { services: [] };
  }

  try {
    const response = await fetch(`${VTPASS_BASE_URL}/services`, {
      method: 'GET',
      headers: {
        'api-key': VTPASS_API_KEY,
        'public-key': VTPASS_PUBLIC_KEY || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.response_code === '000' && Array.isArray(data.content?.services)) {
      return {
        services: data.content.services,
      };
    }

    return { services: [] };
  } catch (error) {
    console.error('[VTPASS] getServices error:', error);
    return { services: [] };
  }
}

export async function buyBill(
  serviceId: string,
  phone: string,
  variationCode: string,
  reference: string,
  amount: number
): Promise<{
  success: boolean;
  message: string;
  data?: {
    requestId: string;
    amount: string;
    token?: string;
    products?: Array<{ name: string; code: string; description: string }>;
  };
}> {
  if (!VTPASS_API_KEY) {
    return { success: false, message: 'VTPass not configured' };
  }

  try {
    const response = await fetch(`${VTPASS_BASE_URL}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': VTPASS_API_KEY,
        'public-key': VTPASS_PUBLIC_KEY || '',
      },
      body: JSON.stringify({
        serviceID: serviceId,
        variation_code: variationCode,
        billers_code: phone,
        amount: amount,
        reference,
      }),
    });

    const data = await response.json();

    if (data.response_code === '000') {
      return {
        success: true,
        message: data.response_message || 'Bill payment successful',
        data: {
          requestId: data.content?.requestId || reference,
          amount: data.content?.amount || '0',
          token: data.content?.token,
          products: data.content?.products,
        },
      };
    }

    return {
      success: false,
      message: data.response_message || 'Bill payment failed',
    };
  } catch (error) {
    console.error('[VTPASS] buyBill error:', error);
    return { success: false, message: 'Bill payment failed' };
  }
}

export async function verifyTransaction(reference: string): Promise<{
  success: boolean;
  status: string;
  data?: {
    requestId: string;
    amount: string;
    transactionDate: string;
  };
}> {
  if (!VTPASS_API_KEY) {
    return { success: false, status: 'error' };
  }

  try {
    const response = await fetch(`${VTPASS_BASE_URL}/query-request-status/${reference}`, {
      method: 'GET',
      headers: {
        'api-key': VTPASS_API_KEY,
        'public-key': VTPASS_PUBLIC_KEY || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.response_code === '000') {
      return {
        success: true,
        status: data.content?.status || 'success',
        data: {
          requestId: data.content?.requestId,
          amount: data.content?.amount,
          transactionDate: data.content?.transaction_date,
        },
      };
    }

    return {
      success: false,
      status: data.content?.status || 'failed',
    };
  } catch (error) {
    console.error('[VTPASS] verifyTransaction error:', error);
    return { success: false, status: 'error' };
  }
}

export const BILL_CATEGORIES = [
  { id: 'airtime', name: 'Airtime', icon: 'phone' },
  { id: 'data', name: 'Data', icon: 'wifi' },
  { id: 'electricity', name: 'Electricity', icon: 'zap' },
  { id: 'tv', name: 'TV Subscription', icon: 'tv' },
  { id: 'education', name: 'Education', icon: 'graduation-cap' },
  { id: 'insurance', name: 'Insurance', icon: 'shield' },
];

export function getServiceName(serviceId: string): string {
  const serviceNames: Record<string, string> = {
    'mtn-data': 'MTN Data',
    'airtel-data': 'Airtel Data',
    'glo-data': 'Glo Data',
    '9mobile-data': '9mobile Data',
    'mtn-airtime': 'MTN Airtime',
    'airtel-airtime': 'Airtel Airtime',
    'glo-airtime': 'Glo Airtime',
    '9mobile-airtime': '9mobile Airtime',
    'ikeja-electric': 'Ikeja Electric',
    'eko-electric': 'Eko Electric',
    'jos-electric': 'Jos Electricity',
    'kano-electric': 'Kano Electric',
    'phed-electric': 'PHED',
    'startimes': 'StarTimes',
    'dstv': 'DSTV',
    'gotv': 'GOTV',
  };
  return serviceNames[serviceId] || serviceId;
}