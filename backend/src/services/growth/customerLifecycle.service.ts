// backend/src/services/growth/customerLifecycle.service.ts
import prisma from '../../lib/prisma.js';

export type CustomerLifecycleState =
  | 'NEW'
  | 'PROSPECT'
  | 'FIRST_PURCHASE'
  | 'ACTIVE'
  | 'REPEAT_CUSTOMER'
  | 'LOYAL'
  | 'AT_RISK'
  | 'DORMANT';

export interface CustomerLifecycleProfile {
  userId: string;
  lifecycleState: CustomerLifecycleState;
  qualifyingOrderCount: number;
  lifetimeSpend: number;
  firstOrderDate: Date | null;
  lastOrderDate: Date | null;
  daysSinceLastOrder: number | null;
  daysSinceRegistration: number;
}

const QUALIFYING_ORDER_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;
const QUALIFYING_PAYMENT_STATUS = 'CAPTURED';

/**
 * Customer Lifecycle Service
 * Computes deterministic customer lifecycle states using authoritative PostgreSQL data.
 * Zero fabricated states or arbitrary guesses.
 */
export class CustomerLifecycleService {
  /**
   * Determine the lifecycle state for a given user profile.
   */
  public evaluateState(params: {
    createdAt: Date;
    qualifyingOrderCount: number;
    lifetimeSpend: number;
    lastOrderDate: Date | null;
    now?: Date;
  }): CustomerLifecycleState {
    const now = params.now || new Date();
    const daysSinceRegistration = Math.max(
      0,
      Math.floor((now.getTime() - params.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    );

    const daysSinceLastOrder = params.lastOrderDate
      ? Math.max(0, Math.floor((now.getTime() - params.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    // 1. Users with 0 qualifying orders
    if (params.qualifyingOrderCount === 0) {
      if (daysSinceRegistration <= 30) {
        return 'NEW';
      }
      if (daysSinceRegistration > 90) {
        return 'DORMANT';
      }
      return 'PROSPECT';
    }

    // 2. Customers who have ordered
    // Check inactivity boundaries first
    if (daysSinceLastOrder !== null && daysSinceLastOrder > 120) {
      return 'DORMANT';
    }

    if (daysSinceLastOrder !== null && daysSinceLastOrder >= 60) {
      return 'AT_RISK';
    }

    // High engagement / loyalty: >=3 orders OR >=₹2500 lifetime spend within 60 days
    if (params.qualifyingOrderCount >= 3 || (params.lifetimeSpend >= 2500 && (daysSinceLastOrder ?? 0) <= 60)) {
      return 'LOYAL';
    }

    // Repeat customers: >=2 orders
    if (params.qualifyingOrderCount >= 2) {
      return 'REPEAT_CUSTOMER';
    }

    // Exactly 1 order placed recently (within 30 days)
    if (params.qualifyingOrderCount === 1) {
      if (daysSinceLastOrder !== null && daysSinceLastOrder <= 30) {
        return 'FIRST_PURCHASE';
      }
      return 'ACTIVE';
    }

    return 'ACTIVE';
  }

  /**
   * Fetch customer lifecycle profile for a specific user ID.
   */
  public async getCustomerLifecycle(userId: string): Promise<CustomerLifecycleProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        orders: {
          where: {
            status: { in: [...QUALIFYING_ORDER_STATUSES] },
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
    });

    if (!user) return null;

    const qualifyingOrders = user.orders;
    const qualifyingOrderCount = qualifyingOrders.length;
    const lifetimeSpend = qualifyingOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const lastOrderDate = qualifyingOrders[0]?.createdAt || null;
    const firstOrderDate = qualifyingOrders[qualifyingOrders.length - 1]?.createdAt || null;

    const now = new Date();
    const daysSinceRegistration = Math.max(
      0,
      Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    );
    const daysSinceLastOrder = lastOrderDate
      ? Math.max(0, Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    const lifecycleState = this.evaluateState({
      createdAt: user.createdAt,
      qualifyingOrderCount,
      lifetimeSpend,
      lastOrderDate,
      now,
    });

    return {
      userId: user.id,
      lifecycleState,
      qualifyingOrderCount,
      lifetimeSpend: Number(lifetimeSpend.toFixed(2)),
      firstOrderDate,
      lastOrderDate,
      daysSinceLastOrder,
      daysSinceRegistration,
    };
  }
}

export const customerLifecycleService = new CustomerLifecycleService();
