// backend/src/services/growth/customerSegmentation.service.ts
import prisma from '../../lib/prisma.js';
import { customerLifecycleService } from './customerLifecycle.service.js';

export interface CustomerSegmentSummary {
  key: string;
  name: string;
  description: string;
  count: number;
}

export interface CustomerFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  segment?: string;
  lifecycleState?: string;
  minOrders?: number;
  maxOrders?: number;
  minSpend?: number;
  maxSpend?: number;
  hasWishlist?: boolean;
  hasReviews?: boolean;
  minLoyaltyBalance?: number;
}

const QUALIFYING_ORDER_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const QUALIFYING_PAYMENT_STATUS = 'CAPTURED';

export class CustomerSegmentationService {
  /**
   * Return metadata and live count for all server-side defined segments.
   */
  public async getSegmentSummaries(): Promise<CustomerSegmentSummary[]> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const hundredTwentyDaysAgo = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch base customer aggregation data efficiently in single queries
    const [
      totalCustomers,
      usersWithOrders,
      highValueUsers,
      recentBuyerUsers,
      couponUsers,
      wishlistUsers,
      reviewers,
      referralUsers,
      loyaltyUsers,
      abandonedCartUsers,
    ] = await Promise.all([
      // Total customers
      prisma.user.count({ where: { role: 'CUSTOMER' } }),

      // Users grouped by qualifying orders
      prisma.order.groupBy({
        by: ['userId'],
        where: {
          status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
          paymentStatus: QUALIFYING_PAYMENT_STATUS,
        },
        _count: { id: true },
        _sum: { totalAmount: true },
        _max: { createdAt: true },
      }),

      // High value users (lifetime spend >= 2000)
      prisma.order.groupBy({
        by: ['userId'],
        where: {
          status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
          paymentStatus: QUALIFYING_PAYMENT_STATUS,
        },
        _sum: { totalAmount: true },
        having: {
          totalAmount: { _sum: { gte: 2000 } },
        },
      }),

      // Recent buyers (last order <= 14 days)
      prisma.order.groupBy({
        by: ['userId'],
        where: {
          status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
          paymentStatus: QUALIFYING_PAYMENT_STATUS,
          createdAt: { gte: fourteenDaysAgo },
        },
      }),

      // Coupon users
      prisma.order.groupBy({
        by: ['userId'],
        where: {
          status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
          discountAmount: { gt: 0 },
        },
      }),

      // Wishlist users
      prisma.wishlist.count({
        where: { items: { some: {} } },
      }),

      // Reviewers
      prisma.review.groupBy({
        by: ['userId'],
      }),

      // Referral customers
      prisma.user.count({
        where: {
          OR: [{ sentReferrals: { some: {} } }, { receivedReferral: { isNot: null } }],
        },
      }),

      // Loyalty users (>= 10 points)
      prisma.loyaltyAccount.count({
        where: { availableBalance: { gte: 10 } },
      }),

      // Cart abandoners: cart has items, updated >= 24h ago
      prisma.cart.count({
        where: {
          items: { some: {} },
          updatedAt: { lte: twentyFourHoursAgo },
        },
      }),
    ]);

    // Segment counts computed from order groupings
    const userOrderMap = new Map<string, { count: number; spend: number; lastOrder: Date }>();
    for (const g of usersWithOrders) {
      userOrderMap.set(g.userId, {
        count: g._count.id,
        spend: g._sum.totalAmount || 0,
        lastOrder: g._max.createdAt || new Date(0),
      });
    }

    let firstTimeCount = 0;
    let repeatCount = 0;
    let atRiskCount = 0;
    let dormantCount = 0;

    for (const [, info] of userOrderMap.entries()) {
      if (info.count === 1) firstTimeCount++;
      if (info.count >= 2) repeatCount++;

      if (info.lastOrder <= hundredTwentyDaysAgo) {
        dormantCount++;
      } else if (info.lastOrder <= sixtyDaysAgo) {
        atRiskCount++;
      }
    }

    // New customers: registered <= 30 days ago with 0 orders
    const newCustomersCount = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: thirtyDaysAgo },
        orders: {
          none: {
            status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
            paymentStatus: QUALIFYING_PAYMENT_STATUS,
          },
        },
      },
    });

    const nonCouponBuyersCount = Math.max(0, usersWithOrders.length - couponUsers.length);

    return [
      {
        key: 'all_customers',
        name: 'All Registered Customers',
        description: 'All customer accounts in the database',
        count: totalCustomers,
      },
      {
        key: 'new_customers',
        name: 'New Customers',
        description: 'Registered within the last 30 days with no qualifying orders',
        count: newCustomersCount,
      },
      {
        key: 'first_time_buyers',
        name: 'First-Time Buyers',
        description: 'Customers with exactly one completed qualifying order',
        count: firstTimeCount,
      },
      {
        key: 'repeat_customers',
        name: 'Repeat Customers',
        description: 'Customers with 2 or more qualifying completed orders',
        count: repeatCount,
      },
      {
        key: 'high_value_customers',
        name: 'High-Value Customers',
        description: 'Customers with lifetime spend of ₹2,000 or greater',
        count: highValueUsers.length,
      },
      {
        key: 'recent_buyers',
        name: 'Recent Buyers',
        description: 'Customers who placed an order within the last 14 days',
        count: recentBuyerUsers.length,
      },
      {
        key: 'at_risk_customers',
        name: 'At-Risk Customers',
        description: 'Customers whose last purchase was between 60 and 120 days ago',
        count: atRiskCount,
      },
      {
        key: 'dormant_customers',
        name: 'Dormant Customers',
        description: 'Customers with no purchases for over 120 days',
        count: dormantCount,
      },
      {
        key: 'coupon_users',
        name: 'Coupon Users',
        description: 'Customers who have used at least one promotional coupon',
        count: couponUsers.length,
      },
      {
        key: 'non_coupon_buyers',
        name: 'Full-Price Buyers',
        description: 'Paying customers who have never used a coupon discount',
        count: nonCouponBuyersCount,
      },
      {
        key: 'wishlist_users',
        name: 'Active Wishlist Users',
        description: 'Customers with items saved in their personal wishlist',
        count: wishlistUsers,
      },
      {
        key: 'reviewers',
        name: 'Product Reviewers',
        description: 'Customers who have authored at least one product review',
        count: reviewers.length,
      },
      {
        key: 'referral_customers',
        name: 'Referral Participants',
        description: 'Customers who have sent or received a customer referral',
        count: referralUsers,
      },
      {
        key: 'loyalty_users',
        name: 'Loyalty Point Holders',
        description: 'Customers with 10 or more available loyalty points',
        count: loyaltyUsers,
      },
      {
        key: 'cart_abandoners',
        name: 'Cart Inactivity / Abandoners',
        description: 'Customers with items in cart inactive for 24+ hours',
        count: abandonedCartUsers,
      },
    ];
  }

  /**
   * Return array of user IDs belonging to a specified segment.
   */
  public async getSegmentUserIds(segmentKey: string): Promise<string[]> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const hundredTwentyDaysAgo = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    switch (segmentKey) {
      case 'all_customers': {
        const users = await prisma.user.findMany({
          where: { role: 'CUSTOMER' },
          select: { id: true },
        });
        return users.map((u) => u.id);
      }

      case 'new_customers': {
        const users = await prisma.user.findMany({
          where: {
            role: 'CUSTOMER',
            createdAt: { gte: thirtyDaysAgo },
            orders: {
              none: {
                status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
                paymentStatus: QUALIFYING_PAYMENT_STATUS,
              },
            },
          },
          select: { id: true },
        });
        return users.map((u) => u.id);
      }

      case 'first_time_buyers': {
        const groups = await prisma.order.groupBy({
          by: ['userId'],
          where: {
            status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
            paymentStatus: QUALIFYING_PAYMENT_STATUS,
          },
          having: { id: { _count: { equals: 1 } } },
        });
        return groups.map((g) => g.userId);
      }

      case 'repeat_customers': {
        const groups = await prisma.order.groupBy({
          by: ['userId'],
          where: {
            status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
            paymentStatus: QUALIFYING_PAYMENT_STATUS,
          },
          having: { id: { _count: { gte: 2 } } },
        });
        return groups.map((g) => g.userId);
      }

      case 'high_value_customers': {
        const groups = await prisma.order.groupBy({
          by: ['userId'],
          where: {
            status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
            paymentStatus: QUALIFYING_PAYMENT_STATUS,
          },
          having: { totalAmount: { _sum: { gte: 2000 } } },
        });
        return groups.map((g) => g.userId);
      }

      case 'recent_buyers': {
        const groups = await prisma.order.groupBy({
          by: ['userId'],
          where: {
            status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
            paymentStatus: QUALIFYING_PAYMENT_STATUS,
            createdAt: { gte: fourteenDaysAgo },
          },
        });
        return groups.map((g) => g.userId);
      }

      case 'at_risk_customers': {
        const groups = await prisma.order.groupBy({
          by: ['userId'],
          where: {
            status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
            paymentStatus: QUALIFYING_PAYMENT_STATUS,
          },
          _max: { createdAt: true },
        });
        return groups
          .filter((g) => {
            const last = g._max.createdAt;
            return last && last <= sixtyDaysAgo && last > hundredTwentyDaysAgo;
          })
          .map((g) => g.userId);
      }

      case 'dormant_customers': {
        const groups = await prisma.order.groupBy({
          by: ['userId'],
          where: {
            status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
            paymentStatus: QUALIFYING_PAYMENT_STATUS,
          },
          _max: { createdAt: true },
        });
        return groups
          .filter((g) => {
            const last = g._max.createdAt;
            return last && last <= hundredTwentyDaysAgo;
          })
          .map((g) => g.userId);
      }

      case 'coupon_users': {
        const groups = await prisma.order.groupBy({
          by: ['userId'],
          where: {
            status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
            discountAmount: { gt: 0 },
          },
        });
        return groups.map((g) => g.userId);
      }

      case 'non_coupon_buyers': {
        const allBuyers = await prisma.order.groupBy({
          by: ['userId'],
          where: {
            status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
            paymentStatus: QUALIFYING_PAYMENT_STATUS,
          },
        });
        const couponBuyers = new Set(
          (
            await prisma.order.groupBy({
              by: ['userId'],
              where: {
                status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
                discountAmount: { gt: 0 },
              },
            })
          ).map((g) => g.userId)
        );
        return allBuyers.filter((b) => !couponBuyers.has(b.userId)).map((b) => b.userId);
      }

      case 'wishlist_users': {
        const wishlists = await prisma.wishlist.findMany({
          where: { items: { some: {} } },
          select: { userId: true },
        });
        return wishlists.map((w) => w.userId);
      }

      case 'reviewers': {
        const groups = await prisma.review.groupBy({
          by: ['userId'],
        });
        return groups.map((g) => g.userId);
      }

      case 'referral_customers': {
        const users = await prisma.user.findMany({
          where: {
            OR: [{ sentReferrals: { some: {} } }, { receivedReferral: { isNot: null } }],
          },
          select: { id: true },
        });
        return users.map((u) => u.id);
      }

      case 'loyalty_users': {
        const accounts = await prisma.loyaltyAccount.findMany({
          where: { availableBalance: { gte: 10 } },
          select: { userId: true },
        });
        return accounts.map((a) => a.userId);
      }

      case 'cart_abandoners': {
        const carts = await prisma.cart.findMany({
          where: {
            items: { some: {} },
            updatedAt: { lte: twentyFourHoursAgo },
          },
          select: { userId: true },
        });
        return carts.map((c) => c.userId);
      }

      default:
        return [];
    }
  }

  /**
   * Paginated CRM customer listing with server-side filters.
   */
  public async listCustomers(query: CustomerFilterQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { role: 'CUSTOMER' };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.segment) {
      const segmentUserIds = await this.getSegmentUserIds(query.segment);
      where.id = { in: segmentUserIds };
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          preferences: {
            select: {
              marketingEmailOptIn: true,
              marketingWhatsAppOptIn: true,
            },
          },
          loyaltyAccount: {
            select: { availableBalance: true },
          },
          wishlist: {
            select: { _count: { select: { items: true } } },
          },
          reviews: {
            select: { id: true },
          },
          orders: {
            where: {
              status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
              paymentStatus: QUALIFYING_PAYMENT_STATUS,
            },
            select: {
              id: true,
              totalAmount: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const items = users.map((u) => {
      const qualifyingOrders = u.orders;
      const orderCount = qualifyingOrders.length;
      const totalSpend = Number(qualifyingOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2));
      const lastOrderDate = qualifyingOrders[0]?.createdAt || null;

      const lifecycleState = customerLifecycleService.evaluateState({
        createdAt: u.createdAt,
        qualifyingOrderCount: orderCount,
        lifetimeSpend: totalSpend,
        lastOrderDate,
      });

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        createdAt: u.createdAt,
        lifecycleState,
        orderCount,
        totalSpend,
        lastOrderDate,
        loyaltyBalance: u.loyaltyAccount?.availableBalance || 0,
        wishlistItemsCount: u.wishlist?._count?.items || 0,
        reviewsCount: u.reviews.length,
        marketingEmailOptIn: u.preferences?.marketingEmailOptIn ?? true,
        marketingWhatsAppOptIn: u.preferences?.marketingWhatsAppOptIn ?? false,
      };
    });

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Return single customer growth and marketing profile.
   */
  public async getCustomerDetail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        preferences: true,
        loyaltyAccount: true,
        wishlist: {
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, name: true, price: true, sku: true },
                },
              },
            },
          },
        },
        cartRecoveries: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        campaignRecipients: {
          include: {
            campaign: {
              select: { id: true, name: true, channel: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        orders: {
          where: {
            status: { in: [...QUALIFYING_ORDER_STATUSES] as any },
            paymentStatus: QUALIFYING_PAYMENT_STATUS,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) return null;

    const lifecycle = await customerLifecycleService.getCustomerLifecycle(user.id);

    return {
      customer: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      lifecycle,
      preferences: user.preferences || {
        marketingEmailOptIn: true,
        marketingWhatsAppOptIn: false,
      },
      loyalty: user.loyaltyAccount,
      wishlist: user.wishlist?.items || [],
      recentRecoveries: user.cartRecoveries,
      recentCampaignDeliveries: user.campaignRecipients,
      qualifyingOrdersCount: user.orders.length,
    };
  }
}

export const customerSegmentationService = new CustomerSegmentationService();
