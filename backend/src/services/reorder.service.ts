// backend/src/services/reorder.service.ts
import prisma from '../lib/prisma.js';
import { CartService } from './cart.service.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';

export interface ReorderItemResult {
  productId: string;
  productName: string;
  quantity: number;
  currentPrice?: number;
  reason?: string;
  requestedQuantity?: number;
  adjustedQuantity?: number;
}

export class ReorderService {
  private cartService = new CartService();

  /**
   * Reorder an existing order:
   * 1. Verifies order ownership.
   * 2. Loads original OrderItems.
   * 3. Loads CURRENT active products from DB.
   * 4. Verifies CURRENT stock.
   * 5. Uses CURRENT authoritative prices (NEVER historical prices, coupons, or discounts).
   * 6. Populates current user's cart safely.
   * 7. NEVER creates an order or triggers a payment.
   */
  async reorder(userId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenError('Forbidden: Order does not belong to you');
    }

    if (!order.items || order.items.length === 0) {
      throw new BadRequestError('Previous order contains no items to reorder');
    }

    const added: ReorderItemResult[] = [];
    const unavailable: ReorderItemResult[] = [];
    const outOfStock: ReorderItemResult[] = [];
    const inactive: ReorderItemResult[] = [];
    const quantityAdjusted: ReorderItemResult[] = [];

    for (const item of order.items) {
      const currentProduct = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!currentProduct) {
        unavailable.push({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          reason: 'Product no longer exists in catalog',
        });
        continue;
      }

      if (!currentProduct.isActive) {
        inactive.push({
          productId: currentProduct.id,
          productName: currentProduct.name,
          quantity: item.quantity,
          reason: 'Product is currently inactive',
        });
        continue;
      }

      if (currentProduct.stock <= 0) {
        outOfStock.push({
          productId: currentProduct.id,
          productName: currentProduct.name,
          quantity: item.quantity,
          reason: 'Product is currently out of stock',
        });
        continue;
      }

      let quantityToAdd = item.quantity;
      if (currentProduct.stock < item.quantity) {
        quantityToAdd = currentProduct.stock;
        quantityAdjusted.push({
          productId: currentProduct.id,
          productName: currentProduct.name,
          quantity: quantityToAdd,
          requestedQuantity: item.quantity,
          adjustedQuantity: quantityToAdd,
          reason: `Only ${currentProduct.stock} units available in stock`,
        });
      }

      const primaryImage =
        Array.isArray(currentProduct.images) && currentProduct.images.length > 0
          ? String(currentProduct.images[0])
          : typeof currentProduct.images === 'string'
          ? currentProduct.images
          : undefined;

      // Add to cart with current authoritative price
      await this.cartService.addItem(userId, {
        productId: currentProduct.id,
        productName: currentProduct.name,
        quantity: quantityToAdd,
        price: currentProduct.price,
        mrp: currentProduct.compareAtPrice ?? currentProduct.price,
        image: primaryImage,
      });

      added.push({
        productId: currentProduct.id,
        productName: currentProduct.name,
        quantity: quantityToAdd,
        currentPrice: currentProduct.price,
      });
    }

    return {
      success: true,
      message:
        added.length > 0
          ? `Added ${added.length} product(s) to your cart with current prices.`
          : 'None of the requested products are currently available in stock.',
      summary: {
        added,
        unavailable,
        outOfStock,
        inactive,
        quantityAdjusted,
      },
    };
  }
}

export const reorderService = new ReorderService();
