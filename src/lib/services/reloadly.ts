const RELOADLY_API_URL = 'https://giftcards.reloadly.com';
const RELOADLY_AUTH_URL = 'https://auth.reloadly.com/oauth/token';

interface ReloadlyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ReloadlyProduct {
  productId: number;
  productName: string;
  brand: string;
  country: string;
  denominationType: string;
  min: number;
  max: number;
  fixedRecipientDenominations?: number[];
  recipientCurrencyCode: string;
  senderCurrencyCode: string;
}

interface ReloadlyOrderRequest {
  productId: number;
  recipientEmail?: string;
  customIdentifier?: string;
  quantity?: number;
  denomination?: number;
  unitPrice?: number;
}

interface ReloadlyOrderResponse {
  orderId: number;
  transactionId: string;
  status: 'SUCCESSFUL' | 'PENDING' | 'FAILED';
  pinDetail?: {
    pin: string;
    serial?: string;
    instructions?: string;
  };
  productName: string;
  customIdentifier?: string;
  amount: number;
  currencyCode: string;
  createdAt: string;
}

interface ReloadlyBalance {
  amount: number;
  currencyCode: string;
}

export class ReloadlyService {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.RELOADLY_CLIENT_ID || 'xtNP4b7OcRkh0QWF7Yobwzr6YLICj6sm';
    this.clientSecret = process.env.RELOADLY_CLIENT_SECRET || 'zYFBUoLZKX-tW96S0F8tjcQpD8w4JX-4RJosiSPI0anOufaCiBDO8oEVhTWjOhd';
  }

  async authenticate(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch(RELOADLY_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Reloadly auth failed: ${error}`);
    }

    const data: ReloadlyToken = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
    return this.accessToken;
  }

  async getProducts(): Promise<ReloadlyProduct[]> {
    const token = await this.authenticate();

    const response = await fetch(`${RELOADLY_API_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get products: ${error}`);
    }

    const data = await response.json();
    return data.content || data || [];
  }

  async getProductByBrand(brandName: string): Promise<ReloadlyProduct | null> {
    const products = await this.getProducts();
    const normalizedBrand = brandName.toLowerCase();
    return products.find(p => 
      p.brand.toLowerCase().includes(normalizedBrand) ||
      p.productName.toLowerCase().includes(normalizedBrand)
    ) || null;
  }

  async getBalance(): Promise<ReloadlyBalance> {
    const token = await this.authenticate();

    const response = await fetch(`${RELOADLY_API_URL}/accounts/balance`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get balance: ${error}`);
    }

    return response.json();
  }

  async createOrder(request: ReloadlyOrderRequest): Promise<ReloadlyOrderResponse> {
    const token = await this.authenticate();

    const response = await fetch(`${RELOADLY_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Order failed: ${error}`);
    }

    const data = await response.json();
    return {
      orderId: data.orderId,
      transactionId: data.transactionId,
      status: data.status,
      pinDetail: data.pinDetail,
      productName: data.productName,
      customIdentifier: data.customIdentifier,
      amount: data.amount,
      currencyCode: data.currencyCode,
      createdAt: data.createdAt,
    };
  }

  async fulfillInstant(productId: number, amount: number, recipientEmail?: string): Promise<{
    success: boolean;
    order?: ReloadlyOrderResponse;
    error?: string;
  }> {
    try {
      const order = await this.createOrder({
        productId,
        quantity: 1,
        denomination: amount,
        recipientEmail,
        customIdentifier: `CLEX-${Date.now()}`,
      });

      return {
        success: order.status === 'SUCCESSFUL',
        order,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getOrderStatus(orderId: number): Promise<{
    status: string;
    pinDetail?: { pin: string; serial?: string };
  }> {
    const token = await this.authenticate();

    const response = await fetch(`${RELOADLY_API_URL}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get order status`);
    }

    return response.json();
  }
}

export const reloadlyService = new ReloadlyService();