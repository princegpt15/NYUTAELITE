// backend/src/services/admin.service.ts
import prisma from '../lib/prisma.js';
import { razorpayService } from './razorpay.service.js';
import {
  extractOrderCouponMeta,
  normalizeCouponCode,
  createCouponError,
} from './coupon.service.js';
import { notificationService } from './notification/notification.service.js';
import { loyaltyService } from './loyalty.service.js';
import { referralService } from './referral.service.js';
import type {
  Prisma,
  OrderStatus,
  ShippingStatus,
  PaymentStatus,
  Coupon,
  CouponDiscountType,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from '@prisma/client';

const activeRefundOrderLocks = new Set<string>();

export class AdminService {
  /**
   * Get operational dashboard metrics.
   * Revenue is calculated strictly from orders with CAPTURED payments or CONFIRMED/DELIVERED status.
   */
  async getDashboardStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      capturedRevenueAgg,
      totalCustomers,
      newCustomersLast30Days,
      activeProducts,
      lowStockCount,
      outOfStockCount,
      pendingPayments,
      authorizedPayments,
      capturedPayments,
      failedPayments,
      refundedPayments,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'CONFIRMED' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      // Authoritative captured revenue: sum totalAmount where payment was captured or order is fulfilled (excluding cancelled & refunded)
      prisma.order.aggregate({
        where: {
          OR: [
            { paymentStatus: 'CAPTURED' },
            { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
          ],
          status: { not: 'CANCELLED' },
          paymentStatus: { not: 'REFUNDED' },
        },
        _sum: { totalAmount: true },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: thirtyDaysAgo } } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { stock: { lte: 10 }, isActive: true } }),
      prisma.product.count({ where: { stock: 0, isActive: true } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'AUTHORIZED' } }),
      prisma.payment.count({ where: { status: 'CAPTURED' } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
      prisma.payment.count({ where: { status: 'REFUNDED' } }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          shippingStatus: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
    ]);

    const totalRevenue = Math.round((capturedRevenueAgg._sum.totalAmount || 0) * 100) / 100;

    return {
      totalOrders,
      totalRevenue,
      revenueRule: 'Authoritative gross sum of confirmed/captured orders (excluding cancelled and refunded orders)',
      ordersByStatus: {
        pending: pendingOrders,
        confirmed: confirmedOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      paymentsByStatus: {
        pending: pendingPayments,
        authorized: authorizedPayments,
        captured: capturedPayments,
        failed: failedPayments,
        refunded: refundedPayments,
      },
      customers: {
        total: totalCustomers,
        newLast30Days: newCustomersLast30Days,
      },
      inventory: {
        activeProducts,
        lowStockProducts: lowStockCount,
        outOfStockProducts: outOfStockCount,
      },
      recentOrders,
    };
  }

  /**
   * List paginated orders with flexible filters and search.
   */
  async getOrders(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    shippingStatus?: ShippingStatus;
    from?: string;
    to?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 15));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }
    if (params.paymentStatus) {
      where.paymentStatus = params.paymentStatus;
    }
    if (params.shippingStatus) {
      where.shippingStatus = params.shippingStatus;
    }

    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) {
        where.createdAt.gte = new Date(params.from);
      }
      if (params.to) {
        const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(params.to);
        where.createdAt.lte = isDateOnly
          ? new Date(`${params.to}T23:59:59.999Z`)
          : new Date(params.to);
      }
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { phone: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          subtotal: true,
          shippingAmount: true,
          discountAmount: true,
          totalAmount: true,
          currency: true,
          status: true,
          paymentStatus: true,
          shippingStatus: true,
          shippingAddress: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
    ]);

    const formattedOrders = orders.map((o) => {
      const { couponMeta } = extractOrderCouponMeta(o.shippingAddress);
      const { shippingAddress: _ignored, ...rest } = o;
      return {
        ...rest,
        discountAmount: Number(o.discountAmount || 0),
        couponCode: couponMeta?.couponCode || null,
      };
    });

    return {
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single order details for admin inspection.
   */
  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        orderNumber: true,
        subtotal: true,
        shippingAmount: true,
        discountAmount: true,
        taxAmount: true,
        totalAmount: true,
        currency: true,
        status: true,
        paymentStatus: true,
        shippingStatus: true,
        razorpayOrderId: true,
        shippingAddress: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
          },
        },
        items: {
          select: {
            id: true,
            orderId: true,
            productId: true,
            productName: true,
            quantity: true,
            price: true,
            subtotal: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
                weight: true,
                category: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
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
      },
    });

    if (!order) {
      const error: any = new Error('Order not found.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const capturedPayment = order.payments.find(
      (p) =>
        p.status === 'CAPTURED' ||
        (order.paymentStatus === 'REFUNDED' &&
          p.status === 'REFUNDED' &&
          p.providerPaymentId &&
          p.providerPaymentId.startsWith('pay_'))
    );
    const refundRecords = order.payments.filter(
      (p) =>
        p.status === 'REFUNDED' &&
        (!p.providerPaymentId ||
          p.providerPaymentId.startsWith('rfnd_') ||
          (capturedPayment && p.id !== capturedPayment.id))
    );

    const capturedAmountPaise = capturedPayment
      ? Math.round(capturedPayment.amount * 100)
      : order.paymentStatus === 'CAPTURED' || order.paymentStatus === 'REFUNDED'
      ? Math.round(order.totalAmount * 100)
      : 0;

    let previouslyRefundedPaise = refundRecords.reduce(
      (sum, r) => sum + Math.round(r.amount * 100),
      0
    );
    if (order.paymentStatus === 'REFUNDED' && previouslyRefundedPaise === 0) {
      previouslyRefundedPaise = capturedAmountPaise;
    }

    const remainingRefundablePaise =
      order.paymentStatus === 'REFUNDED'
        ? 0
        : Math.max(0, capturedAmountPaise - previouslyRefundedPaise);

    const isRefundEligible =
      order.paymentStatus === 'CAPTURED' &&
      Boolean(capturedPayment && capturedPayment.providerPaymentId && capturedPayment.amount > 0) &&
      remainingRefundablePaise > 0 &&
      (order.status === 'CANCELLED' ||
        order.status === 'DELIVERED' ||
        order.shippingStatus === 'RETURNED');

    const latestRefund =
      refundRecords.length > 0
        ? refundRecords[0]
        : order.paymentStatus === 'REFUNDED' && capturedPayment
        ? capturedPayment
        : null;

    const { cleanShippingAddress, couponMeta } = extractOrderCouponMeta(order.shippingAddress);

    return {
      ...order,
      discountAmount: Number(order.discountAmount || 0),
      shippingAddress: cleanShippingAddress,
      couponCode: couponMeta?.couponCode || null,
      couponMeta: couponMeta || null,
      refundSummary: {
        isEligible: isRefundEligible,
        capturedAmount: Number((capturedAmountPaise / 100).toFixed(2)),
        previouslyRefundedAmount: Number((previouslyRefundedPaise / 100).toFixed(2)),
        remainingRefundableAmount: Number((remainingRefundablePaise / 100).toFixed(2)),
        refundStatus:
          order.paymentStatus === 'REFUNDED' ||
          (capturedAmountPaise > 0 && remainingRefundablePaise === 0)
            ? 'REFUNDED'
            : previouslyRefundedPaise > 0
            ? 'PARTIALLY_REFUNDED'
            : 'NONE',
        latestRefund: latestRefund
          ? {
              id: latestRefund.id,
              refundReference: latestRefund.providerPaymentId,
              amount: latestRefund.amount,
              currency: latestRefund.currency,
              status: latestRefund.status,
              createdAt: latestRefund.createdAt,
            }
          : null,
      },
    };
  }

  /**
   * Update order fulfillment / shipping status with strict forward-only transition validation
   * and payment-state safety guards.
   */
  async updateOrderStatus(id: string, data: { orderStatus?: OrderStatus; shippingStatus?: ShippingStatus }) {
    const existing = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        shippingStatus: true,
        paymentStatus: true,
        orderNumber: true,
      },
    });

    if (!existing) {
      const error: any = new Error('Order not found.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
    };

    const nextOrderStatus: OrderStatus = data.orderStatus ?? existing.status;

    // 1. Validate strict forward-only OrderStatus transition when orderStatus is provided
    if (data.orderStatus !== undefined) {
      const allowedNext = ALLOWED_TRANSITIONS[existing.status] || [];
      if (!allowedNext.includes(data.orderStatus)) {
        const error: any = new Error(
          `Order cannot be moved from ${existing.status} to ${data.orderStatus}.`
        );
        error.statusCode = 422;
        error.code = 'INVALID_STATE_TRANSITION';
        throw error;
      }

      // 2. Payment / Fulfillment Safety Rules
      if (data.orderStatus !== 'CANCELLED') {
        if (existing.paymentStatus === 'FAILED') {
          const error: any = new Error(
            'Cannot fulfill order while payment status is FAILED.'
          );
          error.statusCode = 422;
          error.code = 'PAYMENT_NOT_CAPTURED';
          throw error;
        }

        if (existing.paymentStatus === 'REFUNDED') {
          const error: any = new Error(
            'Cannot fulfill order while payment status is REFUNDED.'
          );
          error.statusCode = 422;
          error.code = 'PAYMENT_REFUNDED';
          throw error;
        }

        if (
          existing.paymentStatus !== 'CAPTURED' &&
          ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(data.orderStatus)
        ) {
          const error: any = new Error(
            `Cannot move order to ${data.orderStatus} while payment status is ${existing.paymentStatus}. Payment must be CAPTURED first.`
          );
          error.statusCode = 422;
          error.code = 'PAYMENT_NOT_CAPTURED';
          throw error;
        }
      }
    }

    // 3. Synchronize and validate ShippingStatus consistency with OrderStatus
    let nextShippingStatus: ShippingStatus = existing.shippingStatus;

    if (nextOrderStatus === 'SHIPPED') {
      if (data.shippingStatus && data.shippingStatus !== 'SHIPPED') {
        const error: any = new Error(
          `Inconsistent shipping status: when order status is SHIPPED, shipping status must be SHIPPED.`
        );
        error.statusCode = 422;
        error.code = 'INVALID_SHIPPING_TRANSITION';
        throw error;
      }
      nextShippingStatus = 'SHIPPED';
    } else if (nextOrderStatus === 'DELIVERED') {
      if (data.shippingStatus && data.shippingStatus !== 'DELIVERED' && data.shippingStatus !== 'RETURNED') {
        const error: any = new Error(
          `Inconsistent shipping status: when order status is DELIVERED, shipping status must be DELIVERED or RETURNED.`
        );
        error.statusCode = 422;
        error.code = 'INVALID_SHIPPING_TRANSITION';
        throw error;
      }
      nextShippingStatus = data.shippingStatus === 'RETURNED' ? 'RETURNED' : 'DELIVERED';
    } else {
      // Order is in PENDING, CONFIRMED, PROCESSING, or CANCELLED
      if (data.shippingStatus && data.shippingStatus !== 'PENDING') {
        const error: any = new Error(
          `Cannot set shipping status to ${data.shippingStatus} while order status is ${nextOrderStatus}.`
        );
        error.statusCode = 422;
        error.code = 'INVALID_SHIPPING_TRANSITION';
        throw error;
      }
      nextShippingStatus = 'PENDING';
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: nextOrderStatus,
        shippingStatus: nextShippingStatus,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        shippingStatus: true,
        paymentStatus: true,
        updatedAt: true,
      },
    });

    if (nextOrderStatus !== existing.status) {
      const statusToNotificationType: Partial<Record<OrderStatus, NotificationType>> = {
        CONFIRMED: 'ORDER_CONFIRMED',
        PROCESSING: 'ORDER_PROCESSING',
        SHIPPED: 'ORDER_SHIPPED',
        DELIVERED: 'ORDER_DELIVERED',
        CANCELLED: 'ORDER_CANCELLED',
      };
      const notifType = statusToNotificationType[nextOrderStatus];
      if (notifType) {
        notificationService.dispatchOrderEventAsync({
          orderId: updated.id,
          type: notifType,
        });
      }

      if (nextOrderStatus === 'CONFIRMED' || nextOrderStatus === 'DELIVERED') {
        loyaltyService.awardOrderPoints(updated.id).catch((err) => {
          console.error('[AdminService] Failed to award loyalty points:', err);
        });
        referralService.qualifyReferralForOrder(updated.id).catch((err) => {
          console.error('[AdminService] Failed to qualify referral:', err);
        });
      }
    }

    return updated;
  }

  /**
   * List all products for admin catalog management (including inactive & stock metrics).
   */
  async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isActive?: boolean;
    lowStock?: boolean;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }
    if (params.category) {
      where.category = { equals: params.category, mode: 'insensitive' };
    }
    if (params.lowStock) {
      where.stock = { lte: 10 };
    }
    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          category: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          sku: true,
          images: true,
          ingredients: true,
          weight: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { orderItems: true },
          },
        },
      }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new product.
   */
  async createProduct(data: {
    name: string;
    slug?: string;
    description?: string | null;
    category?: string | null;
    price: number;
    compareAtPrice?: number | null;
    stock: number;
    sku: string;
    images?: any;
    ingredients?: any;
    weight?: number | null;
    isActive?: boolean;
  }) {
    // Generate slug from name if not provided
    const baseSlug = (data.slug || data.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check slug uniqueness
    let slug = baseSlug;
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    // Check SKU uniqueness
    const existingSku = await prisma.product.findFirst({
      where: { sku: { equals: data.sku, mode: 'insensitive' } },
    });
    if (existingSku) {
      const error: any = new Error(`A product with SKU "${data.sku}" already exists`);
      error.statusCode = 409;
      error.code = 'SKU_EXISTS';
      throw error;
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        category: data.category || null,
        price: data.price,
        compareAtPrice: data.compareAtPrice || null,
        stock: data.stock,
        sku: data.sku,
        images: data.images || null,
        ingredients: data.ingredients || null,
        weight: data.weight || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return product;
  }

  /**
   * Update an existing product.
   */
  async updateProduct(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      category?: string | null;
      price?: number;
      compareAtPrice?: number | null;
      stock?: number;
      sku?: string;
      images?: any;
      ingredients?: any;
      weight?: number | null;
      isActive?: boolean;
    }
  ) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      const error: any = new Error('Product not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (data.sku && data.sku.toLowerCase() !== (existing.sku || '').toLowerCase()) {
      const conflict = await prisma.product.findFirst({
        where: {
          sku: { equals: data.sku, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (conflict) {
        const error: any = new Error(`A product with SKU "${data.sku}" already exists`);
        error.statusCode = 409;
        error.code = 'SKU_EXISTS';
        throw error;
      }
    }

    if (data.slug && data.slug !== existing.slug) {
      const conflict = await prisma.product.findFirst({
        where: {
          slug: data.slug,
          id: { not: id },
        },
      });
      if (conflict) {
        const error: any = new Error(`A product with slug "${data.slug}" already exists`);
        error.statusCode = 409;
        error.code = 'SLUG_EXISTS';
        throw error;
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.compareAtPrice !== undefined ? { compareAtPrice: data.compareAtPrice } : {}),
        ...(data.stock !== undefined ? { stock: data.stock } : {}),
        ...(data.sku !== undefined ? { sku: data.sku } : {}),
        ...(data.images !== undefined ? { images: data.images } : {}),
        ...(data.ingredients !== undefined ? { ingredients: data.ingredients } : {}),
        ...(data.weight !== undefined ? { weight: data.weight } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    return updated;
  }

  /**
   * List customers with aggregated lifetime spend and order metrics.
   */
  async getCustomers(params: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: 'CUSTOMER',
    };

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { orders: true },
          },
          orders: {
            where: { status: { not: 'CANCELLED' } },
            select: { totalAmount: true },
          },
        },
      }),
    ]);

    const formattedCustomers = customers.map((c) => {
      const lifetimeSpend = c.orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const { orders, ...safeData } = c;
      return {
        ...safeData,
        orderCount: c._count.orders,
        lifetimeSpend: Math.round(lifetimeSpend * 100) / 100,
      };
    });

    return {
      customers: formattedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get customer details, server-authoritative lifetime spend, and recent orders.
   */
  async getCustomerById(id: string) {
    const [customer, spendAggregate] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          addresses: {
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
            select: {
              id: true,
              fullName: true,
              phone: true,
              addressLine1: true,
              addressLine2: true,
              city: true,
              state: true,
              postalCode: true,
              country: true,
              landmark: true,
              isDefault: true,
            },
          },
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              currency: true,
              status: true,
              paymentStatus: true,
              shippingStatus: true,
              createdAt: true,
            },
          },
          _count: {
            select: { orders: true, reviews: true },
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          userId: id,
          status: { not: 'CANCELLED' },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    if (!customer) {
      const error: any = new Error('Customer not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const lifetimeSpend = Math.round((spendAggregate._sum.totalAmount || 0) * 100) / 100;

    return {
      ...customer,
      orderCount: customer._count.orders,
      lifetimeSpend,
    };
  }

  /**
   * List payment records (Read-Only).
   */
  async getPayments(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: PaymentStatus;
    orderStatus?: OrderStatus;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.orderStatus) {
      where.order = { status: params.orderStatus };
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { providerPaymentId: { contains: q, mode: 'insensitive' } },
        { providerOrderId: { contains: q, mode: 'insensitive' } },
        { orderId: { contains: q, mode: 'insensitive' } },
        { order: { orderNumber: { contains: q, mode: 'insensitive' } } },
        { order: { user: { email: { contains: q, mode: 'insensitive' } } } },
        { order: { user: { name: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderId: true,
          provider: true,
          providerOrderId: true,
          providerPaymentId: true,
          amount: true,
          currency: true,
          status: true,
          signatureVerified: true,
          createdAt: true,
          updatedAt: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              status: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single payment record (Read-Only).
   */
  async getPaymentById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        orderId: true,
        provider: true,
        providerOrderId: true,
        providerPaymentId: true,
        amount: true,
        currency: true,
        status: true,
        signatureVerified: true,
        createdAt: true,
        updatedAt: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            currency: true,
            status: true,
            paymentStatus: true,
            shippingStatus: true,
            createdAt: true,
            payments: {
              orderBy: { createdAt: 'desc' },
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
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      const error: any = new Error('Payment record not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const orderPayments = payment.order?.payments || [];
    const refundTransactions = orderPayments.filter(
      (p) =>
        p.status === 'REFUNDED' &&
        (!p.providerPaymentId || p.providerPaymentId.startsWith('rfnd_') || p.id !== payment.id)
    );

    const totalRefundedAmount = Number(
      refundTransactions.reduce((sum, r) => sum + r.amount, 0).toFixed(2)
    );

    return {
      ...payment,
      refundSummary: {
        isRefundTransaction:
          payment.status === 'REFUNDED' &&
          Boolean(payment.providerPaymentId && payment.providerPaymentId.startsWith('rfnd_')),
        totalRefundedAmount:
          payment.status === 'REFUNDED' && totalRefundedAmount === 0
            ? payment.amount
            : totalRefundedAmount,
        refundStatus:
          payment.status === 'REFUNDED' || payment.order?.paymentStatus === 'REFUNDED'
            ? 'REFUNDED'
            : totalRefundedAmount > 0
            ? 'PARTIALLY_REFUNDED'
            : 'NONE',
        refundRecords: refundTransactions,
      },
    };
  }

  /**
   * Process an authoritative, idempotent full or partial refund for an order.
   * Derives all financial values strictly from PostgreSQL, calls Razorpay refund API,
   * and updates Order/Payment state transactionally only after gateway confirmation.
   */
  async refundOrder(
    orderId: string,
    params: { amount?: number; reason?: string; adminUserId?: string }
  ) {
    // 1. Concurrency lock to prevent parallel double-refund requests on the same order
    if (activeRefundOrderLocks.has(orderId)) {
      const error: any = new Error('Refund is already being processed.');
      error.statusCode = 409;
      error.code = 'REFUND_IN_PROGRESS';
      throw error;
    }

    activeRefundOrderLocks.add(orderId);

    try {
      // 2. Load order and associated payments from PostgreSQL
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!order) {
        const error: any = new Error('Order or payment not found.');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }

      // 3. Identify captured payment and existing refund records
      const capturedPayment = order.payments.find(
        (p) =>
          p.status === 'CAPTURED' &&
          p.providerPaymentId &&
          !p.providerPaymentId.startsWith('rfnd_')
      );

      const refundRecords = order.payments.filter(
        (p) =>
          p.status === 'REFUNDED' &&
          (!p.providerPaymentId ||
            p.providerPaymentId.startsWith('rfnd_') ||
            (capturedPayment && p.id !== capturedPayment.id))
      );

      // 4. Idempotency / Already Refunded Check
      if (order.paymentStatus === 'REFUNDED') {
        const latestRefund = refundRecords[0] || order.payments.find((p) => p.status === 'REFUNDED');
        // If this is a duplicate full-refund request (no specific amount or amount matches already refunded amount),
        // return the existing refund result idempotently if requested without excess, or 422 if attempting additional refund
        if (params.amount !== undefined) {
          const error: any = new Error('Refund amount exceeds the remaining refundable amount.');
          error.statusCode = 422;
          error.code = 'REFUND_EXCEEDS_REMAINING';
          throw error;
        }
        const error: any = new Error('Payment is not eligible for refund. Order is already fully refunded.');
        error.statusCode = 422;
        error.code = 'ALREADY_REFUNDED';
        error.details = latestRefund
          ? {
              refundId: latestRefund.providerPaymentId || latestRefund.id,
              amount: latestRefund.amount,
              status: 'REFUNDED',
              createdAt: latestRefund.createdAt,
            }
          : undefined;
        throw error;
      }

      // 5. Strict Payment Status Eligibility Check
      if (order.paymentStatus !== 'CAPTURED' || !capturedPayment || !capturedPayment.providerPaymentId) {
        const error: any = new Error('Payment is not eligible for refund.');
        error.statusCode = 422;
        error.code = 'PAYMENT_NOT_REFUNDABLE';
        throw error;
      }

      if (capturedPayment.amount <= 0 || order.totalAmount <= 0) {
        const error: any = new Error('Payment is not eligible for refund.');
        error.statusCode = 422;
        error.code = 'PAYMENT_NOT_REFUNDABLE';
        throw error;
      }

      // Verify order belongs to the payment record
      if (capturedPayment.orderId !== order.id) {
        const error: any = new Error('Payment is not eligible for refund.');
        error.statusCode = 422;
        error.code = 'PAYMENT_ORDER_MISMATCH';
        throw error;
      }

      // 6. Order + Shipping State Eligibility Check:
      // Refund is only allowed for CANCELLED orders (cancelled before shipping)
      // or DELIVERED orders (including RETURNED shipping status).
      const isOrderStateEligible =
        order.status === 'CANCELLED' ||
        order.status === 'DELIVERED' ||
        order.shippingStatus === 'RETURNED';

      if (!isOrderStateEligible) {
        const error: any = new Error(
          `Payment is not eligible for refund while order status is ${order.status}. Cancel the order or complete return reception first.`
        );
        error.statusCode = 422;
        error.code = 'ORDER_STATE_NOT_REFUNDABLE';
        throw error;
      }

      // 7. Server-Authoritative Paise Calculation
      const capturedPaise = Math.round(capturedPayment.amount * 100);
      const previouslyRefundedPaise = refundRecords.reduce(
        (sum, r) => sum + Math.round(r.amount * 100),
        0
      );
      const remainingRefundablePaise = Math.max(0, capturedPaise - previouslyRefundedPaise);

      if (remainingRefundablePaise <= 0) {
        const error: any = new Error('Payment is not eligible for refund.');
        error.statusCode = 422;
        error.code = 'ALREADY_REFUNDED';
        throw error;
      }

      const requestedPaise =
        params.amount !== undefined
          ? Math.round(params.amount * 100)
          : remainingRefundablePaise;

      if (requestedPaise <= 0) {
        const error: any = new Error('Refund amount must be greater than zero.');
        error.statusCode = 422;
        error.code = 'INVALID_REFUND_AMOUNT';
        throw error;
      }

      if (requestedPaise > capturedPaise || requestedPaise > remainingRefundablePaise) {
        const error: any = new Error('Refund amount exceeds the remaining refundable amount.');
        error.statusCode = 422;
        error.code = 'REFUND_EXCEEDS_REMAINING';
        throw error;
      }

      const newRemainingPaise = remainingRefundablePaise - requestedPaise;
      const isFullyRefundedAfter = newRemainingPaise === 0;
      const refundAmountInr = Number((requestedPaise / 100).toFixed(2));

      // 8. Execute Razorpay Refund Request Server-Side
      let razorpayRefund: any;
      try {
        razorpayRefund = await razorpayService.createRefund(
          capturedPayment.providerPaymentId,
          requestedPaise
        );
      } catch (gatewayErr: any) {
        const error: any = new Error('Refund could not be completed. No refund was recorded.');
        error.statusCode = 502;
        error.code = 'RAZORPAY_REFUND_FAILED';
        throw error;
      }

      if (!razorpayRefund || !razorpayRefund.id) {
        const error: any = new Error('Refund could not be completed. No refund was recorded.');
        error.statusCode = 502;
        error.code = 'RAZORPAY_REFUND_FAILED';
        throw error;
      }

      // 9. Update PostgreSQL Transactionally (Only after Razorpay confirms refund)
      const result = await prisma.$transaction(async (tx) => {
        // Double-check inside transaction that the same provider refund ID wasn't already recorded via webhook
        const existingRefundRecord = await tx.payment.findUnique({
          where: { providerPaymentId: razorpayRefund.id },
        });

        const refundPayment =
          existingRefundRecord ||
          (await tx.payment.create({
            data: {
              orderId: order.id,
              userId: order.userId,
              provider: capturedPayment.provider,
              providerOrderId: capturedPayment.providerOrderId || order.razorpayOrderId,
              providerPaymentId: razorpayRefund.id,
              amount: refundAmountInr,
              currency: razorpayRefund.currency || capturedPayment.currency || 'INR',
              status: 'REFUNDED',
              signatureVerified: true,
              rawResponse: {
                ...(typeof razorpayRefund === 'object' ? razorpayRefund : {}),
                parentPaymentId: capturedPayment.providerPaymentId,
                adminUserId: params.adminUserId || null,
                reason: params.reason || null,
              } as any,
            },
          }));

        // Update Order paymentStatus to REFUNDED when full captured amount is refunded
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            ...(isFullyRefundedAfter ? { paymentStatus: 'REFUNDED' } : {}),
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            shippingStatus: true,
            totalAmount: true,
            currency: true,
            updatedAt: true,
          },
        });

        return { refundPayment, updatedOrder };
      });

      const refundReferenceId = result.refundPayment.providerPaymentId || result.refundPayment.id;

      notificationService.dispatchOrderEventAsync({
        orderId: order.id,
        type: 'REFUND_COMPLETED',
        refundAmount: refundAmountInr,
        refundReference: refundReferenceId,
        refundReason: params.reason,
      });

      loyaltyService.reverseOrderPoints(order.id, refundReferenceId).catch((err) => {
        console.error('[AdminService] Failed to reverse loyalty points:', err);
      });

      // 10. Return strictly sanitized response (NEVER expose rawResponse or secrets)
      return {
        refundId: refundReferenceId,
        paymentRecordId: result.refundPayment.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        originalPaymentReference: capturedPayment.providerPaymentId,
        capturedAmount: Number((capturedPaise / 100).toFixed(2)),
        refundAmount: refundAmountInr,
        previouslyRefundedAmount: Number(
          ((previouslyRefundedPaise + requestedPaise) / 100).toFixed(2)
        ),
        remainingRefundableAmount: Number((newRemainingPaise / 100).toFixed(2)),
        currency: result.refundPayment.currency,
        status: isFullyRefundedAfter ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        orderStatus: result.updatedOrder.status,
        paymentStatus: result.updatedOrder.paymentStatus,
        shippingStatus: result.updatedOrder.shippingStatus,
        createdAt: result.refundPayment.createdAt,
      };
    } finally {
      activeRefundOrderLocks.delete(orderId);
    }
  }

  /**
   * Helper to enrich a Coupon record with extended metadata and computed lifecycle status.
   */
  private formatAdminCoupon(
    coupon: Coupon,
    orderStats?: {
      ordersCount: number;
      totalDiscountGiven: number;
      revenueBeforeDiscount: number;
      revenueAfterDiscount: number;
    }
  ) {
    const nowMs = Date.now();
    const startMs = coupon.startsAt ? coupon.startsAt.getTime() : null;
    const expiryMs = coupon.expiresAt ? coupon.expiresAt.getTime() : null;

    const isExpired = expiryMs !== null && !Number.isNaN(expiryMs) && expiryMs <= nowMs;
    const isScheduled = startMs !== null && !Number.isNaN(startMs) && startMs > nowMs;
    const isLimitReached =
      coupon.usageLimit !== null &&
      coupon.usageLimit !== undefined &&
      coupon.usedCount >= coupon.usageLimit;

    let effectiveStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SCHEDULED' | 'LIMIT_REACHED' = 'ACTIVE';
    if (!coupon.isActive) {
      effectiveStatus = 'INACTIVE';
    } else if (isExpired) {
      effectiveStatus = 'EXPIRED';
    } else if (isLimitReached) {
      effectiveStatus = 'LIMIT_REACHED';
    } else if (isScheduled) {
      effectiveStatus = 'SCHEDULED';
    }

    return {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description ?? null,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumOrderAmount: coupon.minimumOrderAmount ?? null,
      maximumDiscount: coupon.maximumDiscount ?? null,
      maximumDiscountAmount: coupon.maximumDiscount ?? null,
      startsAt: coupon.startsAt ? coupon.startsAt.toISOString() : null,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
      usageLimit: coupon.usageLimit ?? null,
      usedCount: coupon.usedCount,
      usageCount: coupon.usedCount,
      perCustomerLimit: coupon.perCustomerLimit ?? null,
      isActive: coupon.isActive,
      isExpired,
      isScheduled,
      isLimitReached,
      effectiveStatus,
      createdAt: coupon.createdAt ? coupon.createdAt.toISOString() : null,
      updatedAt: coupon.updatedAt ? coupon.updatedAt.toISOString() : null,
      usageStats: {
        ordersCount: orderStats?.ordersCount ?? coupon.usedCount,
        totalDiscountGiven: Number((orderStats?.totalDiscountGiven ?? 0).toFixed(2)),
        revenueBeforeDiscount: Number((orderStats?.revenueBeforeDiscount ?? 0).toFixed(2)),
        revenueAfterDiscount: Number((orderStats?.revenueAfterDiscount ?? 0).toFixed(2)),
      },
    };
  }

  /**
   * List coupons with server-side pagination, search, type filter, active filter, and validity filter.
   */
  async getCoupons(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    discountType?: CouponDiscountType;
    type?: CouponDiscountType;
    validity?: 'ALL' | 'VALID' | 'EXPIRED' | 'SCHEDULED';
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 15));
    const skip = (page - 1) * limit;

    const andConditions: Prisma.CouponWhereInput[] = [];

    if (params.search) {
      const q = params.search.trim();
      if (q) {
        andConditions.push({
          OR: [
            { code: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        });
      }
    }

    if (params.isActive !== undefined) {
      andConditions.push({ isActive: params.isActive });
    }

    const typeFilter = params.discountType || params.type;
    if (typeFilter) {
      andConditions.push({ discountType: typeFilter });
    }

    const now = new Date();
    if (params.validity === 'EXPIRED') {
      andConditions.push({ expiresAt: { lte: now } });
    } else if (params.validity === 'SCHEDULED') {
      andConditions.push({ startsAt: { gt: now } });
    } else if (params.validity === 'VALID') {
      if (params.isActive === undefined) {
        andConditions.push({ isActive: true });
      }
      andConditions.push({ OR: [{ startsAt: null }, { startsAt: { lte: now } }] });
      andConditions.push({ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] });
    }

    const where: Prisma.CouponWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [total, coupons, usageRows] = await Promise.all([
      prisma.coupon.count({ where }),
      prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isActive: 'desc' }, { code: 'asc' }],
      }),
      prisma.$queryRaw<
        Array<{
          coupon_code: string;
          orders_count: bigint;
          total_discount: number;
          revenue_before: number;
          revenue_after: number;
        }>
      >`
        SELECT
          UPPER("shippingAddress"->'_couponMeta'->>'couponCode') AS coupon_code,
          COUNT(*)::bigint AS orders_count,
          COALESCE(SUM("discountAmount"), 0)::float8 AS total_discount,
          COALESCE(SUM("subtotal"), 0)::float8 AS revenue_before,
          COALESCE(SUM("totalAmount"), 0)::float8 AS revenue_after
        FROM "Order"
        WHERE "shippingAddress"->'_couponMeta'->>'couponCode' IS NOT NULL
        GROUP BY 1
      `,
    ]);

    const statsByCode = new Map<
      string,
      {
        ordersCount: number;
        totalDiscountGiven: number;
        revenueBeforeDiscount: number;
        revenueAfterDiscount: number;
      }
    >();

    let totalDiscountGivenAll = 0;
    let totalOrdersUsingCoupons = 0;

    for (const row of usageRows) {
      if (row.coupon_code) {
        const countNum = Number(row.orders_count || 0);
        const discNum = Number(row.total_discount || 0);
        totalOrdersUsingCoupons += countNum;
        totalDiscountGivenAll += discNum;
        statsByCode.set(row.coupon_code.toUpperCase(), {
          ordersCount: countNum,
          totalDiscountGiven: discNum,
          revenueBeforeDiscount: Number(row.revenue_before || 0),
          revenueAfterDiscount: Number(row.revenue_after || 0),
        });
      }
    }

    const formatted = coupons.map((c) =>
      this.formatAdminCoupon(c, statsByCode.get(c.code.toUpperCase()))
    );

    return {
      coupons: formatted,
      summary: {
        totalCoupons: total,
        totalOrdersUsingCoupons,
        totalDiscountGiven: Number(totalDiscountGivenAll.toFixed(2)),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single coupon details and usage statistics.
   */
  async getCouponById(id: string) {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      const error: any = new Error('Coupon not found.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Aggregate usage statistics and recent orders that used this coupon
    const [aggRows, recentOrderIds] = await Promise.all([
      prisma.$queryRaw<
        Array<{
          orders_count: bigint;
          total_discount: number;
          revenue_before: number;
          revenue_after: number;
        }>
      >`
        SELECT
          COUNT(*)::bigint AS orders_count,
          COALESCE(SUM("discountAmount"), 0)::float8 AS total_discount,
          COALESCE(SUM("subtotal"), 0)::float8 AS revenue_before,
          COALESCE(SUM("totalAmount"), 0)::float8 AS revenue_after
        FROM "Order"
        WHERE "shippingAddress"->'_couponMeta'->>'couponId' = ${coupon.id}
           OR UPPER("shippingAddress"->'_couponMeta'->>'couponCode') = ${coupon.code}
      `,
      prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Order"
        WHERE "shippingAddress"->'_couponMeta'->>'couponId' = ${coupon.id}
           OR UPPER("shippingAddress"->'_couponMeta'->>'couponCode') = ${coupon.code}
        ORDER BY "createdAt" DESC
        LIMIT 25
      `,
    ]);

    const agg = aggRows[0];
    const orderIds = recentOrderIds.map((r) => r.id);

    const recentOrders =
      orderIds.length > 0
        ? await prisma.order.findMany({
            where: { id: { in: orderIds } },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              orderNumber: true,
              subtotal: true,
              discountAmount: true,
              shippingAmount: true,
              totalAmount: true,
              status: true,
              paymentStatus: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          })
        : [];

    const formatted = this.formatAdminCoupon(coupon, {
      ordersCount: Math.max(coupon.usedCount, Number(agg?.orders_count || 0)),
      totalDiscountGiven: Number(agg?.total_discount || 0),
      revenueBeforeDiscount: Number(agg?.revenue_before || 0),
      revenueAfterDiscount: Number(agg?.revenue_after || 0),
    });

    return {
      ...formatted,
      recentOrders,
    };
  }

  /**
   * Create a new coupon with normalized code and strict financial rules in PostgreSQL.
   */
  async createCoupon(data: {
    code: string;
    description?: string | null;
    discountType: CouponDiscountType;
    discountValue: number;
    minimumOrderAmount?: number | null;
    maximumDiscount?: number | null;
    maximumDiscountAmount?: number | null;
    startsAt?: string | null;
    expiresAt?: string | null;
    usageLimit?: number | null;
    perCustomerLimit?: number | null;
    isActive?: boolean;
  }) {
    const normalizedCode = normalizeCouponCode(data.code);

    // Check case-insensitive duplicate code
    const existing = await prisma.coupon.findFirst({
      where: {
        code: { equals: normalizedCode, mode: 'insensitive' },
      },
    });

    if (existing) {
      const error: any = new Error(`A coupon with code "${normalizedCode}" already exists.`);
      error.statusCode = 409;
      error.code = 'DUPLICATE_COUPON_CODE';
      throw error;
    }

    if (data.discountValue <= 0) {
      throw createCouponError('Discount value must be greater than zero.', 'INVALID_DISCOUNT_VALUE', 422);
    }

    if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
      throw createCouponError('Percentage discount cannot exceed 100%.', 'INVALID_PERCENTAGE', 422);
    }

    const maxDiscount =
      data.maximumDiscount !== undefined
        ? data.maximumDiscount
        : data.maximumDiscountAmount !== undefined
        ? data.maximumDiscountAmount
        : null;

    if (maxDiscount !== null && maxDiscount <= 0) {
      throw createCouponError('Maximum discount must be greater than zero.', 'INVALID_MAX_DISCOUNT', 422);
    }

    if (data.minimumOrderAmount !== undefined && data.minimumOrderAmount !== null && data.minimumOrderAmount < 0) {
      throw createCouponError('Minimum order amount cannot be negative.', 'INVALID_MIN_ORDER', 422);
    }

    if (data.startsAt && data.expiresAt) {
      const startMs = new Date(data.startsAt).getTime();
      const endMs = new Date(data.expiresAt).getTime();
      if (startMs >= endMs) {
        throw createCouponError('Expiry date must be later than start date.', 'INVALID_DATE_RANGE', 422);
      }
    }

    const created = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        description: data.description?.trim() || null,
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        minimumOrderAmount:
          data.minimumOrderAmount !== undefined && data.minimumOrderAmount !== null
            ? Number(data.minimumOrderAmount)
            : null,
        maximumDiscount: maxDiscount !== null ? Number(maxDiscount) : null,
        usageLimit:
          data.usageLimit !== undefined && data.usageLimit !== null ? Number(data.usageLimit) : null,
        perCustomerLimit:
          data.perCustomerLimit !== undefined && data.perCustomerLimit !== null
            ? Number(data.perCustomerLimit)
            : null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive ?? true,
      },
    });

    return this.formatAdminCoupon(created);
  }

  /**
   * Update an existing coupon's allowed attributes directly in PostgreSQL.
   * Historical orders that already used the coupon retain their snapshot discount values.
   */
  async updateCoupon(
    id: string,
    data: {
      description?: string | null;
      discountType?: CouponDiscountType;
      discountValue?: number;
      minimumOrderAmount?: number | null;
      maximumDiscount?: number | null;
      maximumDiscountAmount?: number | null;
      startsAt?: string | null;
      expiresAt?: string | null;
      usageLimit?: number | null;
      perCustomerLimit?: number | null;
      isActive?: boolean;
    }
  ) {
    const existing = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existing) {
      const error: any = new Error('Coupon not found.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const nextDiscountType = data.discountType ?? existing.discountType;
    const nextDiscountValue =
      data.discountValue !== undefined ? Number(data.discountValue) : existing.discountValue;

    if (nextDiscountValue <= 0) {
      throw createCouponError('Discount value must be greater than zero.', 'INVALID_DISCOUNT_VALUE', 422);
    }

    if (nextDiscountType === 'PERCENTAGE' && nextDiscountValue > 100) {
      throw createCouponError('Percentage discount cannot exceed 100%.', 'INVALID_PERCENTAGE', 422);
    }

    const nextStartsAt =
      data.startsAt !== undefined
        ? data.startsAt
          ? new Date(data.startsAt)
          : null
        : existing.startsAt;

    const nextExpiresAt =
      data.expiresAt !== undefined
        ? data.expiresAt
          ? new Date(data.expiresAt)
          : null
        : existing.expiresAt;

    if (nextStartsAt && nextExpiresAt) {
      const startMs = nextStartsAt.getTime();
      const endMs = nextExpiresAt.getTime();
      if (startMs >= endMs) {
        throw createCouponError('Expiry date must be later than start date.', 'INVALID_DATE_RANGE', 422);
      }
    }

    const hasMaxDiscountUpdate =
      data.maximumDiscount !== undefined || data.maximumDiscountAmount !== undefined;
    const nextMaxDiscount = hasMaxDiscountUpdate
      ? data.maximumDiscount !== undefined
        ? data.maximumDiscount
        : data.maximumDiscountAmount ?? null
      : existing.maximumDiscount;

    if (nextMaxDiscount !== null && nextMaxDiscount !== undefined && nextMaxDiscount <= 0) {
      throw createCouponError('Maximum discount must be greater than zero.', 'INVALID_MAX_DISCOUNT', 422);
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        description:
          data.description !== undefined
            ? data.description
              ? data.description.trim()
              : null
            : existing.description,
        discountType: nextDiscountType,
        discountValue: nextDiscountValue,
        minimumOrderAmount:
          data.minimumOrderAmount !== undefined
            ? data.minimumOrderAmount !== null
              ? Number(data.minimumOrderAmount)
              : null
            : existing.minimumOrderAmount,
        maximumDiscount: nextMaxDiscount !== null && nextMaxDiscount !== undefined ? Number(nextMaxDiscount) : null,
        usageLimit:
          data.usageLimit !== undefined
            ? data.usageLimit !== null
              ? Number(data.usageLimit)
              : null
            : existing.usageLimit,
        perCustomerLimit:
          data.perCustomerLimit !== undefined
            ? data.perCustomerLimit !== null
              ? Number(data.perCustomerLimit)
              : null
            : existing.perCustomerLimit,
        startsAt: nextStartsAt,
        expiresAt: nextExpiresAt,
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      },
    });

    return this.formatAdminCoupon(updated);
  }

  /**
   * List customer notifications with server-side pagination and filters (status, channel, type, orderId, search, date range).
   * Never exposes provider secrets or raw credentials.
   */
  async getNotifications(params: {
    page?: number;
    limit?: number;
    status?: NotificationStatus;
    channel?: NotificationChannel;
    type?: NotificationType;
    orderId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const andConditions: Prisma.NotificationWhereInput[] = [];

    if (params.status) {
      andConditions.push({ status: params.status });
    }
    if (params.channel) {
      andConditions.push({ channel: params.channel });
    }
    if (params.type) {
      andConditions.push({ type: params.type });
    }
    if (params.orderId) {
      const qOrder = params.orderId.trim();
      if (qOrder) {
        andConditions.push({
          OR: [
            { orderId: qOrder },
            { order: { orderNumber: { contains: qOrder, mode: 'insensitive' } } },
          ],
        });
      }
    }
    if (params.search) {
      const q = params.search.trim();
      if (q) {
        andConditions.push({
          OR: [
            { recipient: { contains: q, mode: 'insensitive' } },
            { subject: { contains: q, mode: 'insensitive' } },
            { providerMessageId: { contains: q, mode: 'insensitive' } },
            { order: { orderNumber: { contains: q, mode: 'insensitive' } } },
            { user: { name: { contains: q, mode: 'insensitive' } } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
          ],
        });
      }
    }
    if (params.startDate || params.endDate) {
      const createdAtFilter: Prisma.DateTimeFilter = {};
      if (params.startDate) {
        createdAtFilter.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        createdAtFilter.lte = new Date(params.endDate);
      }
      andConditions.push({ createdAt: createdAtFilter });
    }

    const where: Prisma.NotificationWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [total, notifications, sentCount, failedCount, pendingCount] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          idempotencyKey: true,
          userId: true,
          orderId: true,
          type: true,
          channel: true,
          status: true,
          recipient: true,
          subject: true,
          provider: true,
          providerMessageId: true,
          errorMessage: true,
          attemptCount: true,
          lastAttemptAt: true,
          sentAt: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              paymentStatus: true,
              totalAmount: true,
            },
          },
        },
      }),
      prisma.notification.count({ where: { status: 'SENT' } }),
      prisma.notification.count({ where: { status: 'FAILED' } }),
      prisma.notification.count({ where: { status: { in: ['PENDING', 'SENDING'] } } }),
    ]);

    return {
      notifications,
      summary: {
        totalNotifications: sentCount + failedCount + pendingCount,
        sentCount,
        failedCount,
        pendingCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single notification details by ID for admin inspection.
   */
  async getNotificationById(id: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: {
        id: true,
        idempotencyKey: true,
        userId: true,
        orderId: true,
        type: true,
        channel: true,
        status: true,
        recipient: true,
        subject: true,
        provider: true,
        providerMessageId: true,
        errorMessage: true,
        attemptCount: true,
        lastAttemptAt: true,
        sentAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            shippingStatus: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!notification) {
      const error: any = new Error('Notification record not found.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return notification;
  }
}
