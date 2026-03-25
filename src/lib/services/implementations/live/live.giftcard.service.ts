import { IGiftCardService } from '../../interfaces/giftcard.service.interface';
import { GiftCardCategory, GiftCardProduct, Transaction } from '@/types';

export class LiveGiftCardService implements IGiftCardService {
  async getCategories(): Promise<GiftCardCategory[]> {
    throw new Error('Live gift card service not implemented yet. Configure API keys in admin settings.');
  }

  async getProducts(categoryId: string): Promise<GiftCardProduct[]> {
    throw new Error('Live gift card service not implemented yet. Configure API keys in admin settings.');
  }

  async buyGiftCard(userId: string, productId: string, amount: number): Promise<Transaction> {
    throw new Error('Live gift card service not implemented yet. Configure API keys in admin settings.');
  }
}
