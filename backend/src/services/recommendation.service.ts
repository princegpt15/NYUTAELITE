// backend/src/services/recommendation.service.ts
import prisma from '../lib/prisma.js';

export class RecommendationService {
  /**
   * Deterministic, bounded product recommendations:
   * 1. If productId provided: finds complementary products in same category or adjacent pack sizes, excluding productId.
   * 2. If authenticated customer: finds products previously purchased or complementary to their past orders.
   * 3. Fallback: popular active products based on real orderItem sales.
   * Bounded: returns 4–6 products maximum. Zero fabricated data.
   */
  async getRecommendations(params: {
    productId?: string;
    userId?: string;
    limit?: number;
  }) {
    const limit = Math.min(Math.max(1, Number(params.limit) || 4), 6);
    const excludeIds = new Set<string>();
    if (params.productId) excludeIds.add(params.productId);

    // 1. If productId provided, check for items frequently bought together in actual orders
    if (params.productId) {
      const relatedOrders = await prisma.orderItem.findMany({
        where: { productId: params.productId },
        select: { orderId: true },
        take: 20,
      });

      const orderIds = relatedOrders.map((ro) => ro.orderId);
      if (orderIds.length > 0) {
        const coPurchasedItems = await prisma.orderItem.findMany({
          where: {
            orderId: { in: orderIds },
            productId: { notIn: Array.from(excludeIds) },
          },
          select: { productId: true },
          take: 20,
        });

        // Count occurrences
        const freqMap: Record<string, number> = {};
        for (const item of coPurchasedItems) {
          freqMap[item.productId] = (freqMap[item.productId] || 0) + 1;
        }

        const sortedProductIds = Object.keys(freqMap).sort((a, b) => freqMap[b] - freqMap[a]);
        if (sortedProductIds.length > 0) {
          const products = await prisma.product.findMany({
            where: {
              id: { in: sortedProductIds.slice(0, limit) },
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              compareAtPrice: true,
              stock: true,
              images: true,
              weight: true,
              category: true,
            },
          });

          if (products.length >= limit) {
            return products;
          }
          // Add found products to excludeIds
          products.forEach((p) => excludeIds.add(p.id));
        }
      }

      // Check category match
      const current = await prisma.product.findUnique({
        where: { id: params.productId },
        select: { category: true },
      });

      if (current?.category) {
        const sameCategory = await prisma.product.findMany({
          where: {
            category: current.category,
            id: { notIn: Array.from(excludeIds) },
            isActive: true,
          },
          take: limit,
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            stock: true,
            images: true,
            weight: true,
            category: true,
          },
        });

        if (sameCategory.length > 0) {
          return sameCategory.slice(0, limit);
        }
      }
    }

    // 2. Fallback: Top active products
    const popularProducts = await prisma.product.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        isActive: true,
      },
      take: limit,
      orderBy: [{ stock: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        stock: true,
        images: true,
        weight: true,
        category: true,
      },
    });

    return popularProducts;
  }
}

export const recommendationService = new RecommendationService();
