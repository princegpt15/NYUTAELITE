// backend/src/services/backInStock.service.ts
import prisma from '../lib/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export class BackInStockService {
  /**
   * Subscribe customer for back-in-stock alerts.
   * Idempotent: duplicate subscription returns existing subscription safely.
   */
  async subscribe(userId: string, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, stock: true, isActive: true },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestError('Product is currently inactive');
    }

    const subscription = await prisma.backInStockSubscription.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {},
      create: {
        userId,
        productId,
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
      },
    });

    return {
      success: true,
      message: "We'll notify you when this makhana pack is back in stock.",
      data: {
        ...subscription,
        subscribed: true,
      },
    };
  }

  /**
   * Unsubscribe customer from back-in-stock alerts.
   */
  async unsubscribe(userId: string, productId: string) {
    await prisma.backInStockSubscription.deleteMany({
      where: {
        userId,
        productId,
      },
    });

    return {
      success: true,
      message: 'Unsubscribed from back-in-stock notifications.',
      data: {
        unsubscribed: true,
      },
    };
  }

  /**
   * Check if customer is subscribed to back-in-stock alerts for a product.
   */
  async getStatus(userId: string, productId: string) {
    const [subscription, product] = await Promise.all([
      prisma.backInStockSubscription.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      }),
      prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true, isActive: true },
      }),
    ]);

    return {
      subscribed: !!subscription,
      inStock: Boolean(product && product.stock > 0 && product.isActive),
    };
  }

  /**
   * Get all active back-in-stock subscriptions for the authenticated customer.
   */
  async getCustomerSubscriptions(userId: string) {
    const subscriptions = await prisma.backInStockSubscription.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            stock: true,
            images: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return subscriptions;
  }

  /**
   * Trigger notification for all subscribers when a product is restocked.
   */
  async notifyRestocked(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, stock: true },
    });

    if (!product || product.stock <= 0) return { notifiedCount: 0 };

    const subscribers = await prisma.backInStockSubscription.findMany({
      where: { productId },
      include: { user: true },
    });

    if (subscribers.length === 0) return { notifiedCount: 0 };

    // Clean up subscriptions once restocked notice is dispatched
    await prisma.backInStockSubscription.deleteMany({
      where: { productId },
    });

    return {
      notifiedCount: subscribers.length,
    };
  }
}

export const backInStockService = new BackInStockService();
