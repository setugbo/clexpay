import { BillService, BillProduct, Transaction } from '@/types';
import { generateReference } from '@/lib/utils';
import { PrismaClient } from '@prisma/client';
import { buyBill as vtpassBuyBill, getServices as vtpassGetServices, isVtpassConfigured, getServiceName } from '@/lib/services/vtpass';

const prisma = new PrismaClient();

const BILL_SERVICES: BillService[] = [
  {
    id: 'airtime',
    name: 'Airtime',
    category: 'airtime',
    icon: 'smartphone',
    products: [
      { id: 'mtn-airtime', serviceId: 'airtime', name: 'MTN', code: 'mtn-airtime', amount: 0 },
      { id: 'airtel-airtime', serviceId: 'airtime', name: 'Airtel', code: 'airtel-airtime', amount: 0 },
      { id: 'glo-airtime', serviceId: 'airtime', name: 'Glo', code: 'glo-airtime', amount: 0 },
      { id: '9mobile-airtime', serviceId: 'airtime', name: '9mobile', code: '9mobile-airtime', amount: 0 },
    ],
  },
  {
    id: 'data',
    name: 'Data',
    category: 'data',
    icon: 'wifi',
    products: [
      { id: 'mtn-data-100', serviceId: 'data', name: 'MTN 100MB', code: 'mtn-data', amount: 100 },
      { id: 'mtn-data-500', serviceId: 'data', name: 'MTN 500MB', code: 'mtn-data', amount: 500 },
      { id: 'mtn-data-1gb', serviceId: 'data', name: 'MTN 1GB', code: 'mtn-data', amount: 1000 },
      { id: 'mtn-data-2gb', serviceId: 'data', name: 'MTN 2GB', code: 'mtn-data', amount: 2000 },
      { id: 'airtel-data-100', serviceId: 'data', name: 'Airtel 100MB', code: 'airtel-data', amount: 100 },
      { id: 'airtel-data-500', serviceId: 'data', name: 'Airtel 500MB', code: 'airtel-data', amount: 500 },
      { id: 'airtel-data-1gb', serviceId: 'data', name: 'Airtel 1GB', code: 'airtel-data', amount: 1000 },
      { id: 'glo-data-100', serviceId: 'data', name: 'Glo 100MB', code: 'glo-data', amount: 100 },
      { id: 'glo-data-500', serviceId: 'data', name: 'Glo 500MB', code: 'glo-data', amount: 500 },
      { id: 'glo-data-1gb', serviceId: 'data', name: 'Glo 1GB', code: 'glo-data', amount: 1000 },
      { id: '9mobile-data-100', serviceId: 'data', name: '9mobile 100MB', code: '9mobile-data', amount: 100 },
      { id: '9mobile-data-500', serviceId: 'data', name: '9mobile 500MB', code: '9mobile-data', amount: 500 },
      { id: '9mobile-data-1gb', serviceId: 'data', name: '9mobile 1GB', code: '9mobile-data', amount: 1000 },
    ],
  },
  {
    id: 'electricity',
    name: 'Electricity',
    category: 'electricity',
    icon: 'zap',
    products: [
      { id: 'eko-electricity', serviceId: 'electricity', name: 'EEDC (Eko)', code: 'ekeja-electric', amount: 0 },
      { id: 'ikeja-electricity', serviceId: 'electricity', name: 'IKEDC (Ikeja)', code: 'ikeja-electric', amount: 0 },
      { id: 'abuja-electricity', serviceId: 'electricity', name: 'AEDC (Abuja)', code: 'abuja-electric', amount: 0 },
      { id: 'phed-electricity', serviceId: 'electricity', name: 'PHED (Port Harcourt)', code: 'portharcourt-electric', amount: 0 },
      { id: 'jos-electricity', serviceId: 'electricity', name: 'JED (Jos)', code: 'jos-electric', amount: 0 },
      { id: 'kano-electricity', serviceId: 'electricity', name: 'KED (Kano)', code: 'kano-electric', amount: 0 },
    ],
  },
  {
    id: 'cable',
    name: 'Cable TV',
    category: 'cable',
    icon: 'tv',
    products: [
      { id: 'dstv-compact', serviceId: 'cable', name: 'DStv Compact', code: 'dstv', amount: 3700 },
      { id: 'dstv-compact-plus', serviceId: 'cable', name: 'DStv Compact Plus', code: 'dstv', amount: 5800 },
      { id: 'dstv-premium', serviceId: 'cable', name: 'DStv Premium', code: 'dstv', amount: 10500 },
      { id: 'gotv-jinja', serviceId: 'cable', name: 'GOtv Jinja', code: 'gotv', amount: 800 },
      { id: 'gotv-jolly', serviceId: 'cable', name: 'GOtv Jolly', code: 'gotv', amount: 1600 },
      { id: 'gotv-max', serviceId: 'cable', name: 'GOtv Max', code: 'gotv', amount: 2400 },
      { id: 'startimes', serviceId: 'cable', name: 'Startimes', code: 'startimes', amount: 500 },
    ],
  },
];

export class VtpassBillService {
  async getServices(): Promise<BillService[]> {
    if (isVtpassConfigured()) {
      try {
        const { services } = await vtpassGetServices();
        if (services && services.length > 0) {
          return services.map(s => ({
            id: s.serviceID,
            name: s.name,
            category: s.name.toLowerCase().includes('data') ? 'data' : 
                    s.name.toLowerCase().includes('airtime') ? 'airtime' :
                    s.name.toLowerCase().includes('electric') ? 'electricity' :
                    s.name.toLowerCase().includes('tv') || s.name.toLowerCase().includes('dstv') || s.name.toLowerCase().includes('gotv') ? 'cable' : 'other',
            icon: 'smartphone',
            products: s.variations.map(v => ({
              id: `${s.serviceID}:${v.variation_code}`,
              serviceId: s.serviceID,
              name: v.name,
              code: v.variation_code,
              amount: parseInt(v.amount) || 0,
            })),
          }));
        }
      } catch (error) {
        console.error('[BILLS] VTPass getServices error:', error);
      }
    }
    return BILL_SERVICES;
  }

  async getProducts(serviceId: string): Promise<BillProduct[]> {
    const service = BILL_SERVICES.find((s) => s.id === serviceId);
    if (service) {
      return service.products;
    }
    const servicesList = await this.getServices();
    const foundService = servicesList.find((s) => s.id === serviceId);
    return foundService?.products || [];
  }

  async payBill(userId: string, serviceId: string, productId: string, customerId: string, amount?: number): Promise<Transaction> {
    const service = BILL_SERVICES.find((s) => s.id === serviceId);
    if (!service) throw new Error('Service not found');

    const product = service.products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');

    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: 'NGN' } },
    });
    if (!wallet) throw new Error('NGN wallet not found');

    const billAmount = amount || product.amount;
    if (billAmount <= 0) throw new Error('Invalid bill amount');

    const fee = 100;
    const totalAmount = billAmount + fee;

    const balance = Number(wallet.balance);
    if (balance < totalAmount) throw new Error('Insufficient balance');

    const reference = generateReference();
    let billPaymentSuccess = false;
    let billResult: { success: boolean; message: string; data?: unknown } = { success: false, message: 'Not processed' };

    if (!isVtpassConfigured()) {
      throw new Error('Bill payment service is not configured. Please configure VTPass API credentials.');
    }

    try {
      console.log('[BILLS] Processing VTPass bill payment:', { serviceId, productCode: product.code, customerId, amount: billAmount });
      
      const parts = productId.split(':');
      const variationCode = parts.length > 1 ? parts[1] : product.code;
      
      billResult = await vtpassBuyBill(
        serviceId,
        customerId,
        variationCode,
        reference,
        billAmount
      );

      console.log('[BILLS] VTPass response:', billResult);
      billPaymentSuccess = billResult.success;
    } catch (error) {
      console.error('[BILLS] VTPass bill payment error:', error);
    }

    if (!billPaymentSuccess) {
      throw new Error(billResult.message || 'Bill payment failed. Please try again.');
    }

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: totalAmount } },
      });

      return tx.transaction.create({
        data: {
          userId,
          type: 'bill',
          subtype: service.category,
          currency: 'NGN',
          amount: totalAmount,
          fee,
          status: 'success',
          reference,
          description: `${product.name} payment for ${customerId}`,
          metadata: {
            serviceId,
            serviceName: service.name,
            productId,
            productName: product.name,
            customerId,
            billAmount,
            provider: 'vtpass',
          },
        },
      });
    });

    console.log('[BILLS] Bill payment successful:', reference);
    return transaction as unknown as Transaction;
  }

  async verifyPayment(reference: string): Promise<{ status: string; amount: number }> {
    return {
      status: 'success',
      amount: 0,
    };
  }
}

export const vtpassBillService = new VtpassBillService();