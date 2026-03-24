import { BillService, BillProduct, Transaction } from '@/types';

export interface IBillService {
  getServices(): Promise<BillService[]>;
  getProducts(serviceId: string): Promise<BillProduct[]>;
  payBill(userId: string, serviceId: string, productId: string, customerId: string): Promise<Transaction>;
}
