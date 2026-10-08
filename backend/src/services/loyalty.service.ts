// backend/src/services/loyalty.service.ts
import { LoyaltyTransactionType, Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { notificationService } from './notification/notification.service.js';

export const LOYALTY_RULES = {
  POINTS_PER_100_INR: 1, // ₹100 spent = 1 point
  POINT_VALUE_INR: 1, // 1 point = ₹1
  MAX_REDEMPTION_PERCENT: 20, // Max 20% of subtotal can be redeemed via points
};

export class LoyaltyService {
  /**
   * Get or create loyalty account for customer.
   */
  async getAccount(userId: string) {
    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: {
          userId,
          availableBalance: 0,
          lifetimeEarned: 0,
          lifetimeRedeemed: 0,
        },
      });
    }

    return {
      userId: account.userId,
      availableBalance: account.availableBalance,
      lifetimeEarned: account.lifetimeEarned,
      lifetimeRedeemed: account.lifetimeRedeemed,
      pointValueInr: LOYALTY_RULES.POINT_VALUE_INR,
      maxRedemptionPercent: LOYALTY_RULES.MAX_REDEMPTION_PERCENT,
    };
  }

  /**
   * Get paginated ledger history for customer.
   */
  async getTransactions(userId: string, query: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Math.max(1, Number(query.limit) || 10), 50);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.loyaltyTransaction.count({
        where: { userId },
      }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Award loyalty points upon qualifying fulfilled order.
   * Strictly IDEMPOTENT via unique key `EARN_ORDER:<orderId>`.
   */
  async awardOrderPoints(orderId: string, options?: { notify?: boolean }) {
    const idempotencyKey = `EARN_ORDER:${orderId}`;

    // 1. Check idempotency
    const existingTx = await prisma.loyaltyTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existingTx) {
      return { awarded: false, message: 'Points already awarded for this order', transaction: existingTx };
    }

    // 2. Load qualifying order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, subtotal: true, status: true, paymentStatus: true },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const isQualifying =
      order.status === 'CONFIRMED' ||
      order.status === 'DELIVERED' ||
      order.paymentStatus === 'CAPTURED';

    if (!isQualifying) {
      return { awarded: false, message: 'Order has not reached qualifying fulfilled state' };
    }

    // 3. Compute points: ₹100 spent = 1 point
    const pointsToAward = Math.floor(order.subtotal / 100) * LOYALTY_RULES.POINTS_PER_100_INR;
    if (pointsToAward <= 0) {
      return { awarded: false, message: 'Order subtotal does not qualify for points' };
    }

    // 4. Atomically update ledger & balance
    const result = await prisma.$transaction(async (tx) => {
      // Ensure account exists
      const account = await tx.loyaltyAccount.upsert({
        where: { userId: order.userId },
        update: {
          availableBalance: { increment: pointsToAward },
          lifetimeEarned: { increment: pointsToAward },
        },
        create: {
          userId: order.userId,
          availableBalance: pointsToAward,
          lifetimeEarned: pointsToAward,
          lifetimeRedeemed: 0,
        },
      });

      const transaction = await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          userId: order.userId,
          type: LoyaltyTransactionType.EARN_ORDER,
          points: pointsToAward,
          referenceType: 'ORDER',
          referenceId: order.id,
          idempotencyKey,
          description: `Earned ${pointsToAward} points from order ${orderId}`,
        },
      });

      return { account, transaction };
    });

    // 5. Trigger notification asynchronously only if explicitly requested
    if (options?.notify) {
      notificationService.dispatchOrderEventAsync({
        orderId: order.id,
        type: 'LOYALTY_REWARD',
      });
    }

    return { awarded: true, points: pointsToAward, transaction: result.transaction };
  }

  /**
   * Reverse loyalty points upon refund of an order.
   * Strictly IDEMPOTENT via `REFUND_REVERSAL:<orderId>:<refundId>`.
   */
  async reverseOrderPoints(orderId: string, refundId?: string) {
    const idempotencyKey = `REFUND_REVERSAL:${orderId}:${refundId || 'all'}`;

    const existingTx = await prisma.loyaltyTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existingTx) {
      return { reversed: false, message: 'Points reversal already processed' };
    }

    // Find original earn transaction for this order
    const earnTx = await prisma.loyaltyTransaction.findUnique({
      where: { idempotencyKey: `EARN_ORDER:${orderId}` },
    });

    if (!earnTx) {
      return { reversed: false, message: 'No points were awarded for this order' };
    }

    const pointsToReverse = earnTx.points;

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.loyaltyAccount.findUnique({
        where: { userId: earnTx.userId },
      });

      if (!account) return null;

      // Available balance cannot go below 0
      const newBalance = Math.max(0, account.availableBalance - pointsToReverse);

      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: { availableBalance: newBalance },
      });

      const reversalTx = await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          userId: earnTx.userId,
          type: LoyaltyTransactionType.REFUND_REVERSAL,
          points: -pointsToReverse,
          referenceType: 'REFUND',
          referenceId: refundId || orderId,
          idempotencyKey,
          description: `Reversal of ${pointsToReverse} points due to refund on order ${orderId}`,
        },
      });

      return reversalTx;
    });

    return { reversed: true, pointsReversed: pointsToReverse, transaction: result };
  }

  /**
   * Authoritatively calculate loyalty redemption discount for an order.
   * Server derives all values: available points, max allowed redemption, rupee value.
   */
  async calculateRedemption(userId: string, subtotal: number, requestedPoints?: number) {
    const account = await this.getAccount(userId);
    const available = account.availableBalance;

    if (available <= 0 || !requestedPoints || requestedPoints <= 0) {
      return {
        pointsRedeemed: 0,
        discountAmount: 0,
        availablePoints: available,
        maxRedeemablePoints: 0,
      };
    }

    // Maximum allowed redemption: up to 20% of subtotal
    const maxDiscountInr = Math.floor(subtotal * (LOYALTY_RULES.MAX_REDEMPTION_PERCENT / 100));
    const maxRedeemablePoints = Math.min(available, Math.floor(maxDiscountInr / LOYALTY_RULES.POINT_VALUE_INR));

    // Clamp requested points between 0 and maxRedeemablePoints
    const pointsRedeemed = Math.min(Math.floor(requestedPoints), maxRedeemablePoints);
    const discountAmount = pointsRedeemed * LOYALTY_RULES.POINT_VALUE_INR;
    const netSubtotal = Math.max(0, subtotal - discountAmount);

    return {
      pointsRedeemed,
      pointsToRedeem: pointsRedeemed,
      discountAmount,
      discountInr: discountAmount,
      availablePoints: available,
      availableBalance: available,
      maxRedeemablePoints,
      maxRedemptionPoints: maxRedeemablePoints,
      netSubtotal,
    };
  }

  /**
   * Execute loyalty redemption atomically during order creation within a transaction.
   */
  async executeRedemption(
    tx: Prisma.TransactionClient,
    userId: string,
    orderId: string,
    pointsToRedeem: number
  ) {
    if (pointsToRedeem <= 0) return null;

    const account = await tx.loyaltyAccount.findUnique({
      where: { userId },
    });

    if (!account || account.availableBalance < pointsToRedeem) {
      throw new BadRequestError('Insufficient loyalty points balance');
    }

    const idempotencyKey = `REDEEM_ORDER:${orderId}`;

    await tx.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        availableBalance: { decrement: pointsToRedeem },
        lifetimeRedeemed: { increment: pointsToRedeem },
      },
    });

    return await tx.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        userId,
        type: LoyaltyTransactionType.REDEEM_ORDER,
        points: -pointsToRedeem,
        referenceType: 'ORDER',
        referenceId: orderId,
        idempotencyKey,
        description: `Redeemed ${pointsToRedeem} points on order ${orderId}`,
      },
    });
  }
}

export const loyaltyService = new LoyaltyService();
