// backend/src/validators/growth.validator.ts
import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().trim().min(3, 'Campaign name must be at least 3 characters').max(100),
  description: z.string().trim().max(500).optional(),
  channel: z.enum(['EMAIL', 'WHATSAPP']).default('EMAIL'),
  audience: z.string().trim().min(2, 'Audience key is required').max(50),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(200),
  content: z.string().trim().min(5, 'Content must be at least 5 characters').max(10000),
  couponCode: z.string().trim().min(2).max(32).optional().or(z.literal('')),
  startsAt: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endsAt: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  maxRecipients: z.coerce.number().int().min(1).max(100000).optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const customerFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  segment: z.string().trim().optional(),
  lifecycleState: z.enum(['NEW', 'PROSPECT', 'FIRST_PURCHASE', 'ACTIVE', 'REPEAT_CUSTOMER', 'LOYAL', 'AT_RISK', 'DORMANT']).optional(),
  minOrders: z.coerce.number().int().min(0).optional(),
  maxOrders: z.coerce.number().int().min(0).optional(),
  minSpend: z.coerce.number().min(0).optional(),
  maxSpend: z.coerce.number().min(0).optional(),
});

export const updatePreferencesSchema = z.object({
  marketingEmailOptIn: z.boolean().optional(),
  marketingWhatsAppOptIn: z.boolean().optional(),
}).refine(
  (data) => data.marketingEmailOptIn !== undefined || data.marketingWhatsAppOptIn !== undefined,
  { message: 'At least one preference setting must be provided' }
);

export const unsubscribeSchema = z.object({
  token: z.string().trim().min(8, 'Valid unsubscribe token is required'),
  channel: z.enum(['EMAIL', 'WHATSAPP']).optional(),
});

export const campaignIdParamSchema = z.object({
  id: z.string().uuid('Invalid campaign ID format'),
});

// Phase 19: Growth Analytics & Experimentation Schemas
export const growthAnalyticsQuerySchema = z
  .object({
    range: z.string().trim().max(40).optional(),
    startDate: z.string().trim().max(40).optional(),
    endDate: z.string().trim().max(40).optional(),
    granularity: z.string().trim().max(20).optional(),
    bypassCache: z.string().trim().optional(),
  })
  .strict();

export const trackBehavioralEventSchema = z.object({
  eventName: z.string().trim().min(2).max(64),
  visitorId: z.string().trim().min(6).max(64).optional().nullable(),
  productId: z.string().uuid().optional().nullable(),
  orderId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.any()).optional(),
});

export const variantInputSchema = z.object({
  key: z.string().trim().min(2).max(40),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(300).optional(),
  allocationPercentage: z.number().int().min(1).max(99),
  isControl: z.boolean().optional(),
  config: z.record(z.any()).optional(),
});

export const createExperimentSchema = z.object({
  key: z.string().trim().min(3).max(64),
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional(),
  primaryMetric: z.string().trim().min(2).max(64),
  secondaryMetrics: z.array(z.string().trim().min(2).max(64)).max(10).optional(),
  trafficPercentage: z.number().int().min(1).max(100).optional(),
  minSampleSize: z.number().int().min(10).max(100000).optional(),
  startAt: z.string().optional().nullable(),
  endAt: z.string().optional().nullable(),
  variants: z.array(variantInputSchema).min(2).max(6),
});

export const updateExperimentSchema = createExperimentSchema.partial().omit({ key: true });

export const experimentIdParamSchema = z.object({
  id: z.string().uuid('Invalid experiment ID format'),
});

export const experimentStatusTransitionSchema = z.object({
  status: z.enum(['RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED']),
});

export const experimentAssignSchema = z.object({
  visitorId: z.string().trim().min(6).max(64).optional().nullable(),
  targetUserId: z.string().optional(), // Used to detect and block IDOR attempts if caller tries to impersonate another user
});

export const experimentEventSchema = z.object({
  eventName: z.string().trim().min(2).max(64),
  visitorId: z.string().trim().min(6).max(64).optional().nullable(),
  orderId: z.string().uuid().optional().nullable(),
  idempotencyKey: z.string().trim().max(128).optional().nullable(),
  metadata: z.record(z.any()).optional(),
  targetUserId: z.string().optional(),
});


