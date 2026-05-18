import { PrismaClient } from '@prisma/client';
import { IBillService } from '../../interfaces/bill.service.interface';
import { BillService, BillProduct, Transaction } from '@/types';
import { generateReference } from '@/lib/utils';

const prisma = new PrismaClient();

const BILL_SERVICES: BillService[] = [
  {
    id: 'airtime',
    name: 'Airtime',
    category: 'airtime',
    icon: 'smartphone',
    products: [
      { id: 'mtn-airtime', serviceId: 'airtime', name: 'MTN', code: 'MTN', amount: 0 },
      { id: 'airtel-airtime', serviceId: 'airtime', name: 'Airtel', code: 'AIRTEL', amount: 0 },
      { id: 'glo-airtime', serviceId: 'airtime', name: 'Glo', code: 'GLO', amount: 0 },
      { id: '9mobile-airtime', serviceId: 'airtime', name: '9mobile', code: 'ETISALAT', amount: 0 },
    ],
  },
  {
    id: 'data',
    name: 'Data',
    category: 'data',
    icon: 'wifi',
    products: [
      { id: 'mtn-data-1gb', serviceId: 'data', name: 'MTN 1GB', code: 'MTN', amount: 350 },
      { id: 'mtn-data-2gb', serviceId: 'data', name: 'MTN 2GB', code: 'MTN', amount: 700 },
      { id: 'mtn-data-5gb', serviceId: 'data', name: 'MTN 5GB', code: 'MTN', amount: 1500 },
      { id: 'airtel-data-1gb', serviceId: 'data', name: 'Airtel 1GB', code: 'AIRTEL', amount: 350 },
      { id: 'airtel-data-2gb', serviceId: 'data', name: 'Airtel 2GB', code: 'AIRTEL', amount: 700 },
      { id: 'glo-data-1gb', serviceId: 'data', name: 'Glo 1GB', code: 'GLO', amount: 350 },
      { id: '9mobile-data-1gb', serviceId: 'data', name: '9mobile 1GB', code: 'ETISALAT', amount: 300 },
    ],
  },
  {
    id: 'electricity',
    name: 'Electricity',
    category: 'electricity',
    icon: 'zap',
    products: [
      { id: 'eko-electricity', serviceId: 'electricity', name: 'EEDC (Eko)', code: 'EKEDC', amount: 0 },
      { id: 'ikeja-electricity', serviceId: 'electricity', name: 'IKEDC (Ikeja)', code: 'IKEDC', amount: 0 },
      { id: 'abuja-electricity', serviceId: 'electricity', name: 'AEDC (Abuja)', code: 'AEDC', amount: 0 },
      { id: 'port-harcourt-electricity', serviceId: 'electricity', name: 'PHED (Port Harcourt)', code: 'PHED', amount: 0 },
    ],
  },
  {
    id: 'cable',
    name: 'Cable TV',
    category: 'cable',
    icon: 'tv',
    products: [
      { id: 'dstv-pcompact', serviceId: 'cable', name: 'DStv Compact', code: 'DSTV', amount: 3700 },
      { id: 'dstv-pcompact-plus', serviceId: 'cable', name: 'DStv Compact Plus', code: 'DSTV', amount: 5800 },
      { id: 'dstv-premium', serviceId: 'cable', name: 'DStv Premium', code: 'DSTV', amount: 10500 },
      { id: 'gotv-jinja', serviceId: 'cable', name: 'GOtv Jinja', code: 'GOTV', amount: 800 },
      { id: 'gotv-jolly', serviceId: 'cable', name: 'GOtv Jolly', code: 'GOTV', amount: 1600 },
      { id: 'startimes-token', serviceId: 'cable', name: 'Startimes', code: 'STARTIMES', amount: 0 },
    ],
  },
  {
    id: 'betting',
    name: 'Betting',
    category: 'betting',
    icon: 'gamepad-2',
    products: [
      { id: 'bet9ja', serviceId: 'betting', name: 'Bet9ja', code: 'BET9JA', amount: 0 },
      { id: 'nairabet', serviceId: 'betting', name: 'Nairabet', code: 'NAIRABET', amount: 0 },
      { id: 'betking', serviceId: 'betting', name: 'BetKing', code: 'BETKING', amount: 0 },
    ],
  },
];

export class DemoBillService implements IBillService {
  async getServices(): Promise<BillService[]> {
    return BILL_SERVICES;
  }

  async getProducts(serviceId: string): Promise<BillProduct[]> {
    const service = BILL_SERVICES.find((s) => s.id === serviceId);
    return service?.products || [];
  }

  async payBill(userId: string, serviceId: string, productId: string, customerId: string): Promise<Transaction> {
    const service = BILL_SERVICES.find((s) => s.id === serviceId);
    if (!service) throw new Error('Service not found');

    const product = service.products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');

    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: 'NGN' } },
    });
    if (!wallet) throw new Error('NGN wallet not found');

    const amount = product.amount;
    if (amount > 0) {
      const balance = Number(wallet.balance);
      if (balance < amount) throw new Error('Insufficient balance');
    }

    const reference = generateReference();
    const fee = 100;

    const transaction = await prisma.$transaction(async (tx) => {
      if (amount > 0) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: amount + fee } },
        });
      }

      return tx.transaction.create({
        data: {
          userId,
          type: 'bill',
          subtype: service.category,
          currency: 'NGN',
          amount: amount + fee,
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
          },
        },
      });
    });

    return transaction as unknown as Transaction;
  }
}
