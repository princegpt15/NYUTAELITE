// backend/src/services/referral.service.ts
import crypto from 'node:crypto';
import prisma from '../lib/prisma.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';
import { notificationService } from './notification/notification.service.js';

export const REFERRAL_REWARD_POINTS = 50;

export class ReferralService {
  /**
   * Generate a clean, brand-aligned referral code for a customer.
   * Format: NYUTA-<PREFIX><RANDOM4>
   */
  private generateCode(name?: string | null): string {
    const cleanPrefix = (name || 'MITHILA')
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase()
      .slice(0, 4)
      .padEnd(4, 'X');
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `NYUTA-${cleanPrefix}${randomSuffix}`;
  }

  /**
   * Get or generate the customer's unique referral code and referral stats.
   */
  async getReferralInfo(userId: string) {
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, referralCode: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.referralCode) {
      let code = this.generateCode(user.name);
      // Ensure unique code
      let collision = await prisma.user.findUnique({ where: { referralCode: code } });
      while (collision) {
        code = this.generateCode(user.name);
        collision = await prisma.user.findUnique({ where: { referralCode: code } });
      }

      user = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { id: true, name: true, referralCode: true },
      });
    }

    const [totalReferred, qualifiedCount] = await Promise.all([
      prisma.referral.count({ where: { referrerId: userId } }),
      prisma.referral.count({ where: { referrerId: userId, status: 'QUALIFIED' } }),
    ]);

    return {
      referralCode: user.referralCode!,
      shareLink: `https://nutyaelite.com/register?ref=${user.referralCode}`,
      rewardPointsPerReferral: REFERRAL_REWARD_POINTS,
      totalReferred,
      successfulReferrals: qualifiedCount,
      totalPointsEarned: qualifiedCount * REFERRAL_REWARD_POINTS,
    };
  }

  /**
   * Apply a referral code during signup or from account.
   * Strict anti-fraud protections:
   * 1. Rejects self-referral.
   * 2. Rejects duplicate referral (user can only be referred once).
   * 3. Rejects circular referral.
   */
  async applyReferralCode(referredUserId: string, rawCode: string) {
    const code = rawCode.trim().toUpperCase();

    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, name: true },
    });

    if (!referrer) {
      throw new NotFoundError('Invalid referral code');
    }

    if (referrer.id === referredUserId) {
      throw new BadRequestError('Self-referral is not allowed');
    }

    // Check if user has already been referred
    const existing = await prisma.referral.findUnique({
      where: { referredUserId },
    });
    if (existing) {
      throw new ConflictError('You have already applied a referral code');
    }

    // Check circular referral: Did referredUserId previously refer referrer.id?
    const circular = await prisma.referral.findFirst({
      where: {
        referrerId: referredUserId,
        referredUserId: referrer.id,
      },
    });
    if (circular) {
      throw new BadRequestError('Circular referral relationships are not permitted');
    }

    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId,
        referralCode: code,
        status: 'PENDING',
        rewardPoints: REFERRAL_REWARD_POINTS,
      },
    });

    return {
      success: true,
      message: 'Referral code applied. Reward will be credited after your first qualifying order.',
      data: referral,
    };
  }

  /**
   * Qualify and award referral reward when the referred customer completes their first order.
   * Strictly IDEMPOTENT.
   */
  async qualifyReferralForOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true, paymentStatus: true },
    });

    if (!order) return null;

    const isQualifying =
      order.status === 'CONFIRMED' ||
      order.status === 'DELIVERED' ||
      order.paymentStatus === 'CAPTURED';

    if (!isQualifying) return null;

    // Check if this user was referred and has a PENDING referral
    const referral = await prisma.referral.findUnique({
      where: { referredUserId: order.userId },
    });

    if (!referral || referral.status !== 'PENDING') {
      return null;
    }

    const idempotencyKey = `REFERRAL_REWARD:${referral.id}:${order.id}`;

    // Update referral status and credit referrer's loyalty account
    const updated = await prisma.$transaction(async (tx) => {
      const ref = await tx.referral.update({
        where: { id: referral.id },
        data: { status: 'QUALIFIED' },
      });

      // Credit referrer's loyalty account
      const referrerAccount = await tx.loyaltyAccount.upsert({
        where: { userId: referral.referrerId },
        update: {
          availableBalance: { increment: REFERRAL_REWARD_POINTS },
          lifetimeEarned: { increment: REFERRAL_REWARD_POINTS },
        },
        create: {
          userId: referral.referrerId,
          availableBalance: REFERRAL_REWARD_POINTS,
          lifetimeEarned: REFERRAL_REWARD_POINTS,
          lifetimeRedeemed: 0,
        },
      });

      await tx.loyaltyTransaction.create({
        data: {
          accountId: referrerAccount.id,
          userId: referral.referrerId,
          type: 'BONUS',
          points: REFERRAL_REWARD_POINTS,
          referenceType: 'REFERRAL',
          referenceId: referral.id,
          idempotencyKey,
          description: `Referral reward from customer's first order (${order.id})`,
        },
      });

      return ref;
    });

    // Send notification to referrer
    notificationService.dispatchOrderEventAsync({
      orderId: order.id,
      type: 'REFERRAL_REWARD',
    });

    return updated;
  }
}

export const referralService = new ReferralService();
