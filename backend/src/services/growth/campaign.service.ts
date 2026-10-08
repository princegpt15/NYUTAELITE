// backend/src/services/growth/campaign.service.ts
import crypto from 'crypto';
import prisma from '../../lib/prisma.js';
import { emailNotificationProvider } from '../notification/providers/email.provider.js';
import { whatsAppNotificationProvider } from '../notification/providers/whatsapp.provider.js';
import { customerPreferenceService } from './customerPreference.service.js';
import { customerSegmentationService } from './customerSegmentation.service.js';
import { env } from '../../config/env.js';

export interface CreateCampaignDTO {
  name: string;
  description?: string;
  channel?: 'EMAIL' | 'WHATSAPP';
  audience: string;
  subject: string;
  content: string;
  couponCode?: string;
  startsAt?: string;
  endsAt?: string;
  maxRecipients?: number;
  utmCampaign?: string;
}

export interface UpdateCampaignDTO {
  name?: string;
  description?: string;
  channel?: 'EMAIL' | 'WHATSAPP';
  audience?: string;
  subject?: string;
  content?: string;
  couponCode?: string;
  startsAt?: string;
  endsAt?: string;
  maxRecipients?: number;
}

function createCampaignError(message: string, statusCode = 400, code = 'CAMPAIGN_ERROR'): Error {
  const err: any = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

export class CampaignService {
  /**
   * Create a new draft campaign with input validation and coupon verification.
   */
  public async createCampaign(data: CreateCampaignDTO, adminUserId?: string) {
    const channel = data.channel || 'EMAIL';

    // Verify coupon code if supplied
    let verifiedCouponCode: string | null = null;
    if (data.couponCode && data.couponCode.trim()) {
      const normalized = data.couponCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({
        where: { code: normalized },
      });
      if (!coupon) {
        throw createCampaignError(`Referenced coupon code '${normalized}' does not exist.`, 400, 'INVALID_COUPON');
      }
      if (!coupon.isActive) {
        throw createCampaignError(`Referenced coupon code '${normalized}' is not currently active.`, 400, 'INACTIVE_COUPON');
      }
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw createCampaignError(`Referenced coupon code '${normalized}' has expired.`, 400, 'EXPIRED_COUPON');
      }
      verifiedCouponCode = coupon.code;
    }

    const utmCampaign =
      data.utmCampaign ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
        '-' +
        crypto.randomBytes(3).toString('hex');

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim(),
        status: 'DRAFT',
        channel,
        audience: data.audience.trim(),
        subject: data.subject.trim(),
        content: data.content.trim(),
        couponCode: verifiedCouponCode,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        maxRecipients: data.maxRecipients ? Math.max(1, Number(data.maxRecipients)) : null,
        utmCampaign,
        createdBy: adminUserId || null,
      },
    });

    return campaign;
  }

  /**
   * Update draft campaign. Completed or Active campaigns cannot be arbitrarily edited.
   */
  public async updateCampaign(id: string, data: UpdateCampaignDTO) {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    if (campaign.status === 'COMPLETED' || campaign.status === 'ACTIVE') {
      throw new Error(`Cannot modify campaign with status ${campaign.status}`);
    }

    let verifiedCouponCode = campaign.couponCode;
    if (data.couponCode !== undefined) {
      if (data.couponCode && data.couponCode.trim()) {
        const normalized = data.couponCode.trim().toUpperCase();
        const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
        if (!coupon || !coupon.isActive) {
          throw new Error(`Referenced coupon code '${normalized}' is invalid or inactive.`);
        }
        verifiedCouponCode = coupon.code;
      } else {
        verifiedCouponCode = null;
      }
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : campaign.name,
        description: data.description !== undefined ? data.description.trim() : campaign.description,
        channel: data.channel !== undefined ? data.channel : campaign.channel,
        audience: data.audience !== undefined ? data.audience.trim() : campaign.audience,
        subject: data.subject !== undefined ? data.subject.trim() : campaign.subject,
        content: data.content !== undefined ? data.content.trim() : campaign.content,
        couponCode: verifiedCouponCode,
        startsAt: data.startsAt !== undefined ? (data.startsAt ? new Date(data.startsAt) : null) : campaign.startsAt,
        endsAt: data.endsAt !== undefined ? (data.endsAt ? new Date(data.endsAt) : null) : campaign.endsAt,
        maxRecipients:
          data.maxRecipients !== undefined
            ? data.maxRecipients
              ? Math.max(1, Number(data.maxRecipients))
              : null
            : campaign.maxRecipients,
      },
    });

    return updated;
  }

  /**
   * Generate preview of campaign with personalizations rendered.
   */
  public async previewCampaign(id: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new Error('Campaign not found');

    const sampleCustomer = {
      name: 'John Doe',
      email: 'john.doe@example.com',
    };

    const renderedSubject = this.renderTemplate(campaign.subject, {
      customerName: sampleCustomer.name,
      couponCode: campaign.couponCode || 'WELCOME10',
      ctaUrl: `${env.FRONTEND_URL || 'https://nutyaelite.com'}?utm_source=campaign&utm_medium=email&utm_campaign=${campaign.utmCampaign || 'promo'}`,
    });

    const renderedContent = this.renderTemplate(campaign.content, {
      customerName: sampleCustomer.name,
      couponCode: campaign.couponCode || 'WELCOME10',
      ctaUrl: `${env.FRONTEND_URL || 'https://nutyaelite.com'}?utm_source=campaign&utm_medium=email&utm_campaign=${campaign.utmCampaign || 'promo'}`,
    });

    return {
      campaignId: campaign.id,
      name: campaign.name,
      channel: campaign.channel,
      audience: campaign.audience,
      couponCode: campaign.couponCode,
      sampleRecipient: sampleCustomer.email,
      previewSubject: renderedSubject,
      previewContent: renderedContent,
    };
  }

  /**
   * Snapshot audience and launch campaign.
   * Step 17: Creates immutable CampaignRecipient records before delivery.
   * Step 18: Enforces idempotency key CAMPAIGN:<campaignId>:<userId>:<channel>.
   * Step 19: Frequency capping skips over-messaged recipients.
   * Step 35: Failure isolation ensures individual errors don't fail the whole campaign.
   */
  public async launchCampaign(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        recipients: true,
      },
    });

    if (!campaign) throw createCampaignError('Campaign not found', 404, 'NOT_FOUND');
    if (campaign.status === 'COMPLETED') {
      throw createCampaignError('Campaign has already been completed.', 400, 'CAMPAIGN_ALREADY_COMPLETED');
    }
    if (campaign.status === 'ACTIVE') {
      throw createCampaignError('Campaign is already currently executing.', 400, 'CAMPAIGN_ALREADY_ACTIVE');
    }

    if (campaign.channel === 'WHATSAPP' && !whatsAppNotificationProvider.isEnabled()) {
      throw createCampaignError('WhatsApp notification provider is not configured.', 400, 'PROVIDER_UNAVAILABLE');
    }

    // 1. Mark campaign ACTIVE
    await prisma.campaign.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    // 2. Resolve audience user IDs
    const rawUserIds = await customerSegmentationService.getSegmentUserIds(campaign.audience);
    const boundUserIds = campaign.maxRecipients ? rawUserIds.slice(0, campaign.maxRecipients) : rawUserIds;

    // 3. Fetch users and filter by marketing consent
    const users = await prisma.user.findMany({
      where: {
        id: { in: boundUserIds },
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        preferences: true,
      },
    });

    // 4. Create Recipient Snapshot in DB (if not already snapshotted)
    const existingRecipientKeys = new Set(campaign.recipients.map((r) => r.idempotencyKey));
    const newRecipientsToCreate = [];

    for (const u of users) {
      const idempotencyKey = `CAMPAIGN:${campaign.id}:${u.id}:${campaign.channel}`;
      if (!existingRecipientKeys.has(idempotencyKey)) {
        newRecipientsToCreate.push({
          campaignId: campaign.id,
          userId: u.id,
          channel: campaign.channel,
          recipient: campaign.channel === 'WHATSAPP' ? u.phone || u.email : u.email,
          status: 'PENDING' as const,
          idempotencyKey,
        });
      }
    }

    if (newRecipientsToCreate.length > 0) {
      await prisma.campaignRecipient.createMany({
        data: newRecipientsToCreate,
        skipDuplicates: true,
      });
    }

    // Update totalRecipients count
    const totalRecipientsCount = await prisma.campaignRecipient.count({
      where: { campaignId: campaign.id },
    });
    await prisma.campaign.update({
      where: { id },
      data: { totalRecipients: totalRecipientsCount },
    });

    // 5. Execute deliveries in bounded chunks
    const pendingRecipients = await prisma.campaignRecipient.findMany({
      where: {
        campaignId: campaign.id,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            preferences: true,
          },
        },
      },
      take: 100, // bounded batch
    });

    let sent = campaign.sentCount;
    let failed = campaign.failedCount;
    let skipped = campaign.skippedCount;

    for (const rec of pendingRecipients) {
      const user = rec.user;

      // Check marketing consent
      if (user.preferences && !user.preferences.marketingEmailOptIn) {
        await prisma.campaignRecipient.update({
          where: { id: rec.id },
          data: { status: 'UNSUBSCRIBED', errorMessage: 'Customer opted out of marketing' },
        });
        skipped++;
        continue;
      }

      // Check frequency capping (Step 19)
      const eligibility = await customerPreferenceService.checkEligibility(rec.userId, rec.channel);
      if (!eligibility.allowed) {
        await prisma.campaignRecipient.update({
          where: { id: rec.id },
          data: { status: 'SKIPPED', errorMessage: eligibility.reason || 'FREQUENCY_CAP_EXCEEDED' },
        });
        skipped++;
        continue;
      }

      // Render personalized message
      const customerName = user.name || 'Valued Customer';
      const ctaUrl = `${env.FRONTEND_URL || 'https://nutyaelite.com'}?utm_source=campaign&utm_medium=email&utm_campaign=${campaign.utmCampaign || 'promo'}`;
      const renderedSubject = this.renderTemplate(campaign.subject, {
        customerName,
        couponCode: campaign.couponCode || '',
        ctaUrl,
      });
      const renderedBody = this.renderTemplate(campaign.content, {
        customerName,
        couponCode: campaign.couponCode || '',
        ctaUrl,
      });

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #795548;">NYUTA ELITE MAKHANA</h2>
          <div>${renderedBody}</div>
          ${
            campaign.couponCode
              ? `<div style="background: #fbf8f5; border: 1px dashed #795548; padding: 15px; margin: 20px 0; text-align: center; border-radius: 8px;">
                  <p style="margin: 0; font-size: 14px;">Use exclusive promo code at checkout:</p>
                  <p style="margin: 8px 0 0; font-size: 20px; font-weight: bold; color: #4a2c11; letter-spacing: 1px;">${campaign.couponCode}</p>
                 </div>`
              : ''
          }
          <div style="text-align: center; margin: 30px 0;">
            <a href="${ctaUrl}" style="background: #4a2c11; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Shop Now
            </a>
          </div>
          <p style="font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px;">
            You received this email because you are registered at NYUTA ELITE MAKHANA. You can manage your preferences or unsubscribe anytime in your account.
          </p>
        </div>
      `;

      // Dispatch via notification provider
      const deliveryResult = await emailNotificationProvider.send({
        notificationId: rec.id,
        orderId: campaign.id,
        orderNumber: `CMP-${campaign.id.slice(0, 8)}`,
        type: 'ORDER_PROCESSING' as any,
        channel: rec.channel,
        recipient: rec.recipient,
        subject: renderedSubject,
        html: emailHtml,
        text: renderedBody,
      });

      if (deliveryResult.success) {
        await prisma.campaignRecipient.update({
          where: { id: rec.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        sent++;
      } else {
        // Failure isolation: individual failure does NOT abort campaign
        await prisma.campaignRecipient.update({
          where: { id: rec.id },
          data: { status: 'FAILED', errorMessage: deliveryResult.message || 'DELIVERY_ERROR' },
        });
        failed++;
      }
    }

    // Update campaign metrics and mark COMPLETED
    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        sentCount: sent,
        failedCount: failed,
        skippedCount: skipped,
      },
    });

    return updated;
  }

  /**
   * Cancel or pause campaign.
   */
  public async cancelCampaign(id: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new Error('Campaign not found');

    const updated = await prisma.campaign.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return updated;
  }

  /**
   * Calculate real campaign revenue and attributed orders.
   * STRICT FINANCIAL INVARIANCE:
   * Only includes orders where:
   * 1. status is CONFIRMED, PROCESSING, SHIPPED, or DELIVERED.
   * 2. paymentStatus is CAPTURED.
   * Excludes failed, pending, or cancelled orders.
   */
  public async getCampaignAnalytics(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        recipients: {
          select: { status: true },
        },
      },
    });

    if (!campaign) throw new Error('Campaign not found');

    // Query attributed orders directly
    const attributedOrders = await prisma.order.findMany({
      where: {
        OR: [{ campaignId: campaign.id }, { utmCampaign: campaign.utmCampaign || '__none__' }],
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        paymentStatus: 'CAPTURED',
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        createdAt: true,
      },
    });

    const attributedRevenue = Number(attributedOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2));
    const attributedOrdersCount = attributedOrders.length;

    // Recipient counts
    const counts = {
      total: campaign.totalRecipients,
      sent: campaign.sentCount,
      failed: campaign.failedCount,
      skipped: campaign.skippedCount,
    };

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        channel: campaign.channel,
        audience: campaign.audience,
        couponCode: campaign.couponCode,
        createdAt: campaign.createdAt,
      },
      recipients: counts,
      attribution: {
        attributedOrdersCount,
        attributedRevenue,
        orders: attributedOrders.slice(0, 20),
      },
    };
  }

  /**
   * Render template with safe, escaped replacement tags.
   * Prevents XSS injection into emails and payloads.
   */
  private renderTemplate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, escapeHtml(value));
    }
    return result;
  }
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const campaignService = new CampaignService();
