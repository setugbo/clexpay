import { IBillService } from '../../interfaces/bill.service.interface';
import { BillService, BillProduct, Transaction } from '@/types';

export class LiveBillService implements IBillService {
  async getServices(): Promise<BillService[]> {
    throw new Error('Live bill service not implemented yet. Configure API keys in admin settings.');
  }

  async getProducts(serviceId: string): Promise<BillProduct[]> {
    throw new Error('Live bill service not implemented yet. Configure API keys in admin settings.');
  }

  async payBill(userId: string, serviceId: string, productId: string, customerId: string): Promise<Transaction> {
    throw new Error('Live bill service not implemented yet. Configure API keys in admin settings.');
  }
}
