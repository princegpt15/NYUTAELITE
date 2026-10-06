// backend/src/services/admin.service.ts
import prisma from '../lib/prisma.js';
import type { Prisma, OrderStatus, ShippingStatus, PaymentStatus } from '@prisma/client';

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
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
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
      if (params.from) where.createdAt.gte = new Date(params.from);
      if (params.to) where.createdAt.lte = new Date(params.to);
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

    return {
      orders,
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
      include: {
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
          include: {
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
      const error: any = new Error('Order not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return order;
  }

  /**
   * Update order fulfillment / shipping status with transition validation.
   */
  async updateOrderStatus(id: string, data: { orderStatus?: OrderStatus; shippingStatus?: ShippingStatus }) {
    const existing = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, shippingStatus: true, orderNumber: true },
    });

    if (!existing) {
      const error: any = new Error('Order not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Validate state transitions
    if (data.orderStatus) {
      if (existing.status === 'CANCELLED' && data.orderStatus !== 'CANCELLED') {
        const error: any = new Error('Cannot reactivate a cancelled order');
        error.statusCode = 400;
        error.code = 'INVALID_STATE_TRANSITION';
        throw error;
      }
      if (existing.status === 'DELIVERED' && ['PENDING', 'PROCESSING', 'CANCELLED'].includes(data.orderStatus)) {
        const error: any = new Error('Cannot revert a delivered order to an earlier state');
        error.statusCode = 400;
        error.code = 'INVALID_STATE_TRANSITION';
        throw error;
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(data.orderStatus ? { status: data.orderStatus } : {}),
        ...(data.shippingStatus ? { shippingStatus: data.shippingStatus } : {}),
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

    return payment;
  }
}
