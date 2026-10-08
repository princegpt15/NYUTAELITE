// backend/src/services/growth/cartRecovery.service.ts
import crypto from 'crypto';
import prisma from '../../lib/prisma.js';
import { emailNotificationProvider } from '../notification/providers/email.provider.js';
import { customerPreferenceService } from './customerPreference.service.js';
import { env } from '../../config/env.js';

export const ABANDONED_CART_THRESHOLD_HOURS = 24;
export const MAX_RECOVERY_ATTEMPTS = 2;
export const RECOVERY_EXPIRY_DAYS = 7;

export interface CartRecoveryItemPreview {
  productId: string;
  productName: string;
  quantity: number;
  currentPrice: number;
  inStock: boolean;
}

export class CartRecoveryService {
  /**
   * Scan PostgreSQL database for eligible abandoned carts.
   * Cart must:
   * 1. Have authenticated userId.
   * 2. Have >= 1 item in cart.
   * 3. Have cart.updatedAt <= 24 hours ago.
   * 4. User has NOT placed a qualifying order after cart.updatedAt.
   * 5. User has not opted out of marketing emails.
   */
  public async detectEligibleCarts(thresholdHours = ABANDONED_CART_THRESHOLD_HOURS) {
    const thresholdDate = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
    const expiryDate = new Date(Date.now() - RECOVERY_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const carts = await prisma.cart.findMany({
      where: {
        updatedAt: {
          lte: thresholdDate,
          gte: expiryDate,
        },
        items: { some: {} },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            preferences: true,
            orders: {
              where: {
                status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
                paymentStatus: 'CAPTURED',
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { createdAt: true },
            },
          },
        },
        items: true,
        recoveries: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const eligible = [];

    for (const cart of carts) {
      if (!cart.user) continue;

      // Check if user has opted out of marketing
      if (cart.user.preferences && !cart.user.preferences.marketingEmailOptIn) {
        continue;
      }

      // Check if user placed an order after cart was last updated
      const latestOrder = cart.user.orders[0];
      if (latestOrder && latestOrder.createdAt >= cart.updatedAt) {
        // Customer already completed an order, cart is NOT abandoned
        continue;
      }

      const existingRecovery = cart.recoveries[0];
      if (existingRecovery) {
        if (
          existingRecovery.status === 'RECOVERED' ||
          existingRecovery.status === 'CANCELLED' ||
          existingRecovery.status === 'EXPIRED'
        ) {
          continue;
        }
        if (existingRecovery.attemptCount >= MAX_RECOVERY_ATTEMPTS) {
          continue;
        }
      }

      eligible.push(cart);
    }

    return eligible;
  }

  /**
   * Process eligible cart recoveries with bounded execution and strict idempotency.
   */
  public async processRecoveries(options: { maxLimit?: number; thresholdHours?: number; cartId?: string } = {}) {
    const limit = Math.min(100, Math.max(1, options.maxLimit || 20));
    let eligibleCarts = await this.detectEligibleCarts(options.thresholdHours);

    if (options.cartId) {
      eligibleCarts = eligibleCarts.filter((c) => c.id === options.cartId);
    }

    const results = {
      detected: eligibleCarts.length,
      processed: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      details: [] as Array<{ cartId: string; status: string; reason?: string }>,
    };

    for (const cart of eligibleCarts.slice(0, limit)) {
      results.processed++;

      const userId = cart.userId;
      const user = cart.user;
      if (!user) continue;

      // 1. Check frequency cap & marketing consent
      const eligibility = await customerPreferenceService.checkEligibility(userId, 'EMAIL');
      if (!eligibility.allowed) {
        results.skipped++;
        results.details.push({
          cartId: cart.id,
          status: 'SKIPPED',
          reason: eligibility.reason || 'FREQUENCY_CAP_EXCEEDED',
        });
        continue;
      }

      // 2. Find or create recovery record
      let recovery = cart.recoveries[0];
      const attemptNumber = (recovery?.attemptCount || 0) + 1;
      const idempotencyKey = `CART_RECOVERY:${cart.id}:${attemptNumber}`;

      if (!recovery) {
        recovery = await prisma.cartRecovery.create({
          data: {
            cartId: cart.id,
            userId,
            status: 'ELIGIBLE',
            attemptCount: 0,
            recoveryToken: crypto.randomBytes(24).toString('hex'),
            idempotencyKey,
          },
        });
      } else {
        // Check wait interval between attempt 1 and attempt 2 (must be >= 24h)
        if (recovery.lastAttemptAt) {
          const hoursSinceLast = (Date.now() - recovery.lastAttemptAt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLast < 24) {
            results.skipped++;
            results.details.push({
              cartId: cart.id,
              status: 'SKIPPED',
              reason: 'MINIMUM_ATTEMPT_INTERVAL_NOT_MET',
            });
            continue;
          }
        }
      }

      // 3. Re-verify cart items against live database products (financial & stock safety)
      const productIds = cart.items.map((i) => i.productId);
      const liveProducts = await prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true },
      });
      const liveProductMap = new Map(liveProducts.map((p) => [p.id, p]));

      const validItems = cart.items.filter((i) => {
        const lp = liveProductMap.get(i.productId);
        return lp && lp.stock > 0;
      });

      if (validItems.length === 0) {
        // Items out of stock or inactive -> cancel recovery
        await prisma.cartRecovery.update({
          where: { id: recovery.id },
          data: { status: 'CANCELLED' },
        });
        results.skipped++;
        results.details.push({
          cartId: cart.id,
          status: 'CANCELLED',
          reason: 'ITEMS_OUT_OF_STOCK_OR_INACTIVE',
        });
        continue;
      }

      // 4. Construct safe recovery email
      const customerName = user.name || 'Makhana Lover';
      const recoveryToken = recovery.recoveryToken || crypto.randomBytes(24).toString('hex');
      const storeUrl = env.FRONTEND_URL || 'https://nutyaelite.com';
      const recoveryUrl = `${storeUrl}/cart?recovery=${recoveryToken}`;

      const subject = `Your artisanal Makhana is waiting for you, ${customerName}!`;
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #795548;">NYUTA ELITE MAKHANA</h2>
          <p>Hi ${escapeHtml(customerName)},</p>
          <p>We noticed you left some delicious items in your cart. Stock is limited, and fresh batches are packing quickly.</p>
          <div style="background: #fbf8f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Items in your cart:</p>
            <ul style="margin: 0; padding-left: 20px;">
              ${validItems.map((i) => `<li>${escapeHtml(i.productName)} (Qty: ${i.quantity})</li>`).join('')}
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${recoveryUrl}" style="background: #4a2c11; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Complete Your Order Now
            </a>
          </div>
          <p style="font-size: 12px; color: #888;">
            Prices and stock are revalidated in real-time upon returning. If you no longer wish to receive reminder emails, you can update your preferences in your account settings.
          </p>
        </div>
      `;

      // 5. Send message via notification provider
      const deliveryResult = await emailNotificationProvider.send({
        notificationId: recovery.id,
        orderId: cart.id,
        orderNumber: `CART-${cart.id.slice(0, 8)}`,
        type: 'ORDER_PROCESSING' as any,
        channel: 'EMAIL',
        recipient: user.email,
        subject,
        html,
        text: `Your artisanal Makhana is waiting! Complete your order: ${recoveryUrl}`,
      });

      if (deliveryResult.success) {
        await prisma.cartRecovery.update({
          where: { id: recovery.id },
          data: {
            status: 'CONTACTED',
            attemptCount: attemptNumber,
            lastAttemptAt: new Date(),
            idempotencyKey,
            recoveryToken,
          },
        });
        results.sent++;
        results.details.push({ cartId: cart.id, status: 'SENT' });
      } else {
        results.failed++;
        results.details.push({
          cartId: cart.id,
          status: 'FAILED',
          reason: deliveryResult.message || 'DELIVERY_FAILED',
        });
      }
    }

    return results;
  }

  /**
   * Validate recovery token and revalidate cart against current live database pricing and stock.
   * FINANCIAL & INVENTORY AUTHORITY REMAINS POSTGRESQL PRODUCT TABLE.
   */
  public async restoreAndRevalidateCart(token: string) {
    if (!token || typeof token !== 'string') {
      return { success: false, message: 'Invalid recovery token' };
    }

    const recovery = await prisma.cartRecovery.findUnique({
      where: { recoveryToken: token },
      include: {
        cart: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!recovery || !recovery.cart) {
      return { success: false, message: 'Cart recovery record not found' };
    }

    const cart = recovery.cart;
    const productIds = cart.items.map((i) => i.productId);

    // Fetch authoritative product rows
    const liveProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(liveProducts.map((p) => [p.id, p]));

    const revalidatedItems = [];
    let hasPriceChanges = false;
    let hasStockIssues = false;

    for (const item of cart.items) {
      const liveProduct = productMap.get(item.productId);

      if (!liveProduct || !liveProduct.isActive || liveProduct.stock <= 0) {
        hasStockIssues = true;
        continue;
      }

      // Check if price changed since abandonment
      if (liveProduct.price !== item.price) {
        hasPriceChanges = true;
        // Update cart item with authoritative database price
        await prisma.cartItem.update({
          where: { id: item.id },
          data: {
            price: liveProduct.price,
            mrp: liveProduct.compareAtPrice,
          },
        });
      }

      const clampedQty = Math.min(item.quantity, liveProduct.stock);
      if (clampedQty !== item.quantity) {
        hasStockIssues = true;
        await prisma.cartItem.update({
          where: { id: item.id },
          data: { quantity: clampedQty },
        });
      }

      revalidatedItems.push({
        id: item.id,
        productId: item.productId,
        productName: liveProduct.name,
        quantity: clampedQty,
        price: liveProduct.price,
        mrp: liveProduct.compareAtPrice,
      });
    }

    return {
      success: true,
      cartId: cart.id,
      userId: recovery.userId,
      items: revalidatedItems,
      notice: hasPriceChanges
        ? 'Some item prices were updated to match current catalog pricing.'
        : hasStockIssues
        ? 'Some quantities were adjusted to available stock.'
        : null,
    };
  }

  /**
   * Stop condition: When customer places an order, mark pending cart recoveries as RECOVERED.
   */
  public async markRecoveredIfOrderPlaced(userId: string, orderId?: string) {
    await prisma.cartRecovery.updateMany({
      where: {
        userId,
        status: { in: ['ELIGIBLE', 'CONTACTED'] },
      },
      data: {
        status: 'RECOVERED',
        recoveredAt: new Date(),
        ...(orderId ? { recoveredOrderId: orderId } : {}),
      },
    });
  }
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const cartRecoveryService = new CartRecoveryService();
