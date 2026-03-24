import { GiftCardCategory, GiftCardProduct, Transaction } from '@/types';

export interface IGiftCardService {
  getCategories(): Promise<GiftCardCategory[]>;
  getProducts(categoryId: string): Promise<GiftCardProduct[]>;
  buyGiftCard(userId: string, productId: string, amount: number): Promise<Transaction>;
}
