// backend/src/controllers/growth.controller.ts
import type { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { customerSegmentationService } from '../services/growth/customerSegmentation.service.js';
import { customerPreferenceService } from '../services/growth/customerPreference.service.js';
import { cartRecoveryService } from '../services/growth/cartRecovery.service.js';
import { campaignService } from '../services/growth/campaign.service.js';
import { growthAnalyticsService } from '../services/growth/growthAnalytics.service.js';
import { experimentService } from '../services/growth/experiment.service.js';
import {
  createCampaignSchema,
  updateCampaignSchema,
  customerFilterSchema,
  updatePreferencesSchema,
  unsubscribeSchema,
  campaignIdParamSchema,
  growthAnalyticsQuerySchema,
  trackBehavioralEventSchema,
  createExperimentSchema,
  updateExperimentSchema,
  experimentIdParamSchema,
  experimentStatusTransitionSchema,
  experimentAssignSchema,
  experimentEventSchema,
} from '../validators/growth.validator.js';

// -------------------------------------------------------------
// Admin Growth & CRM Controllers
// -------------------------------------------------------------

export async function getSegmentSummaries(_req: Request, res: Response, next: NextFunction) {
  try {
    const segments = await customerSegmentationService.getSegmentSummaries();
    res.json({
      success: true,
      data: { segments },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = customerFilterSchema.parse(req.query);
    const result = await customerSegmentationService.listCustomers(parsed);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCustomerDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const detail = await customerSegmentationService.getCustomerDetail(id);
    if (!detail) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer not found' },
      });
      return;
    }
    res.json({
      success: true,
      data: detail,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCampaigns(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.status && typeof req.query.status === 'string') {
      where.status = req.query.status;
    }
    if (req.query.channel && typeof req.query.channel === 'string') {
      where.channel = req.query.channel;
    }
    if (req.query.search && typeof req.query.search === 'string') {
      where.name = { contains: req.query.search, mode: 'insensitive' };
    }

    const [total, campaigns] = await Promise.all([
      prisma.campaign.count({ where }),
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createCampaignSchema.parse(req.body);
    const adminUserId = (req as any).user?.id;
    const campaign = await campaignService.createCampaign(parsed, adminUserId);
    res.status(201).json({
      success: true,
      data: { campaign },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCampaignDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = campaignIdParamSchema.parse(req.params);
    const analytics = await campaignService.getCampaignAnalytics(id);
    res.json({
      success: true,
      data: analytics,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = campaignIdParamSchema.parse(req.params);
    const parsed = updateCampaignSchema.parse(req.body);
    const updated = await campaignService.updateCampaign(id, parsed);
    res.json({
      success: true,
      data: { campaign: updated },
    });
  } catch (err) {
    next(err);
  }
}

export async function previewCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = campaignIdParamSchema.parse(req.params);
    const preview = await campaignService.previewCampaign(id);
    res.json({
      success: true,
      data: { preview },
    });
  } catch (err) {
    next(err);
  }
}

export async function launchCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = campaignIdParamSchema.parse(req.params);
    const launched = await campaignService.launchCampaign(id);
    res.json({
      success: true,
      data: { campaign: launched },
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = campaignIdParamSchema.parse(req.params);
    const cancelled = await campaignService.cancelCampaign(id);
    res.json({
      success: true,
      data: { campaign: cancelled },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCampaignRecipients(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = campaignIdParamSchema.parse(req.params);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { campaignId: id };
    if (req.query.status && typeof req.query.status === 'string') {
      where.status = req.query.status;
    }

    const [total, recipients] = await Promise.all([
      prisma.campaignRecipient.count({ where }),
      prisma.campaignRecipient.findMany({
        where,
        select: {
          id: true,
          userId: true,
          channel: true,
          status: true,
          sentAt: true,
          errorMessage: true,
          createdAt: true,
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      success: true,
      data: {
        recipients,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAbandonedCarts(req: Request, res: Response, next: NextFunction) {
  try {
    const threshold = Number(req.query.thresholdHours) || undefined;
    const carts = await cartRecoveryService.detectEligibleCarts(threshold);
    res.json({
      success: true,
      data: {
        count: carts.length,
        carts: carts.map((c) => ({
          cartId: c.id,
          userId: c.userId,
          customerName: c.user?.name,
          customerEmail: c.user?.email,
          itemCount: c.items.length,
          lastUpdated: c.updatedAt,
          recoveries: c.recoveries,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function processAbandonedCarts(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Number(req.body?.maxLimit) || 20;
    const thresholdHours = Number(req.body?.thresholdHours) || undefined;
    const result = await cartRecoveryService.processRecoveries({ maxLimit: limit, thresholdHours });
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Customer Preference & Unsubscribe Controllers
// -------------------------------------------------------------

export async function getCustomerPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const preferences = await customerPreferenceService.getPreferences(userId);
    res.json({
      success: true,
      data: { preferences },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomerPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const parsed = updatePreferencesSchema.parse(req.body);
    const updated = await customerPreferenceService.updatePreferences(userId, parsed);
    res.json({
      success: true,
      data: { preferences: updated },
    });
  } catch (err) {
    next(err);
  }
}

export async function unsubscribe(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = unsubscribeSchema.parse(req.body);
    const result = await customerPreferenceService.unsubscribeByToken(parsed.token, parsed.channel);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: result.message },
      });
      return;
    }
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

import { verifyAccessToken } from '../utils/jwt.js';

function extractOptionalUserId(req: Request): string | undefined {
  if ((req as any).user?.id) return (req as any).user.id;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    if (payload?.sub) return payload.sub;
  }
  return undefined;
}

export async function restoreRecoveredCart(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;
    const result = await cartRecoveryService.restoreAndRevalidateCart(token);
    if (!result.success) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: result.message },
      });
      return;
    }

    // Track cart_recovery_click behavioral event asynchronously
    void growthAnalyticsService
      .trackBehavioralEvent({
        eventName: 'cart_recovery_click',
        userId: result.userId,
        metadata: { tokenPrefix: token.slice(0, 8), cartId: result.cartId },
      })
      .catch(() => {});

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Phase 19: Storefront Behavioral Event Ingestion
// -------------------------------------------------------------

export async function trackBehavioralEventHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = trackBehavioralEventSchema.parse(req.body);
    const userId = extractOptionalUserId(req);

    // IDOR protection: if caller passes targetUserId for a different user
    if ((req.body as any)?.userId && userId && (req.body as any).userId !== userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Cannot record behavioral events for another user' },
      });
      return;
    }

    const event = await growthAnalyticsService.trackBehavioralEvent({
      ...parsed,
      userId,
    });

    res.status(201).json({
      success: true,
      data: {
        eventId: event.id,
        eventName: event.eventName,
        createdAt: event.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Phase 19: Admin Growth Analytics Controllers
// -------------------------------------------------------------

export async function getGrowthAnalyticsDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const query = growthAnalyticsQuerySchema.parse(req.query);
    const bypassCache = query.bypassCache === 'true' || query.bypassCache === '1';
    const data = await growthAnalyticsService.getUnifiedGrowthDashboard(query, bypassCache);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getConversionFunnelAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const query = growthAnalyticsQuerySchema.parse(req.query);
    const data = await growthAnalyticsService.getFunnelAnalytics(query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getCheckoutFunnelAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const query = growthAnalyticsQuerySchema.parse(req.query);
    const funnelData = await growthAnalyticsService.getFunnelAnalytics(query);
    res.json({
      success: true,
      data: {
        calculatedAt: funnelData.calculatedAt,
        freshnessStatus: funnelData.freshnessStatus,
        dateRange: funnelData.dateRange,
        checkoutFunnel: funnelData.checkoutFunnel,
        exclusions: funnelData.exclusions,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getRevenueAndAovAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const query = growthAnalyticsQuerySchema.parse(req.query);
    const data = await growthAnalyticsService.getRevenueAndAovAnalytics(query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getProductConversionAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const query = growthAnalyticsQuerySchema.parse(req.query);
    const data = await growthAnalyticsService.getProductConversionAnalytics(query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getCartRecoveryAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const query = growthAnalyticsQuerySchema.parse(req.query);
    const data = await growthAnalyticsService.getCartRecoveryAnalytics(query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getCampaignPerformanceAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const query = growthAnalyticsQuerySchema.parse(req.query);
    const data = await growthAnalyticsService.getCampaignPerformanceAnalytics(query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getSegmentPerformanceAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const query = growthAnalyticsQuerySchema.parse(req.query);
    const data = await growthAnalyticsService.getSegmentPerformanceAnalytics(query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getCohortRetentionAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const query = growthAnalyticsQuerySchema.parse(req.query);
    const data = await growthAnalyticsService.getCohortAnalytics(query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getRepeatAndLtvAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const query = growthAnalyticsQuerySchema.parse(req.query);
    const data = await growthAnalyticsService.getRepeatAndLtvAnalytics(query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getProgramsPerformanceAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const query = growthAnalyticsQuerySchema.parse(req.query);
    const [coupons, retention] = await Promise.all([
      growthAnalyticsService.getCouponPerformanceAnalytics(query),
      growthAnalyticsService.getRetentionMechanismsAnalytics(),
    ]);
    res.json({
      success: true,
      data: {
        coupons,
        loyalty: retention.loyalty,
        referrals: retention.referrals,
        wishlist: retention.wishlist,
        reviews: retention.reviews,
      },
    });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Phase 19: Experimentation & A/B Testing Controllers
// -------------------------------------------------------------

export async function listExperiments(req: Request, res: Response, next: NextFunction) {
  try {
    const status = typeof req.query.status === 'string' ? (req.query.status as any) : undefined;
    const experiments = await experimentService.listExperiments(status);
    res.json({
      success: true,
      data: { experiments },
    });
  } catch (err) {
    next(err);
  }
}

export async function createExperiment(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createExperimentSchema.parse(req.body);
    const adminId = (req as any).user?.id;
    const experiment = await experimentService.createExperiment(parsed, adminId);
    res.status(201).json({
      success: true,
      data: { experiment },
    });
  } catch (err) {
    next(err);
  }
}

export async function getExperimentDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = experimentIdParamSchema.parse(req.params);
    const experiment = await experimentService.getExperimentById(id);
    res.json({
      success: true,
      data: { experiment },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateExperiment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = experimentIdParamSchema.parse(req.params);
    const parsed = updateExperimentSchema.parse(req.body);
    const adminId = (req as any).user?.id;
    const experiment = await experimentService.updateDraftExperiment(id, parsed, adminId);
    res.json({
      success: true,
      data: { experiment },
    });
  } catch (err) {
    next(err);
  }
}

export async function transitionExperimentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = experimentIdParamSchema.parse(req.params);
    const parsed = experimentStatusTransitionSchema.parse(req.body);
    const adminId = (req as any).user?.id;
    const experiment = await experimentService.transitionStatus(id, parsed.status, adminId);
    res.json({
      success: true,
      data: { experiment },
    });
  } catch (err) {
    next(err);
  }
}

export async function getExperimentResults(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = experimentIdParamSchema.parse(req.params);
    const results = await experimentService.getExperimentResults(id);
    res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
}

export async function assignExperimentSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params;
    const parsed = experimentAssignSchema.parse(req.body || {});
    const userId = extractOptionalUserId(req);

    // IDOR guard: authenticated customer cannot request assignment for another customer's userId
    if (parsed.targetUserId && userId && parsed.targetUserId !== userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Cannot request experiment assignment for another user' },
      });
      return;
    }
    if (parsed.targetUserId && !userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Authentication required to assign by userId' },
      });
      return;
    }

    const assignment = await experimentService.getOrAssignVariant(key, {
      userId,
      visitorId: parsed.visitorId,
    });

    res.json({
      success: true,
      data: assignment,
    });
  } catch (err) {
    next(err);
  }
}

export async function recordExperimentEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params;
    const parsed = experimentEventSchema.parse(req.body);
    const userId = extractOptionalUserId(req);

    if (parsed.targetUserId && userId && parsed.targetUserId !== userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Cannot record experiment event for another user' },
      });
      return;
    }
    if (parsed.targetUserId && !userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Authentication required to record event by userId' },
      });
      return;
    }

    const result = await experimentService.recordExperimentEvent({
      experimentKeyOrId: key,
      userId,
      visitorId: parsed.visitorId,
      eventName: parsed.eventName,
      orderId: parsed.orderId,
      idempotencyKey: parsed.idempotencyKey,
      metadata: parsed.metadata,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}


