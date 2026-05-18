import { GiftCardCategory, GiftCardProduct, Transaction } from '@/types';

export interface IGiftCardService {
  getCategories(): Promise<GiftCardCategory[]>;
  getProducts(categoryId: string): Promise<GiftCardProduct[]>;
  calculatePrice(productId: string, usdAmount: number): Promise<{
    product: GiftCardProduct;
    usdAmount: number;
    fee: number;
    totalNgn: number;
    deliveryType: 'instant' | 'processing';
  }>;
  createOrder(userId: string, productId: string, usdAmount: number): Promise<{
    order: Transaction;
    deliveryType: 'instant' | 'processing';
  }>;
  getOrderById(transactionId: string): Promise<Transaction | null>;
  getUserOrders(userId: string): Promise<Transaction[]>;
}
