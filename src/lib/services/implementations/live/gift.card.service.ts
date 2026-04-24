import { PrismaClient } from '@prisma/client';
import { GiftCardCategory, GiftCardProduct, Transaction } from '@/types';
import { generateReference } from '@/lib/utils';
import { reloadlyService } from '@/lib/services/reloadly';

const prisma = new PrismaClient();

const DYNAMIC_FEES: Record<string, number> = {
  'steam': 5, 'playstation': 5, 'xbox': 5, 'nintendo': 5,
  'amazon': 3, 'walmart': 3, 'target': 3,
  'netflix': 3, 'youtube': 3,
  'spotify': 2, 'apple-music': 2,
  'google-play': 4, 'itunes': 4, 'robux': 4, 'fortnite': 5,
};

const USDT_RATE = 1500;
const AUTO_THRESHOLD_NGN = 100000;
const MAX_AUTO_RETRY = 2;

export class GiftCardService {
  private getFee(productId: string, amount: number): number {
    const feePercent = DYNAMIC_FEES[productId] || 3;
    return Math.round(amount * feePercent) / 100;
  }

  private async convertUsdToNgn(usdAmount: number): Promise<number> {
    const rates = { USDT_NGN: USDT_RATE };
    return Math.round(usdAmount * rates.USDT_NGN);
  }

  private async checkRiskLevel(userId: string): Promise<{ level: string; canAuto: boolean }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { transactions: { where: { type: 'giftcard' } } },
    });

    if (!user) return { level: 'unknown', canAuto: false };

    const transactionCount = user.transactions.filter(t => t.status === 'success').length;
    const recentTransactions = user.transactions.filter(
      t => t.status === 'success' && new Date(t.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    if (transactionCount < 3 || recentTransactions > 10) {
      return { level: 'new', canAuto: false };
    }

    return { level: 'trusted', canAuto: true };
  }

  async getCategories(): Promise<GiftCardCategory[]> {
    return GIFT_CARD_CATEGORIES;
  }

  async getProducts(categoryId: string): Promise<GiftCardProduct[]> {
    const category = GIFT_CARD_CATEGORIES.find(c => c.id === categoryId);
    return category?.products || [];
  }

  async calculatePrice(productId: string, usdAmount: number): Promise<{
    product: GiftCardProduct;
    usdAmount: number;
    fee: number;
    totalNgn: number;
    deliveryType: 'instant' | 'processing';
  }> {
    const product = await this.getProductById(productId);
    if (!product) throw new Error('Product not found');

    const fee = this.getFee(productId, usdAmount);
    const totalNgn = await this.convertUsdToNgn(usdAmount + fee);

    return {
      product,
      usdAmount,
      fee,
      totalNgn,
      deliveryType: totalNgn > AUTO_THRESHOLD_NGN ? 'processing' : 'instant',
    };
  }

  private async getProductById(productId: string): Promise<GiftCardProduct | undefined> {
    for (const category of GIFT_CARD_CATEGORIES) {
      const product = category.products.find(p => p.id === productId);
      if (product) return product;
    }
    return undefined;
  }

  async createOrder(userId: string, productId: string, usdAmount: number): Promise<{
    order: Transaction;
    deliveryType: 'instant' | 'processing';
  }> {
    const product = await this.getProductById(productId);
    if (!product) throw new Error('Product not found');

    if (usdAmount < product.minAmount || usdAmount > product.maxAmount) {
      throw new Error(`Amount must be between $${product.minAmount} and $${product.maxAmount}`);
    }

    const fee = this.getFee(productId, usdAmount);
    const totalNgn = await this.convertUsdToNgn(usdAmount + fee);

    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency: 'NGN' } },
    });
    if (!wallet) throw new Error('Wallet not found');
    if (Number(wallet.balance) < totalNgn) throw new Error('Insufficient balance');

    const { level, canAuto } = await this.checkRiskLevel(userId);
    const deliveryType: 'instant' | 'processing' = totalNgn > AUTO_THRESHOLD_NGN || !canAuto ? 'processing' : 'instant';

    const reference = generateReference();

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
          status: 'pending',
          reference,
          description: `Purchase ${product.name}`,
          metadata: {
            productId,
            productName: product.name,
            brand: product.brand,
            usdAmount,
            fee,
            feePercent: DYNAMIC_FEES[productId] || 3,
            category: product.categoryId,
            orderStatus: ORDER_STATUS.INITIATED,
            deliveryMode: 'pending',
            deliveryType,
            userRiskLevel: level,
          },
        },
      });
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'giftcard_order_initiated',
        entityType: 'transaction',
        entityId: order.id,
        details: { productId, productName: product.name, usdAmount, totalNgn, deliveryType },
      },
    });

    this.processOrder(order.id, product, usdAmount, userId);

    return { order: order as unknown as Transaction, deliveryType };
  }

  private async processOrder(
    transactionId: string,
    product: GiftCardProduct,
    usdAmount: number,
    userId: string
  ): Promise<void> {
    try {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'pending',
          metadata: { orderStatus: ORDER_STATUS.PROCESSING } as any,
        },
      });

      const reloadlyId = (product as GiftCardProduct & { reloadlyId?: number }).reloadlyId;
      if (!reloadlyId) {
        await this.routeToManualQueue(transactionId, product, usdAmount, userId, 'No Reloadly ID');
        return;
      }

      for (let attempt = 1; attempt <= MAX_AUTO_RETRY; attempt++) {
        try {
          const result = await Promise.race([
            reloadlyService.fulfillInstant(reloadlyId, usdAmount),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000)),
          ]) as { success: boolean; order?: any; error?: string };

          if (result.success && result.order) {
            await this.completeOrder(
              transactionId,
              result.order.pinDetail?.pin || result.order.transactionId,
              result.order.orderId.toString(),
              'auto',
              userId
            );
            return;
          }

          console.log(`[GIFT] Reloadly attempt ${attempt} failed:`, result.error);
        } catch (error) {
          console.log(`[GIFT] Reloadly attempt ${attempt} error:`, error);
        }

        if (attempt < MAX_AUTO_RETRY) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      await this.routeToManualQueue(transactionId, product, usdAmount, userId, 'Reloadly failed after retries');
    } catch (error) {
      console.error('[GIFT] Process order error:', error);
      await this.routeToManualQueue(transactionId, product, usdAmount, userId, String(error));
    }
  }

  private async routeToManualQueue(
    transactionId: string,
    product: GiftCardProduct,
    usdAmount: number,
    userId: string,
    reason: string
  ): Promise<void> {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'pending',
        metadata: {
          orderStatus: ORDER_STATUS.MANUAL_QUEUE,
          deliveryMode: 'manual',
          routeReason: reason,
          queuedAt: new Date().toISOString(),
        } as any,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'giftcard_routed_to_manual_queue',
        entityType: 'transaction',
        entityId: transactionId,
        details: { productName: product.name, usdAmount, reason },
      },
    });
  }

  private async completeOrder(
    transactionId: string,
    cardCode: string,
    externalId: string,
    mode: 'auto' | 'manual',
    userId: string
  ): Promise<void> {
    const order = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'success',
        metadata: {
          orderStatus: ORDER_STATUS.COMPLETED,
          deliveryMode: mode,
          cardCode,
          externalId,
          completedAt: new Date().toISOString(),
        } as any,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: order.userId,
        action: mode === 'auto' ? 'giftcard_auto_completed' : 'giftcard_completed',
        entityType: 'transaction',
        entityId: transactionId,
        details: { cardCode, externalId },
      },
    });
  }

  async fulfillManualOrder(
    transactionId: string,
    cardCode: string,
    adminId: string
  ): Promise<void> {
    const order = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!order) throw new Error('Order not found');
    if (order.type !== 'giftcard') throw new Error('Invalid order type');

    const meta = order.metadata as Record<string, any> | null;
    if (meta?.orderStatus === ORDER_STATUS.COMPLETED) {
      throw new Error('Order already completed');
    }

    await this.completeOrder(transactionId, cardCode, `admin-${adminId}`, 'manual', order.userId);
  }

  async rejectOrder(transactionId: string, adminId: string, reason?: string): Promise<void> {
    const order = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!order) throw new Error('Order not found');

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId: order.userId, currency: 'NGN' } },
      });

      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: order.amount } },
        });
      }

      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'failed',
          metadata: {
            orderStatus: ORDER_STATUS.REFUNDED,
            refundReason: reason,
            refundedAt: new Date().toISOString(),
          } as any,
        },
      });
    });

    await prisma.activityLog.create({
      data: {
        userId: order.userId,
        action: 'giftcard_rejected_and_refunded',
        entityType: 'transaction',
        entityId: transactionId,
        details: { adminId, reason },
      },
    });
  }

  async flagOrder(transactionId: string, adminId: string, reason: string): Promise<void> {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        metadata: {
          orderStatus: ORDER_STATUS.FLAGGED,
          flagReason: reason,
          flaggedAt: new Date().toISOString(),
          flaggedBy: adminId,
        } as any,
      },
    });

    const order = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (order) {
      await prisma.activityLog.create({
        data: {
          userId: order.userId,
          action: 'giftcard_flagged',
          entityType: 'transaction',
          entityId: transactionId,
          details: { adminId, reason },
        },
      });
    }
  }

  async getOrderById(transactionId: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({ where: { id: transactionId } }) as unknown as Transaction;
  }

  async getUserOrders(userId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { userId, type: 'giftcard' },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Transaction[];
  }

  async getPendingOrders(): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { type: 'giftcard', status: 'pending' },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Transaction[];
  }

  async getManualQueueOrders(): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: {
        type: 'giftcard',
        status: 'pending',
        metadata: { path: ['orderStatus'], equals: ORDER_STATUS.MANUAL_QUEUE },
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
  }> {
    const all = await prisma.transaction.findMany({ where: { type: 'giftcard' } });
    const pending = all.filter(t => t.status === 'pending');
    const completed = all.filter(t => t.status === 'success');
    const failed = all.filter(t => t.status === 'failed');

    let manualQueue = 0, flagged = 0;
    for (const t of all) {
      const meta = t.metadata as Record<string, any> | null;
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
    };
  }
}

export const giftCardService = new GiftCardService();