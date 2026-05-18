import { PrismaClient } from '@prisma/client';
import { GiftCardCategory, GiftCardProduct, Transaction } from '@/types';
import { generateReference } from '@/lib/utils';
import { reloadlyService, ReloadlyOrderResponse } from '@/lib/services/reloadly';

const prisma = new PrismaClient();

const RELOADLY_BRAND_MAP: Record<string, number> = {
  'steam': 1,
  'playstation': 2,
  'xbox': 3,
  'nintendo': 4,
  'amazon': 5,
  'walmart': 6,
  'target': 7,
  'netflix': 8,
  'spotify': 9,
  'apple-music': 10,
  'google-play': 11,
  'itunes': 12,
  'robux': 13,
};

const DYNAMIC_FEES: Record<string, number> = {
  'steam': 5,
  'playstation': 5,
  'xbox': 5,
  'nintendo': 5,
  'amazon': 3,
  'walmart': 3,
  'target': 3,
  'netflix': 3,
  'spotify': 2,
  'apple-music': 2,
  'google-play': 4,
  'itunes': 4,
  'robux': 4,
  'fortnite': 5,
  'youtube': 3,
};

const GIFT_CARD_CATEGORIES: GiftCardCategory[] = [
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'gamepad-2',
    products: [
      { id: 'steam', categoryId: 'entertainment', name: 'Steam Gift Card', brand: 'Steam', minAmount: 5, maxAmount: 100, image: '/cards/steam.png', reloadlyId: 1 },
      { id: 'playstation', categoryId: 'entertainment', name: 'PlayStation Gift Card', brand: 'PlayStation', minAmount: 10, maxAmount: 100, image: '/cards/playstation.png', reloadlyId: 2 },
      { id: 'xbox', categoryId: 'entertainment', name: 'Xbox Gift Card', brand: 'Xbox', minAmount: 10, maxAmount: 100, image: '/cards/xbox.png', reloadlyId: 3 },
      { id: 'nintendo', categoryId: 'entertainment', name: 'Nintendo eShop', brand: 'Nintendo', minAmount: 10, maxAmount: 100, image: '/cards/nintendo.png', reloadlyId: 4 },
    ],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: 'shopping-bag',
    products: [
      { id: 'amazon', categoryId: 'shopping', name: 'Amazon Gift Card', brand: 'Amazon', minAmount: 10, maxAmount: 500, image: '/cards/amazon.png', reloadlyId: 5 },
      { id: 'walmart', categoryId: 'shopping', name: 'Walmart Gift Card', brand: 'Walmart', minAmount: 10, maxAmount: 500, image: '/cards/walmart.png', reloadlyId: 6 },
      { id: 'target', categoryId: 'shopping', name: 'Target Gift Card', brand: 'Target', minAmount: 10, maxAmount: 500, image: '/cards/target.png', reloadlyId: 7 },
    ],
  },
  {
    id: 'streaming',
    name: 'Streaming',
    icon: 'play',
    products: [
      { id: 'netflix', categoryId: 'streaming', name: 'Netflix Gift Card', brand: 'Netflix', minAmount: 10, maxAmount: 100, image: '/cards/netflix.png', reloadlyId: 8 },
      { id: 'spotify', categoryId: 'streaming', name: 'Spotify Gift Card', brand: 'Spotify', minAmount: 10, maxAmount: 100, image: '/cards/spotify.png', reloadlyId: 9 },
      { id: 'apple-music', categoryId: 'streaming', name: 'Apple Music', brand: 'Apple', minAmount: 10, maxAmount: 100, image: '/cards/apple.png', reloadlyId: 10 },
      { id: 'youtube', categoryId: 'streaming', name: 'YouTube Premium', brand: 'YouTube', minAmount: 10, maxAmount: 100, image: '/cards/youtube.png', reloadlyId: 11 },
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: 'gamepad',
    products: [
      { id: 'robux', categoryId: 'gaming', name: 'Robux', brand: 'Roblox', minAmount: 10, maxAmount: 100, image: '/cards/roblox.png', reloadlyId: 13 },
      { id: 'fortnite', categoryId: 'gaming', name: 'V-Bucks', brand: 'Fortnite', minAmount: 10, maxAmount: 100, image: '/cards/fortnite.png', reloadlyId: 14 },
      { id: 'google-play', categoryId: 'gaming', name: 'Google Play', brand: 'Google', minAmount: 10, maxAmount: 100, image: '/cards/google.png', reloadlyId: 11 },
      { id: 'itunes', categoryId: 'gaming', name: 'iTunes', brand: 'Apple', minAmount: 10, maxAmount: 100, image: '/cards/itunes.png', reloadlyId: 12 },
    ],
  },
];

export const ORDER_STATUS = {
  INITIATED: 'initiated',
  PROCESSING: 'processing',
  AUTO_FULFILLED: 'auto_fulfilled',
  MANUAL_QUEUE: 'manual_queue',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  FLAGGED: 'flagged',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export class HybridGiftCardService {
  private getFee(productId: string): number {
    return DYNAMIC_FEES[productId] || 3;
  }

  async getCategories(): Promise<GiftCardCategory[]> {
    return GIFT_CARD_CATEGORIES;
  }

  async getProducts(categoryId: string): Promise<GiftCardProduct[]> {
    const category = GIFT_CARD_CATEGORIES.find((c) => c.id === categoryId);
    return category?.products || [];
  }

  async getAllProducts(): Promise<GiftCardProduct[]> {
    const allProducts: GiftCardProduct[] = [];
    for (const category of GIFT_CARD_CATEGORIES) {
      allProducts.push(...category.products);
    }
    return allProducts;
  }

  async getProductById(productId: string): Promise<GiftCardProduct | undefined> {
    for (const category of GIFT_CARD_CATEGORIES) {
      const product = category.products.find((p) => p.id === productId);
      if (product) return product;
    }
    return undefined;
  }

  async buyGiftCard(userId: string, productId: string, amount: number): Promise<Transaction> {
    const foundProduct = await this.getProductById(productId);
    if (!foundProduct) throw new Error('Gift card not found');

    if (amount < foundProduct.minAmount || amount > foundProduct.maxAmount) {
      throw new Error(`Amount must be between ${foundProduct.minAmount} and ${foundProduct.maxAmount}`);
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: 'NGN' } },
    });
    if (!wallet) throw new Error('NGN wallet not found');

    const fee = (amount * this.getFee(productId)) / 100;
    const totalCost = amount + fee;
    const balance = Number(wallet.balance);

    if (balance < totalCost) throw new Error('Insufficient balance');

    const reference = generateReference();
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
          status: 'pending',
          reference,
          description: `Purchase ${foundProduct!.name}`,
          metadata: {
            productId,
            productName: foundProduct!.name,
            brand: foundProduct!.brand,
            cardAmount: amount,
            fee,
            category: foundProduct!.categoryId,
            orderStatus: ORDER_STATUS.INITIATED,
            deliveryType: 'pending',
          },
        },
      });
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'giftcard_order_created',
        entityType: 'transaction',
        entityId: transaction.id,
        details: {
          productId,
          productName: foundProduct.name,
          brand: foundProduct.brand,
          amount,
          totalCost,
          reference,
        },
      },
    });

    this.processOrder(transaction.id, foundProduct, amount, userId);

    return transaction as unknown as Transaction;
  }

  private async processOrder(
    transactionId: string,
    product: GiftCardProduct,
    amount: number,
    userId: string
  ): Promise<void> {
    try {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          metadata: {
            orderStatus: ORDER_STATUS.PROCESSING,
            processingAt: new Date().toISOString(),
          },
        },
      });

      const reloadlyProductId = (product as GiftCardProduct & { reloadlyId?: number }).reloadlyId;

      if (!reloadlyProductId || amount > 100) {
        await this.sendToManualQueue(transactionId, product, amount, userId);
        return;
      }

      try {
        const result = await Promise.race([
          reloadlyService.fulfillInstant(reloadlyProductId, amount),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
        ]) as { success: boolean; order?: ReloadlyOrderResponse; error?: string };

        if (result.success && result.order) {
          await this.completeWithCode(
            transactionId,
            result.order.pinDetail?.pin || result.order.transactionId,
            result.order.orderId.toString(),
            'auto'
          );
          return;
        }
      } catch (reloadlyError) {
        console.error('Reloadly fulfillment failed, sending to manual queue:', reloadlyError);
      }

      await this.sendToManualQueue(transactionId, product, amount, userId);
    } catch (error) {
      console.error('Order processing error:', error);
      await this.sendToManualQueue(transactionId, product, amount, userId);
    }
  }

  private async sendToManualQueue(
    transactionId: string,
    product: GiftCardProduct,
    amount: number,
    userId: string
  ): Promise<void> {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'pending',
        metadata: {
          orderStatus: ORDER_STATUS.MANUAL_QUEUE,
          queuedAt: new Date().toISOString(),
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'giftcard_sent_to_manual_queue',
        entityType: 'transaction',
        entityId: transactionId,
        details: {
          productName: product.name,
          amount,
        },
      },
    });
  }

  async fulfillOrder(transactionId: string, cardCode: string): Promise<void> {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'success',
        metadata: {
          cardCode,
          fulfilledAt: new Date().toISOString(),
          orderStatus: ORDER_STATUS.COMPLETED,
          fulfillmentType: 'manual',
        },
      },
    });

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (transaction) {
      await prisma.activityLog.create({
        data: {
          userId: transaction.userId,
          action: 'giftcard_fulfilled',
          entityType: 'transaction',
          entityId: transaction.id,
          details: { cardCode },
        },
      });
    }
  }

  private async completeWithCode(
    transactionId: string,
    cardCode: string,
    externalId: string,
    type: 'auto' | 'manual'
  ): Promise<void> {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'success',
        metadata: {
          cardCode,
          externalId,
          fulfilledAt: new Date().toISOString(),
          orderStatus: type === 'auto' ? ORDER_STATUS.AUTO_FULFILLED : ORDER_STATUS.COMPLETED,
          fulfillmentType: type,
        },
      },
    });

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (transaction) {
      await prisma.activityLog.create({
        data: {
          userId: transaction.userId,
          action: type === 'auto' ? 'giftcard_auto_fulfilled' : 'giftcard_fulfilled',
          entityType: 'transaction',
          entityId: transaction.id,
          details: { cardCode, externalId },
        },
      });
    }
  }

  async rejectOrder(transactionId: string, reason?: string): Promise<void> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) throw new Error('Transaction not found');

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId: transaction.userId, currency: 'NGN' } },
      });

      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: transaction.amount } },
        });
      }

      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'failed',
          metadata: {
            ...transaction.metadata as object,
            refundedAt: new Date().toISOString(),
            orderStatus: ORDER_STATUS.REFUNDED,
            refundReason: reason,
          },
        },
      });
    });

    await prisma.activityLog.create({
      data: {
        userId: transaction.userId,
        action: 'giftcard_refunded',
        entityType: 'transaction',
        entityId: transaction.id,
        details: { reason, amount: transaction.amount },
      },
    });
  }

  async flagOrder(transactionId: string, reason: string): Promise<void> {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        metadata: {
          orderStatus: ORDER_STATUS.FLAGGED,
          flaggedAt: new Date().toISOString(),
          flagReason: reason,
        },
      },
    });

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (transaction) {
      await prisma.activityLog.create({
        data: {
          userId: transaction.userId,
          action: 'giftcard_flagged',
          entityType: 'transaction',
          entityId: transaction.id,
          details: { reason },
        },
      });
    }
  }

  async getOrdersByStatus(status?: OrderStatus): Promise<Transaction[]> {
    const where = status
      ? { type: 'giftcard', metadata: { path: ['orderStatus'], equals: status } }
      : { type: 'giftcard' };

    return prisma.transaction.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
    }) as unknown as Transaction[];
  }

  async getPendingOrders(): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: {
        type: 'giftcard',
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Transaction[];
  }

  async getManualQueueOrders(): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: {
        type: 'giftcard',
        status: 'pending',
        metadata: { path: ['orderStatus'], equals: ORDER_STATUS.MANUAL_QUEUE,
      } as any,
      },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Transaction[];
  }

  async getCompletedOrders(): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: {
        type: 'giftcard',
        status: 'success',
      },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Transaction[];
  }

  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    manualQueue: number;
    completed: number;
    failed: number;
    flagged: number;
    totalAmount: number;
  }> {
    const all = await prisma.transaction.findMany({
      where: { type: 'giftcard' },
    });

    const pending = all.filter(t => t.status === 'pending');
    const completed = all.filter(t => t.status === 'success');
    const failed = all.filter(t => t.status === 'failed');

    let manualQueue = 0, flagged = 0;
    for (const t of all) {
      const meta = t.metadata as Record<string, unknown> | null;
      if (meta?.orderStatus === ORDER_STATUS.MANUAL_QUEUE) manualQueue++;
      if (meta?.orderStatus === ORDER_STATUS.FLAGGED) flagged++;
    }

    return {
      total: all.length,
      pending: pending.length,
      manualQueue,
      completed: completed.length,
      failed: failed.length,
      flagged,
      totalAmount: all.reduce((sum, t) => sum + Number(t.amount), 0),
    };
  }
}

export const hybridGiftCardService = new HybridGiftCardService();