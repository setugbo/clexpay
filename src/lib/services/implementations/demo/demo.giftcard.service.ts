import { IGiftCardService } from '../../interfaces/giftcard.service.interface';
import { GiftCardCategory, GiftCardProduct, Transaction } from '@/types';
import { generateReference } from '@/lib/utils';
import prisma from '@/lib/prisma';

const NGN_PER_USD = 1500;

const GIFT_CARD_CATEGORIES: GiftCardCategory[] = [
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'gamepad-2',
    products: [
      { id: 'steam', categoryId: 'entertainment', name: 'Steam Gift Card', brand: 'Steam', minAmount: 5, maxAmount: 100, image: '/cards/steam.png' },
      { id: 'playstation', categoryId: 'entertainment', name: 'PlayStation Gift Card', brand: 'PlayStation', minAmount: 10, maxAmount: 100, image: '/cards/playstation.png' },
      { id: 'xbox', categoryId: 'entertainment', name: 'Xbox Gift Card', brand: 'Xbox', minAmount: 10, maxAmount: 100, image: '/cards/xbox.png' },
      { id: 'nintendo', categoryId: 'entertainment', name: 'Nintendo eShop', brand: 'Nintendo', minAmount: 10, maxAmount: 100, image: '/cards/nintendo.png' },
    ],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: 'shopping-bag',
    products: [
      { id: 'amazon', categoryId: 'shopping', name: 'Amazon Gift Card', brand: 'Amazon', minAmount: 10, maxAmount: 500, image: '/cards/amazon.png' },
      { id: 'walmart', categoryId: 'shopping', name: 'Walmart Gift Card', brand: 'Walmart', minAmount: 10, maxAmount: 500, image: '/cards/walmart.png' },
      { id: 'target', categoryId: 'shopping', name: 'Target Gift Card', brand: 'Target', minAmount: 10, maxAmount: 500, image: '/cards/target.png' },
    ],
  },
  {
    id: 'streaming',
    name: 'Streaming',
    icon: 'play',
    products: [
      { id: 'netflix', categoryId: 'streaming', name: 'Netflix Gift Card', brand: 'Netflix', minAmount: 10, maxAmount: 100, image: '/cards/netflix.png' },
      { id: 'spotify', categoryId: 'streaming', name: 'Spotify Gift Card', brand: 'Spotify', minAmount: 10, maxAmount: 100, image: '/cards/spotify.png' },
      { id: 'apple-music', categoryId: 'streaming', name: 'Apple Music', brand: 'Apple', minAmount: 10, maxAmount: 100, image: '/cards/apple.png' },
      { id: 'youtube', categoryId: 'streaming', name: 'YouTube Premium', brand: 'YouTube', minAmount: 10, maxAmount: 100, image: '/cards/youtube.png' },
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: 'gamepad',
    products: [
      { id: 'robux', categoryId: 'gaming', name: 'Robux', brand: 'Roblox', minAmount: 10, maxAmount: 100, image: '/cards/roblox.png' },
      { id: 'fortnite', categoryId: 'gaming', name: 'V-Bucks', brand: 'Fortnite', minAmount: 10, maxAmount: 100, image: '/cards/fortnite.png' },
      { id: 'google-play', categoryId: 'gaming', name: 'Google Play', brand: 'Google', minAmount: 10, maxAmount: 100, image: '/cards/google.png' },
      { id: 'itunes', categoryId: 'gaming', name: 'iTunes', brand: 'Apple', minAmount: 10, maxAmount: 100, image: '/cards/itunes.png' },
    ],
  },
];

export class DemoGiftCardService implements IGiftCardService {
  private findProduct(productId: string): GiftCardProduct | undefined {
    for (const category of GIFT_CARD_CATEGORIES) {
      const product = category.products.find((p) => p.id === productId);
      if (product) return product;
    }
    return undefined;
  }

  async getCategories(): Promise<GiftCardCategory[]> {
    return GIFT_CARD_CATEGORIES;
  }

  async getProducts(categoryId: string): Promise<GiftCardProduct[]> {
    const category = GIFT_CARD_CATEGORIES.find((c) => c.id === categoryId);
    return category?.products || [];
  }

  /** Matches live API: USD face value + fee, total charged in NGN. */
  async calculatePrice(productId: string, usdAmount: number): Promise<{
    product: GiftCardProduct;
    usdAmount: number;
    fee: number;
    totalNgn: number;
    deliveryType: 'instant' | 'processing';
  }> {
    const product = this.findProduct(productId);
    if (!product) throw new Error('Product not found');
    const fee = (usdAmount * 2) / 100;
    const totalNgn = (usdAmount + fee) * NGN_PER_USD;
    return {
      product,
      usdAmount,
      fee,
      totalNgn,
      deliveryType: 'instant',
    };
  }

  async createOrder(userId: string, productId: string, usdAmount: number): Promise<{
    order: Transaction;
    deliveryType: 'instant' | 'processing';
  }> {
    const product = this.findProduct(productId);
    if (!product) throw new Error('Product not found');
    if (usdAmount < product.minAmount || usdAmount > product.maxAmount) {
      throw new Error(`Amount must be between $${product.minAmount} and $${product.maxAmount}`);
    }

    const { fee, totalNgn } = await this.calculatePrice(productId, usdAmount);
    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: 'NGN' } },
    });
    if (!wallet) throw new Error('Wallet not found');
    if (Number(wallet.balance) < totalNgn) throw new Error('Insufficient balance');

    const reference = generateReference();
    const demoCode = this.generateDemoCode();

    const order = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: totalNgn } },
      });

      return tx.transaction.create({
        data: {
          userId,
          type: 'giftcard',
          currency: 'NGN',
          amount: totalNgn,
          fee,
          status: 'success',
          reference,
          description: `Purchase ${product.name}`,
          metadata: {
            productId,
            productName: product.name,
            brand: product.brand,
            usdAmount,
            cardCode: demoCode,
            deliveryType: 'instant',
          },
        },
      });
    });

    return { order: order as unknown as Transaction, deliveryType: 'instant' };
  }

  async getOrderById(transactionId: string): Promise<Transaction | null> {
    const row = await prisma.transaction.findUnique({ where: { id: transactionId } });
    return row as unknown as Transaction | null;
  }

  async getUserOrders(userId: string): Promise<Transaction[]> {
    const rows = await prisma.transaction.findMany({
      where: { userId, type: 'giftcard' },
      orderBy: { createdAt: 'desc' },
    });
    return rows as unknown as Transaction[];
  }

  async buyGiftCard(userId: string, productId: string, amount: number): Promise<Transaction> {
    const foundProduct = this.findProduct(productId);
    if (!foundProduct) throw new Error('Gift card not found');

    const ngnAmount = amount;
    const usdAmount = ngnAmount / NGN_PER_USD;
    if (usdAmount < foundProduct.minAmount || usdAmount > foundProduct.maxAmount) {
      throw new Error(`Amount must be between $${foundProduct.minAmount} and $${foundProduct.maxAmount} (converted from NGN)`);
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: 'NGN' } },
    });
    if (!wallet) throw new Error('NGN wallet not found');

    const balance = Number(wallet.balance);
    const fee = (amount * 2) / 100;
    const totalCost = amount + fee;

    if (balance < totalCost) throw new Error('Insufficient balance');

    const reference = generateReference();
    const demoCode = this.generateDemoCode();

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: totalCost } },
      });

      return tx.transaction.create({
        data: {
          userId,
          type: 'giftcard',
          currency: 'NGN',
          amount: totalCost,
          fee,
          status: 'success',
          reference,
          description: `Purchase ${foundProduct!.name}`,
          metadata: {
            productId,
            productName: foundProduct!.name,
            brand: foundProduct!.brand,
            cardAmount: amount,
            cardCode: demoCode,
          },
        },
      });
    });

    return transaction as unknown as Transaction;
  }

  private generateDemoCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) code += '-';
    }
    return code;
  }
}
