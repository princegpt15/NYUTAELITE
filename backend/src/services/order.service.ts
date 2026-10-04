// backend/src/services/order.service.ts
import { OrderStatus, PaymentStatus, ShippingStatus } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { CartService } from './cart.service.js';
import { CouponService } from './coupon.service.js';
import { generateOrderNumber } from '../utils/orderNumber.js';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors.js';

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
  couponCode?: string;
}

/** Service handling order creation, retrieval and cancellation */
export class OrderService {
  private cartService = new CartService();
  private couponService = new CouponService();

  /**
   * Create a new order from the authenticated user's cart.
   * Server validates cart, product availability, authoritative pricing, and stock.
   */
  async createOrder(userId: string, params: CreateOrderParams) {
    // 1. Resolve shipping address and create address snapshot
    let shippingAddressSnapshot: any = null;

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

    // 3. Fetch product details from PostgreSQL for each cart item
    const productIds = cart.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 4. Validate products, stock, and compute server-authoritative subtotal
    let subtotal = 0;
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

      const unitPrice = product.price; // authoritative price from PostgreSQL
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: unitPrice,
        subtotal: itemSubtotal,
      });
    }

    // 5. Apply coupon if provided
    const { discountAmount } = await this.couponService.applyCouponIfValid(
      params.couponCode,
      subtotal
    );

    // 6. Free Shipping Rule: subtotal >= 499 -> 0, otherwise 40
    const freeShippingThreshold = 499;
    const shippingAmount = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 40;
    const taxAmount = 0;
    const totalAmount = Number((subtotal - discountAmount + shippingAmount + taxAmount).toFixed(2));

    // 7. Generate order number
    const orderNumber = generateOrderNumber();

    // 8. Transactionally create Order and OrderItems
    return await prisma.$transaction(async (tx) => {
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
          shippingAddress: shippingAddressSnapshot,
        },
      });

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
  }

  /** Retrieve all orders belonging to a user */
  async getUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Retrieve a single order by its ID, ensuring ownership */
  async getUserOrderById(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, payments: true },
    });
    if (!order) throw new NotFoundError('Order not found');
    return order;
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

    return prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED },
    });
  }
}
