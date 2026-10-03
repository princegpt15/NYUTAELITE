// src/services/order.service.ts
import { OrderStatus, PaymentStatus, ShippingStatus } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { CartService } from './cart.service.js';
import { CouponService } from './coupon.service.js'; // placeholder for future coupon logic
import { generateOrderNumber } from '../utils/orderNumber.js';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors.js';

/** Service handling order creation, retrieval and cancellation */
export class OrderService {
  private cartService = new CartService();
  private couponService = new CouponService();

  /**
   * Create a new order from the user's cart.
   * addressId is currently unused in the schema – retained for future implementation.
   */
  async createOrder(userId: string, addressId: string, couponCode?: string) {
    void addressId; // placeholder usage

    // Retrieve cart and its items
    const cart = await this.cartService.getCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestError('Cart is empty');
    }

    // Fetch product details for each cart item
    const productIds = cart.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    // Ensure all products exist and are active
    if (products.length !== productIds.length) {
      throw new BadRequestError('One or more products are unavailable');
    }

    // Map product id → product record for quick lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate stock and compute subtotal
    let subtotal = 0;
    const orderItemsData = cart.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new BadRequestError('Product not found');
      if (product.stock < item.quantity) {
        throw new BadRequestError(`Insufficient stock for product ${product.name}`);
      }
      const price = product.price; // use current price from DB
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;
      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price,
        subtotal: itemSubtotal,
      };
    });

    // Apply coupon if provided (placeholder logic – implement real logic in CouponService)
    const { discountAmount, discountCode } = await this.couponService.applyCouponIfValid(
      couponCode,
      subtotal,
    );
    void discountCode; // placeholder usage

    // Simple shipping calculation (flat rate for demo purposes)
    const shippingAmount = subtotal > 500 ? 0 : 30; // free shipping over 500
    const taxAmount = Number(((subtotal - discountAmount) * 0.18).toFixed(2)); // 18% tax
    const totalAmount = Number(
      (subtotal - discountAmount + shippingAmount + taxAmount).toFixed(2),
    );

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Transaction – create order, order items, update stock, clear cart
    return await prisma.$transaction(async (tx) => {
      // Create order
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
          // addressId would be stored here if the schema supported it
        },
      });

      // Create order items
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
          }),
        ),
      );

      // Decrease stock
      await Promise.all(
        orderItemsData.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          }),
        ),
      );

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
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
      include: { items: true },
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

    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    if (!cancellableStatuses.includes(order.status as any)) {
      throw new ConflictError('Order cannot be cancelled at this stage');
    }

    // Transaction – update order status, restore stock, delete any pending payment records
    return await prisma.$transaction(async (tx) => {
      // Restore stock by iterating over order items
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      await Promise.all(
        items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          }),
        ),
      );

      // Update order status
      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      });

      // Optionally delete or mark unpaid payment records – placeholder
      await tx.payment.deleteMany({
        where: { orderId: order.id, status: PaymentStatus.PENDING },
      });

      return updated;
    });
  }
}
