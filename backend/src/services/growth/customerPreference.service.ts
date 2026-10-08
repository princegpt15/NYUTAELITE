// backend/src/services/growth/customerPreference.service.ts
import crypto from 'crypto';
import prisma from '../../lib/prisma.js';

export interface MarketingEligibilityResult {
  allowed: boolean;
  reason: string | null;
  optIn: boolean;
  frequencyCount: number;
}

export const MAX_MARKETING_MESSAGES_PER_WINDOW = 3;
export const FREQUENCY_WINDOW_DAYS = 7;

export class CustomerPreferenceService {
  /**
   * Get or initialize customer preferences.
   * Default: marketingEmailOptIn=true, marketingWhatsAppOptIn=false.
   */
  public async getPreferences(userId: string) {
    let pref = await prisma.customerPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await prisma.customerPreference.create({
        data: {
          userId,
          marketingEmailOptIn: true,
          marketingWhatsAppOptIn: false,
          unsubscribeToken: crypto.randomUUID(),
        },
      });
    }

    return pref;
  }

  /**
   * Update preferences for an authenticated customer.
   */
  public async updatePreferences(
    userId: string,
    data: {
      marketingEmailOptIn?: boolean;
      marketingWhatsAppOptIn?: boolean;
    }
  ) {
    const existing = await this.getPreferences(userId);

    const updated = await prisma.customerPreference.update({
      where: { id: existing.id },
      data: {
        marketingEmailOptIn:
          data.marketingEmailOptIn !== undefined ? Boolean(data.marketingEmailOptIn) : existing.marketingEmailOptIn,
        marketingWhatsAppOptIn:
          data.marketingWhatsAppOptIn !== undefined
            ? Boolean(data.marketingWhatsAppOptIn)
            : existing.marketingWhatsAppOptIn,
        unsubscribedAt:
          data.marketingEmailOptIn === false && existing.marketingEmailOptIn
            ? new Date()
            : existing.unsubscribedAt,
      },
    });

    return updated;
  }

  /**
   * Public 1-click unsubscribe via secure unguessable token.
   */
  public async unsubscribeByToken(token: string, channel: 'EMAIL' | 'WHATSAPP' = 'EMAIL') {
    if (!token || typeof token !== 'string') {
      return { success: false, message: 'Invalid or missing unsubscribe token' };
    }

    const pref = await prisma.customerPreference.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!pref) {
      return { success: false, message: 'Invalid unsubscribe token' };
    }

    const updateData: any = {
      unsubscribedAt: new Date(),
    };

    if (channel === 'EMAIL' || !channel) {
      updateData.marketingEmailOptIn = false;
    }
    if (channel === 'WHATSAPP') {
      updateData.marketingWhatsAppOptIn = false;
    }

    await prisma.customerPreference.update({
      where: { id: pref.id },
      data: updateData,
    });

    return {
      success: true,
      message: `Successfully unsubscribed from marketing communications.`,
    };
  }

  /**
   * Enforce marketing frequency cap:
   * Maximum 3 marketing messages per customer across the last 7 rolling days.
   * Transactional order notifications are NEVER counted toward marketing frequency.
   */
  public async getMarketingMessageCountInWindow(userId: string): Promise<number> {
    const windowStart = new Date(Date.now() - FREQUENCY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [campaignCount, recoveryCount] = await Promise.all([
      prisma.campaignRecipient.count({
        where: {
          userId,
          status: 'SENT',
          sentAt: { gte: windowStart },
        },
      }),
      prisma.cartRecovery.count({
        where: {
          userId,
          status: 'CONTACTED',
          lastAttemptAt: { gte: windowStart },
        },
      }),
    ]);

    return campaignCount + recoveryCount;
  }

  /**
   * Check if marketing communication can be sent to a user.
   */
  public async checkEligibility(
    userId: string,
    channel: 'EMAIL' | 'WHATSAPP' = 'EMAIL'
  ): Promise<MarketingEligibilityResult> {
    const pref = await this.getPreferences(userId);

    const isOptedIn = channel === 'EMAIL' ? pref.marketingEmailOptIn : pref.marketingWhatsAppOptIn;
    if (!isOptedIn) {
      return {
        allowed: false,
        reason: 'CUSTOMER_OPTED_OUT',
        optIn: false,
        frequencyCount: 0,
      };
    }

    const count = await this.getMarketingMessageCountInWindow(userId);
    if (count >= MAX_MARKETING_MESSAGES_PER_WINDOW) {
      return {
        allowed: false,
        reason: 'FREQUENCY_CAP_EXCEEDED',
        optIn: true,
        frequencyCount: count,
      };
    }

    return {
      allowed: true,
      reason: null,
      optIn: true,
      frequencyCount: count,
    };
  }
}

export const customerPreferenceService = new CustomerPreferenceService();
