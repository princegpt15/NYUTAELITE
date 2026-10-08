// backend/src/services/order.service.ts
import { OrderStatus, PaymentStatus, ShippingStatus } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { CartService } from './cart.service.js';
import {
  CouponService,
  toPaise,
  fromPaise,
  extractOrderCouponMeta,
  normalizeCouponCode,
} from './coupon.service.js';
import { generateOrderNumber } from '../utils/orderNumber.js';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors.js';
import { notificationService } from './notification/notification.service.js';
import { loyaltyService } from './loyalty.service.js';

export interface CreateOrderParams {
  addressId?: string;
  address?: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    landmark?: string;
    isDefault?: boolean;
  };
  couponCode?: unknown;
  redeemPoints?: number;
}

/**
 * Sanitize order record for customer-facing responses.
 * Exposes `couponCode` (if a coupon was applied) and `confirmationEmailSent` (when confirmed via notification state),
 * and strips internal `_couponMeta` and internal `notifications` records.
 */
function formatCustomerOrder<
  T extends { shippingAddress?: any; discountAmount?: number | null; notifications?: Array<{ type: string; status: string }> }
>(order: T | null): (Omit<T, 'notifications'> & { couponCode: string | null; loyaltyPointsRedeemed: number | null; confirmationEmailSent: boolean }) | null {
  if (!order) return null;
  const { cleanShippingAddress, couponMeta } = extractOrderCouponMeta(order.shippingAddress);
  let finalShippingAddress = cleanShippingAddress;
  let loyaltyPointsRedeemed: number | null = null;
  if (finalShippingAddress && typeof finalShippingAddress === 'object' && '_loyaltyMeta' in finalShippingAddress) {
    const { _loyaltyMeta, ...restAddr } = finalShippingAddress as any;
    loyaltyPointsRedeemed = _loyaltyMeta?.pointsRedeemed ?? null;
    finalShippingAddress = Object.keys(restAddr).length > 0 ? restAddr : null;
  }
  const { notifications, ...restOrder } = order as any;
  const confirmationEmailSent = Array.isArray(notifications)
    ? notifications.some((n) => n.type === 'ORDER_CONFIRMED' && n.status === 'SENT')
    : false;
  return {
    ...restOrder,
    discountAmount: Number(order.discountAmount || 0),
    shippingAddress: finalShippingAddress,
    couponCode: couponMeta?.couponCode || null,
    loyaltyPointsRedeemed,
    confirmationEmailSent,
  };
}

/** Service handling order creation, retrieval and cancellation */
export class OrderService {
  private cartService = new CartService();
  private couponService = new CouponService();

  /**
   * Create a new order from the authenticated user's cart.
   * Server validates cart, product availability, authoritative pricing, coupon rules, and stock.
   */
  async createOrder(userId: string, params: CreateOrderParams) {
    // 0. If couponCode was supplied, normalize & pre-validate syntax before touching DB
    const hasCouponInput =
      params.couponCode !== undefined &&
      params.couponCode !== null &&
      (typeof params.couponCode !== 'string' || params.couponCode.trim().length > 0);

    const normalizedCouponCode = hasCouponInput ? normalizeCouponCode(params.couponCode) : null;

    // 1. Resolve shipping address and create address snapshot
    let shippingAddressSnapshot: Record<string, any> | null = null;

    if (params.addressId) {
      const existingAddress = await prisma.address.findFirst({
        where: { id: params.addressId, userId },
      });
      if (!existingAddress) {
        throw new NotFoundError('Address not found or does not belong to user');
      }
      shippingAddressSnapshot = {
        id: existingAddress.id,
        fullName: existingAddress.fullName,
        phone: existingAddress.phone,
        addressLine1: existingAddress.addressLine1,
        addressLine2: existingAddress.addressLine2,
        city: existingAddress.city,
        state: existingAddress.state,
        postalCode: existingAddress.postalCode,
        country: existingAddress.country,
        landmark: existingAddress.landmark,
      };
    } else if (params.address) {
      const addr = params.address;
      // Save address for future use if not already saved
      const saved = await prisma.address.create({
        data: {
          userId,
          fullName: addr.fullName,
          phone: addr.phone,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country || 'India',
          landmark: addr.landmark,
          isDefault: addr.isDefault ?? false,
        },
      });
      shippingAddressSnapshot = {
        id: saved.id,
        fullName: addr.fullName,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country || 'India',
        landmark: addr.landmark,
      };
    } else {
      throw new BadRequestError('Shipping address is required');
    }

    // 2. Fetch authenticated user's cart from PostgreSQL
    const cart = await this.cartService.getCart(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestError('Cart is empty');
    }

    // 3. Transactionally validate products, stock, coupon usage, and create Order + OrderItems
    const createdOrder = await prisma.$transaction(async (tx) => {
      const productIds = cart.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      // 4. Validate products, stock, and compute server-authoritative subtotal in integer paise
      let subtotalPaise = 0;
      const orderItemsData: Array<{
        productId: string;
        productName: string;
        quantity: number;
        price: number;
        subtotal: number;
      }> = [];

      for (const item of cart.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new BadRequestError(`Product not found: ${item.productName || item.productId}`);
        }
        if (!product.isActive) {
          throw new BadRequestError(`Product is inactive: ${product.name}`);
        }
        if (item.quantity <= 0) {
          throw new BadRequestError(`Invalid quantity for product: ${product.name}`);
        }
        if (product.stock < item.quantity) {
          throw new BadRequestError(
            `Insufficient stock for product ${product.name}. Available: ${product.stock}, requested: ${item.quantity}`
          );
        }

        const unitPricePaise = toPaise(product.price);
        const itemSubtotalPaise = unitPricePaise * item.quantity;
        subtotalPaise += itemSubtotalPaise;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          price: fromPaise(unitPricePaise),
          subtotal: fromPaise(itemSubtotalPaise),
        });
      }

      // 5. Validate and consume coupon atomically inside transaction if provided
      let discountPaise = 0;
      let finalAddressSnapshot: Record<string, any> = { ...shippingAddressSnapshot };

      if (normalizedCouponCode) {
        const consumed = await this.couponService.consumeCouponInTransaction(tx, {
          rawCode: normalizedCouponCode,
          subtotalPaise,
          userId,
        });
        discountPaise = consumed.discountPaise;
        finalAddressSnapshot = {
          ...shippingAddressSnapshot,
          _couponMeta: consumed.couponMetaSnapshot,
        };
      }

      // 5.b Validate and calculate loyalty points redemption if requested
      let loyaltyDiscountPaise = 0;
      let pointsToRedeem = 0;
      if (params.redeemPoints && params.redeemPoints > 0) {
        const remainingSubtotalPaise = Math.max(0, subtotalPaise - discountPaise);
        const loyaltyCalc = await loyaltyService.calculateRedemption(
          userId,
          fromPaise(remainingSubtotalPaise),
          params.redeemPoints
        );
        if (loyaltyCalc.pointsRedeemed > 0) {
          pointsToRedeem = loyaltyCalc.pointsRedeemed;
          loyaltyDiscountPaise = toPaise(loyaltyCalc.discountAmount);
          finalAddressSnapshot = {
            ...finalAddressSnapshot,
            _loyaltyMeta: {
              pointsRedeemed: loyaltyCalc.pointsRedeemed,
              discountAmount: loyaltyCalc.discountAmount,
            },
          };
        }
      }

      const totalDiscountPaise = discountPaise + loyaltyDiscountPaise;

      // 6. Free Shipping Rule in paise: subtotal >= ₹499 -> ₹0, otherwise ₹40
      const freeShippingThresholdPaise = toPaise(499);
      const shippingPaise =
        subtotalPaise >= freeShippingThresholdPaise || subtotalPaise === 0 ? 0 : toPaise(40);
      const taxPaise = 0;
      const totalPaise = Math.max(0, subtotalPaise - totalDiscountPaise + shippingPaise + taxPaise);

      const subtotal = fromPaise(subtotalPaise);
      const discountAmount = fromPaise(totalDiscountPaise);
      const shippingAmount = fromPaise(shippingPaise);
      const taxAmount = fromPaise(taxPaise);
      const totalAmount = fromPaise(totalPaise);

      // 7. Generate order number
      const orderNumber = generateOrderNumber();

      // 8. Create Order and OrderItems
      const order = await tx.order.create({
        data: {
          userId,
          orderNumber,
          subtotal,
          discountAmount,
          shippingAmount,
          taxAmount,
          totalAmount,
          currency: 'INR',
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          shippingStatus: ShippingStatus.PENDING,
          shippingAddress: finalAddressSnapshot,
        },
      });

      if (pointsToRedeem > 0) {
        await loyaltyService.executeRedemption(tx, userId, order.id, pointsToRedeem);
      }

      await Promise.all(
        orderItemsData.map((item) =>
          tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
            },
          })
        )
      );

      return tx.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
    });

    return formatCustomerOrder(createdOrder);
  }

  /** Retrieve all orders belonging to a user */
  async getUserOrders(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId },
      take: 100,
      include: {
        items: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            provider: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        notifications: {
          where: { type: 'ORDER_CONFIRMED', status: 'SENT' },
          select: { type: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => formatCustomerOrder(o)!);
  }

  /** Retrieve a single order by its ID, ensuring ownership */
  async getUserOrderById(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        payments: {
          select: {
            id: true,
            provider: true,
            providerOrderId: true,
            providerPaymentId: true,
            amount: true,
            currency: true,
            status: true,
            signatureVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        notifications: {
          where: { type: 'ORDER_CONFIRMED', status: 'SENT' },
          select: { type: true, status: true },
        },
      },
    });
    if (!order) throw new NotFoundError('Order not found');
    return formatCustomerOrder(order)!;
  }

  /** Cancel an order if it is in a cancellable state */
  async cancelOrder(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundError('Order not found');

    const cancellableStatuses = [OrderStatus.PENDING];
    if (!cancellableStatuses.includes(order.status as any)) {
      throw new ConflictError('Order cannot be cancelled at this stage');
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED },
    });

    notificationService.dispatchOrderEventAsync({
      orderId: updated.id,
      type: 'ORDER_CANCELLED',
    });

    return formatCustomerOrder(updated)!;
  }
}
