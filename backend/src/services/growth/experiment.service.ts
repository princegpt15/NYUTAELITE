// backend/src/services/growth/experiment.service.ts
import crypto from 'crypto';
import prisma from '../../lib/prisma.js';
import { isQualifyingPaidOrder, getOrderRefundedPaise, toPaise, toRupees, safePercent } from '../analytics.service.js';
import type { ExperimentStatus } from '@prisma/client';

export const ALLOWED_PRIMARY_METRICS = [
  'purchase_conversion',
  'add_to_cart_conversion',
  'checkout_completion',
  'wishlist_to_cart',
  'campaign_click',
  'reorder_conversion',
] as const;

export type AllowedPrimaryMetric = (typeof ALLOWED_PRIMARY_METRICS)[number];

const PROHIBITED_FINANCIAL_CONFIG_KEYS = [
  'price',
  'discount',
  'discountamount',
  'discountvalue',
  'totalamount',
  'subtotal',
  'tax',
  'taxamount',
  'shippingamount',
  'razorpay',
  'loyaltypoints',
  'stock',
  'payment',
  'refund',
];

function createExperimentError(message: string, statusCode = 400, code = 'EXPERIMENT_ERROR'): Error {
  const err: any = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

/**
 * Validate that variant config does not attempt to manipulate financial, inventory, or payment rules.
 */
function assertSafeVariantConfig(config: unknown): void {
  if (!config || typeof config !== 'object') return;
  const checkObj = (obj: Record<string, any>) => {
    for (const rawKey of Object.keys(obj)) {
      const normalized = rawKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (PROHIBITED_FINANCIAL_CONFIG_KEYS.includes(normalized)) {
        throw createExperimentError(
          `Variant configuration key "${rawKey}" is prohibited. Experiments must never alter pricing, discounts, stock, loyalty, or payment authority.`,
          422,
          'PROHIBITED_EXPERIMENT_CONFIG'
        );
      }
      if (obj[rawKey] && typeof obj[rawKey] === 'object' && !Array.isArray(obj[rawKey])) {
        checkObj(obj[rawKey]);
      }
    }
  };
  checkObj(config as Record<string, any>);
}

/**
 * Approximate two-tailed p-value from standard normal Z-score using Abramowitz & Stegun formula.
 */
function normalTwoTailedPValue(z: number): number {
  const absZ = Math.abs(z);
  if (!Number.isFinite(absZ) || absZ === 0) return 1;
  if (absZ > 8) return 0;
  const p = 0.2316419;
  const b1 = 0.31938153;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const t = 1 / (1 + p * absZ);
  const pdf = Math.exp(-0.5 * absZ * absZ) / Math.sqrt(2 * Math.PI);
  const cdfComplement = pdf * (b1 * t + b2 * Math.pow(t, 2) + b3 * Math.pow(t, 3) + b4 * Math.pow(t, 4) + b5 * Math.pow(t, 5));
  return Math.min(1, Math.max(0, 2 * cdfComplement));
}

export interface VariantInputDTO {
  key: string;
  name: string;
  description?: string;
  allocationPercentage: number;
  isControl?: boolean;
  config?: Record<string, any>;
}

export interface CreateExperimentDTO {
  key: string;
  name: string;
  description?: string;
  primaryMetric: string;
  secondaryMetrics?: string[];
  trafficPercentage?: number;
  minSampleSize?: number;
  startAt?: string | Date | null;
  endAt?: string | Date | null;
  variants: VariantInputDTO[];
}

export interface UpdateExperimentDTO {
  name?: string;
  description?: string;
  primaryMetric?: string;
  secondaryMetrics?: string[];
  trafficPercentage?: number;
  minSampleSize?: number;
  startAt?: string | Date | null;
  endAt?: string | Date | null;
  variants?: VariantInputDTO[];
}

export class ExperimentService {
  /**
   * Validate variant list and traffic allocation sum = 100%.
   */
  private validateVariants(variants: VariantInputDTO[]): void {
    if (!Array.isArray(variants) || variants.length < 2 || variants.length > 6) {
      throw createExperimentError(
        'An experiment must define between 2 and 6 variants (e.g. Control and Variant A).',
        422,
        'INVALID_VARIANT_COUNT'
      );
    }

    const seenKeys = new Set<string>();
    let totalAllocation = 0;

    for (const v of variants) {
      const key = (v.key || '').trim().toLowerCase();
      if (!/^[a-z0-9_-]{2,40}$/.test(key)) {
        throw createExperimentError(
          `Invalid variant key "${v.key}". Use 2-40 lowercase alphanumeric, hyphen, or underscore characters.`,
          422,
          'INVALID_VARIANT_KEY'
        );
      }
      if (seenKeys.has(key)) {
        throw createExperimentError(`Duplicate variant key "${key}" is not allowed.`, 422, 'DUPLICATE_VARIANT_KEY');
      }
      seenKeys.add(key);

      if (!Number.isInteger(v.allocationPercentage) || v.allocationPercentage < 1 || v.allocationPercentage > 99) {
        throw createExperimentError(
          `Variant "${key}" allocationPercentage must be an integer between 1 and 99.`,
          422,
          'INVALID_VARIANT_ALLOCATION'
        );
      }
      totalAllocation += v.allocationPercentage;

      assertSafeVariantConfig(v.config);
    }

    if (totalAllocation !== 100) {
      throw createExperimentError(
        `Variant allocation percentages must sum to exactly 100% (got ${totalAllocation}%).`,
        422,
        'INVALID_ALLOCATION_SUM'
      );
    }
  }

  /**
   * Create a new experiment in DRAFT status with variants and audit trail.
   */
  public async createExperiment(dto: CreateExperimentDTO, adminUserId?: string) {
    const key = (dto.key || '').trim().toLowerCase();
    if (!/^[a-z0-9_-]{3,64}$/.test(key)) {
      throw createExperimentError(
        'Experiment key must be 3-64 lowercase alphanumeric, hyphen, or underscore characters.',
        422,
        'INVALID_EXPERIMENT_KEY'
      );
    }

    if (!ALLOWED_PRIMARY_METRICS.includes(dto.primaryMetric as AllowedPrimaryMetric)) {
      throw createExperimentError(
        `Invalid primaryMetric "${dto.primaryMetric}". Allowed: ${ALLOWED_PRIMARY_METRICS.join(', ')}.`,
        422,
        'INVALID_PRIMARY_METRIC'
      );
    }

    const trafficPercentage = dto.trafficPercentage ?? 100;
    if (!Number.isInteger(trafficPercentage) || trafficPercentage < 1 || trafficPercentage > 100) {
      throw createExperimentError(
        'trafficPercentage must be an integer between 1 and 100.',
        422,
        'INVALID_TRAFFIC_PERCENTAGE'
      );
    }

    const minSampleSize = dto.minSampleSize ?? 100;
    if (!Number.isInteger(minSampleSize) || minSampleSize < 10 || minSampleSize > 100000) {
      throw createExperimentError(
        'minSampleSize must be an integer between 10 and 100000.',
        422,
        'INVALID_MIN_SAMPLE_SIZE'
      );
    }

    this.validateVariants(dto.variants);

    const existing = await prisma.experiment.findUnique({ where: { key } });
    if (existing) {
      throw createExperimentError(`Experiment with key "${key}" already exists.`, 409, 'DUPLICATE_EXPERIMENT_KEY');
    }

    const hasControl = dto.variants.some((v) => v.isControl);

    const created = await prisma.$transaction(async (tx) => {
      const exp = await tx.experiment.create({
        data: {
          key,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          status: 'DRAFT',
          primaryMetric: dto.primaryMetric,
          secondaryMetrics: Array.isArray(dto.secondaryMetrics) ? dto.secondaryMetrics : [],
          trafficPercentage,
          minSampleSize,
          startAt: dto.startAt ? new Date(dto.startAt) : null,
          endAt: dto.endAt ? new Date(dto.endAt) : null,
          createdBy: adminUserId || null,
          variants: {
            create: dto.variants.map((v, idx) => ({
              key: v.key.trim().toLowerCase(),
              name: v.name.trim(),
              description: v.description?.trim() || null,
              allocationPercentage: v.allocationPercentage,
              isControl: hasControl ? Boolean(v.isControl) : idx === 0,
              config: v.config || {},
            })),
          },
        },
        include: {
          variants: { orderBy: { createdAt: 'asc' } },
        },
      });

      await tx.experimentAuditLog.create({
        data: {
          experimentId: exp.id,
          adminUserId: adminUserId || null,
          action: 'CREATED',
          previousStatus: null,
          newStatus: 'DRAFT',
          details: {
            key: exp.key,
            primaryMetric: exp.primaryMetric,
            trafficPercentage: exp.trafficPercentage,
            variants: exp.variants.map((v) => ({ key: v.key, allocationPercentage: v.allocationPercentage })),
          },
        },
      });

      return exp;
    });

    return created;
  }

  /**
   * Update a DRAFT experiment. Running/Completed experiments cannot destructively alter variants.
   */
  public async updateDraftExperiment(experimentId: string, dto: UpdateExperimentDTO, adminUserId?: string) {
    const exp = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: { variants: true, _count: { select: { assignments: true } } },
    });

    if (!exp) {
      throw createExperimentError('Experiment not found.', 404, 'NOT_FOUND');
    }

    if (exp.status !== 'DRAFT' || exp._count.assignments > 0) {
      throw createExperimentError(
        'Only DRAFT experiments with zero historical assignments can be modified.',
        422,
        'EXPERIMENT_NOT_EDITABLE'
      );
    }

    if (dto.primaryMetric && !ALLOWED_PRIMARY_METRICS.includes(dto.primaryMetric as AllowedPrimaryMetric)) {
      throw createExperimentError(
        `Invalid primaryMetric "${dto.primaryMetric}". Allowed: ${ALLOWED_PRIMARY_METRICS.join(', ')}.`,
        422,
        'INVALID_PRIMARY_METRIC'
      );
    }

    if (dto.trafficPercentage !== undefined) {
      if (!Number.isInteger(dto.trafficPercentage) || dto.trafficPercentage < 1 || dto.trafficPercentage > 100) {
        throw createExperimentError('trafficPercentage must be an integer between 1 and 100.', 422, 'INVALID_TRAFFIC_PERCENTAGE');
      }
    }

    if (dto.minSampleSize !== undefined) {
      if (!Number.isInteger(dto.minSampleSize) || dto.minSampleSize < 10 || dto.minSampleSize > 100000) {
        throw createExperimentError('minSampleSize must be an integer between 10 and 100000.', 422, 'INVALID_MIN_SAMPLE_SIZE');
      }
    }

    if (dto.variants) {
      this.validateVariants(dto.variants);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (dto.variants) {
        await tx.experimentVariant.deleteMany({ where: { experimentId } });
      }

      const hasControl = dto.variants ? dto.variants.some((v) => v.isControl) : false;

      const res = await tx.experiment.update({
        where: { id: experimentId },
        data: {
          ...(dto.name ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
          ...(dto.primaryMetric ? { primaryMetric: dto.primaryMetric } : {}),
          ...(dto.secondaryMetrics ? { secondaryMetrics: dto.secondaryMetrics } : {}),
          ...(dto.trafficPercentage !== undefined ? { trafficPercentage: dto.trafficPercentage } : {}),
          ...(dto.minSampleSize !== undefined ? { minSampleSize: dto.minSampleSize } : {}),
          ...(dto.startAt !== undefined ? { startAt: dto.startAt ? new Date(dto.startAt) : null } : {}),
          ...(dto.endAt !== undefined ? { endAt: dto.endAt ? new Date(dto.endAt) : null } : {}),
          ...(dto.variants
            ? {
                variants: {
                  create: dto.variants.map((v, idx) => ({
                    key: v.key.trim().toLowerCase(),
                    name: v.name.trim(),
                    description: v.description?.trim() || null,
                    allocationPercentage: v.allocationPercentage,
                    isControl: hasControl ? Boolean(v.isControl) : idx === 0,
                    config: v.config || {},
                  })),
                },
              }
            : {}),
        },
        include: { variants: { orderBy: { createdAt: 'asc' } } },
      });

      await tx.experimentAuditLog.create({
        data: {
          experimentId,
          adminUserId: adminUserId || null,
          action: 'UPDATED',
          previousStatus: exp.status,
          newStatus: res.status,
          details: { updatedFields: Object.keys(dto) },
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Transition experiment status (START, PAUSE, COMPLETE, CANCEL) with audit logging.
   */
  public async transitionStatus(
    experimentId: string,
    targetStatus: ExperimentStatus,
    adminUserId?: string
  ) {
    const exp = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: { variants: true },
    });

    if (!exp) {
      throw createExperimentError('Experiment not found.', 404, 'NOT_FOUND');
    }

    const allowedTransitions: Record<ExperimentStatus, ExperimentStatus[]> = {
      DRAFT: ['RUNNING', 'CANCELLED'],
      RUNNING: ['PAUSED', 'COMPLETED', 'CANCELLED'],
      PAUSED: ['RUNNING', 'COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!allowedTransitions[exp.status].includes(targetStatus)) {
      throw createExperimentError(
        `Cannot transition experiment from ${exp.status} to ${targetStatus}.`,
        422,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const totalAllocation = exp.variants.reduce((acc, v) => acc + v.allocationPercentage, 0);
    if (targetStatus === 'RUNNING' && totalAllocation !== 100) {
      throw createExperimentError(
        `Cannot start experiment: variant allocations sum to ${totalAllocation}% instead of 100%.`,
        422,
        'INVALID_ALLOCATION_SUM'
      );
    }

    const actionMap: Record<ExperimentStatus, string> = {
      DRAFT: 'UPDATED',
      RUNNING: 'STARTED',
      PAUSED: 'PAUSED',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    };

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.experiment.update({
        where: { id: experimentId },
        data: {
          status: targetStatus,
          ...(targetStatus === 'RUNNING' && !exp.startAt ? { startAt: now } : {}),
          ...(targetStatus === 'COMPLETED' || targetStatus === 'CANCELLED' ? { endAt: now } : {}),
        },
        include: {
          variants: { orderBy: { createdAt: 'asc' } },
          auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      });

      await tx.experimentAuditLog.create({
        data: {
          experimentId,
          adminUserId: adminUserId || null,
          action: actionMap[targetStatus],
          previousStatus: exp.status,
          newStatus: targetStatus,
          details: { timestamp: now.toISOString() },
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Construct privacy-safe subjectId. Never allows email or PII as subjectId.
   */
  public resolveSafeSubject(input: { userId?: string | null; visitorId?: string | null }): {
    subjectId: string;
    userId: string | null;
    visitorId: string | null;
  } {
    if (input.userId) {
      const uid = String(input.userId).trim();
      if (uid.includes('@')) {
        throw createExperimentError('Email addresses cannot be used as experiment identifiers.', 422, 'PII_IDENTIFIER_REJECTED');
      }
      return { subjectId: `user:${uid}`, userId: uid, visitorId: null };
    }

    const vid = String(input.visitorId || '').trim();
    if (!vid) {
      throw createExperimentError('Either authenticated userId or anonymous visitorId is required.', 400, 'SUBJECT_REQUIRED');
    }
    if (vid.includes('@') || !/^[a-zA-Z0-9_-]{6,64}$/.test(vid)) {
      throw createExperimentError(
        'Invalid visitorId. Must be a 6-64 character privacy-safe alphanumeric token (never email or PII).',
        422,
        'INVALID_VISITOR_ID'
      );
    }
    return { subjectId: `anon:${vid}`, userId: null, visitorId: vid };
  }

  /**
   * Deterministically and persistently assign a user or visitor to an experiment variant.
   * - If already assigned, returns existing assignment (even if paused/completed).
   * - Only RUNNING experiments create new assignments.
   * - Concurrency-safe against simultaneous requests via unique constraint [experimentId, subjectId].
   */
  public async getOrAssignVariant(
    experimentKeyOrId: string,
    subjectInput: { userId?: string | null; visitorId?: string | null }
  ) {
    const { subjectId, userId, visitorId } = this.resolveSafeSubject(subjectInput);

    const exp = await prisma.experiment.findFirst({
      where: {
        OR: [{ key: experimentKeyOrId.toLowerCase() }, { id: experimentKeyOrId }],
      },
      include: {
        variants: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!exp) {
      throw createExperimentError('Experiment not found.', 404, 'NOT_FOUND');
    }

    // 1. Check existing persistent assignment first
    const existingAssignment = await prisma.experimentAssignment.findUnique({
      where: {
        experimentId_subjectId: {
          experimentId: exp.id,
          subjectId,
        },
      },
      include: { variant: true },
    });

    if (existingAssignment) {
      return {
        assigned: true,
        isNewAssignment: false,
        experimentId: exp.id,
        experimentKey: exp.key,
        experimentStatus: exp.status,
        subjectId,
        variant: {
          id: existingAssignment.variant.id,
          key: existingAssignment.variant.key,
          name: existingAssignment.variant.name,
          isControl: existingAssignment.variant.isControl,
          config: existingAssignment.variant.config,
        },
        assignedAt: existingAssignment.assignedAt,
        ga4Context: {
          experiment_id: exp.key,
          variant_id: existingAssignment.variant.key,
        },
      };
    }

    // 2. Only RUNNING experiments assign new subjects
    if (exp.status !== 'RUNNING') {
      return {
        assigned: false,
        reason: `EXPERIMENT_${exp.status}`,
        experimentId: exp.id,
        experimentKey: exp.key,
        experimentStatus: exp.status,
        subjectId,
        variant: null,
        ga4Context: null,
      };
    }

    // 3. Check traffic allocation percentage deterministically
    const trafficHash = crypto.createHash('sha256').update(`traffic:${exp.key}:${subjectId}`).digest();
    const trafficBucket = trafficHash.readUInt32BE(0) % 100; // 0..99
    if (trafficBucket >= exp.trafficPercentage) {
      return {
        assigned: false,
        reason: 'EXCLUDED_BY_TRAFFIC_ALLOCATION',
        experimentId: exp.id,
        experimentKey: exp.key,
        experimentStatus: exp.status,
        subjectId,
        variant: null,
        ga4Context: null,
      };
    }

    // 4. Deterministic variant selection based on variant allocation percentages
    const variantHash = crypto.createHash('sha256').update(`variant:${exp.key}:${subjectId}`).digest();
    const variantBucket = variantHash.readUInt32BE(0) % 100; // 0..99

    let cumulative = 0;
    let chosenVariant = exp.variants[0];
    for (const v of exp.variants) {
      cumulative += v.allocationPercentage;
      if (variantBucket < cumulative) {
        chosenVariant = v;
        break;
      }
    }

    // 5. Persist assignment with concurrency race protection (P2002 unique constraint)
    let assignment;
    let isNewAssignment = true;
    try {
      assignment = await prisma.experimentAssignment.create({
        data: {
          experimentId: exp.id,
          variantId: chosenVariant.id,
          subjectId,
          userId,
          visitorId,
        },
        include: { variant: true },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        isNewAssignment = false;
        assignment = await prisma.experimentAssignment.findUnique({
          where: {
            experimentId_subjectId: {
              experimentId: exp.id,
              subjectId,
            },
          },
          include: { variant: true },
        });
      } else {
        throw err;
      }
    }

    if (!assignment) {
      throw createExperimentError('Unable to persist experiment assignment.', 500, 'ASSIGNMENT_ERROR');
    }

    return {
      assigned: true,
      isNewAssignment,
      experimentId: exp.id,
      experimentKey: exp.key,
      experimentStatus: exp.status,
      subjectId,
      variant: {
        id: assignment.variant.id,
        key: assignment.variant.key,
        name: assignment.variant.name,
        isControl: assignment.variant.isControl,
        config: assignment.variant.config,
      },
      assignedAt: assignment.assignedAt,
      ga4Context: {
        experiment_id: exp.key,
        variant_id: assignment.variant.key,
      },
    };
  }

  /**
   * Record an experiment conversion/metric event ONLY if the subject was previously assigned.
   * If orderId is provided, revenue is strictly verified from PostgreSQL qualifying paid orders.
   */
  public async recordExperimentEvent(input: {
    experimentKeyOrId: string;
    userId?: string | null;
    visitorId?: string | null;
    eventName: string;
    orderId?: string | null;
    idempotencyKey?: string | null;
    metadata?: Record<string, any>;
  }) {
    const { subjectId, userId } = this.resolveSafeSubject({
      userId: input.userId,
      visitorId: input.visitorId,
    });

    const exp = await prisma.experiment.findFirst({
      where: {
        OR: [{ key: input.experimentKeyOrId.toLowerCase() }, { id: input.experimentKeyOrId }],
      },
    });

    if (!exp) {
      throw createExperimentError('Experiment not found.', 404, 'NOT_FOUND');
    }

    // Must have an existing assignment (Step 29: Do not count an event from users who were never assigned)
    const assignment = await prisma.experimentAssignment.findUnique({
      where: {
        experimentId_subjectId: {
          experimentId: exp.id,
          subjectId,
        },
      },
    });

    if (!assignment) {
      return {
        recorded: false,
        reason: 'SUBJECT_NOT_ASSIGNED',
      };
    }

    let verifiedRevenuePaise = 0;
    if (input.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: { payments: true },
      });
      if (!order || !isQualifyingPaidOrder(order) || order.status === 'CANCELLED') {
        return {
          recorded: false,
          reason: 'ORDER_NOT_QUALIFYING_PAID',
        };
      }
      const { refundedPaise } = getOrderRefundedPaise(order);
      verifiedRevenuePaise = Math.max(0, toPaise(order.totalAmount) - refundedPaise);
    }

    const dedupeKey =
      input.idempotencyKey ||
      (input.orderId
        ? `EXP_EVT:${exp.id}:${subjectId}:${input.eventName}:${input.orderId}`
        : null);

    if (dedupeKey) {
      const existingEvt = await prisma.experimentEvent.findUnique({
        where: { idempotencyKey: dedupeKey },
      });
      if (existingEvt) {
        return {
          recorded: true,
          idempotentReplay: true,
          event: existingEvt,
        };
      }
    }

    const event = await prisma.experimentEvent.create({
      data: {
        experimentId: exp.id,
        variantId: assignment.variantId,
        assignmentId: assignment.id,
        subjectId,
        userId: userId || assignment.userId,
        eventName: input.eventName.trim(),
        orderId: input.orderId || null,
        revenuePaise: verifiedRevenuePaise,
        idempotencyKey: dedupeKey,
        metadata: input.metadata || {},
      },
    });

    return {
      recorded: true,
      idempotentReplay: false,
      event,
    };
  }

  /**
   * List all experiments with summary counts.
   */
  public async listExperiments(status?: ExperimentStatus) {
    const experiments = await prisma.experiment.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        variants: {
          orderBy: { createdAt: 'asc' },
          include: {
            _count: {
              select: { assignments: true, events: true },
            },
          },
        },
        _count: {
          select: { assignments: true, events: true },
        },
      },
    });

    return experiments.map((exp) => {
      const minVariantSample = exp.variants.reduce(
        (min, v) => Math.min(min, v._count.assignments),
        exp.variants.length > 0 ? Infinity : 0
      );
      const hasSufficientSample = minVariantSample >= exp.minSampleSize;
      return {
        ...exp,
        sampleStatus: hasSufficientSample ? 'SUFFICIENT_SAMPLE' : 'INSUFFICIENT_SAMPLE',
      };
    });
  }

  /**
   * Retrieve a single experiment by ID with variants and audit logs.
   */
  public async getExperimentById(experimentId: string) {
    const exp = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        variants: {
          orderBy: { createdAt: 'asc' },
          include: {
            _count: {
              select: { assignments: true, events: true },
            },
          },
        },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
        _count: {
          select: { assignments: true, events: true },
        },
      },
    });
    if (!exp) {
      throw createExperimentError('Experiment not found.', 404, 'NOT_FOUND');
    }
    return exp;
  }

  /**
   * Compute full experiment results with statistical safeguards (Steps 29, 30, 31, 33).
   */
  public async getExperimentResults(experimentId: string) {
    const exp = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        variants: { orderBy: { createdAt: 'asc' } },
        assignments: true,
        events: true,
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });

    if (!exp) {
      throw createExperimentError('Experiment not found.', 404, 'NOT_FOUND');
    }

    // Map valid assigned subjectIds per variant
    const assignedSubjectsByVariant = new Map<string, Set<string>>();
    const assignedUserIdsByVariant = new Map<string, Set<string>>();
    for (const v of exp.variants) {
      assignedSubjectsByVariant.set(v.id, new Set());
      assignedUserIdsByVariant.set(v.id, new Set());
    }

    for (const a of exp.assignments) {
      assignedSubjectsByVariant.get(a.variantId)?.add(a.subjectId);
      if (a.userId) {
        assignedUserIdsByVariant.get(a.variantId)?.add(a.userId);
      }
    }

    const variantStats = exp.variants.map((v) => {
      const assignedSet = assignedSubjectsByVariant.get(v.id) || new Set<string>();
      const assignedUsers = assignedSet.size;

      // Filter events strictly to subjects assigned to this variant
      const validEvents = exp.events.filter(
        (e) => e.variantId === v.id && assignedSet.has(e.subjectId)
      );

      const primaryEvents = validEvents.filter((e) => e.eventName === exp.primaryMetric);
      const convertedSubjects = new Set(primaryEvents.map((e) => e.subjectId));
      const conversions = convertedSubjects.size;
      const conversionRatePercent = safePercent(conversions, assignedUsers);

      // Sum verified revenue
      const totalRevenuePaise = validEvents.reduce((sum, e) => sum + (e.revenuePaise || 0), 0);
      const revenue = toRupees(totalRevenuePaise);
      const aov = conversions > 0 ? toRupees(Math.round(totalRevenuePaise / conversions)) : 0;

      // Secondary metrics breakdown
      const secondaryMap: Record<string, { eventCount: number; uniqueUsers: number }> = {};
      for (const e of validEvents) {
        if (e.eventName === exp.primaryMetric) continue;
        if (!secondaryMap[e.eventName]) {
          secondaryMap[e.eventName] = { eventCount: 0, uniqueUsers: 0 };
        }
        secondaryMap[e.eventName].eventCount++;
      }
      for (const secKey of Object.keys(secondaryMap)) {
        const uniq = new Set(validEvents.filter((e) => e.eventName === secKey).map((e) => e.subjectId));
        secondaryMap[secKey].uniqueUsers = uniq.size;
      }

      // 95% Wilson / Wald confidence interval for conversion rate if sample >= 30
      let confidenceInterval95: [number, number] | null = null;
      if (assignedUsers >= 30) {
        const p = conversions / assignedUsers;
        const se = Math.sqrt((p * (1 - p)) / assignedUsers);
        const low = Math.max(0, Math.round((p - 1.96 * se) * 10000) / 100);
        const high = Math.min(100, Math.round((p + 1.96 * se) * 10000) / 100);
        confidenceInterval95 = [low, high];
      }

      const meetsMinSample = assignedUsers >= exp.minSampleSize;

      return {
        variantId: v.id,
        key: v.key,
        name: v.name,
        isControl: v.isControl,
        allocationPercentage: v.allocationPercentage,
        config: v.config,
        assignedUsers,
        eligibleUsers: assignedUsers,
        conversions,
        conversionRatePercent,
        revenue,
        aov,
        confidenceInterval95,
        sampleStatus: meetsMinSample ? 'SUFFICIENT_SAMPLE' : 'INSUFFICIENT_SAMPLE',
        secondaryMetrics: secondaryMap,
      };
    });

    const controlStat = variantStats.find((v) => v.isControl) || variantStats[0];
    const allMeetMinSample = variantStats.every((v) => v.assignedUsers >= exp.minSampleSize);

    const comparisons = variantStats.map((v) => {
      if (v.variantId === controlStat.variantId) {
        return {
          ...v,
          absoluteDiffPercentagePoints: 0,
          relativeLiftPercent: null as number | null,
          zScore: null as number | null,
          pValue: null as number | null,
          isStatisticallySignificant: false,
          comparisonSummary: 'Baseline Control Variant',
        };
      }

      const absDiff = Math.round((v.conversionRatePercent - controlStat.conversionRatePercent) * 100) / 100;
      const relLift =
        controlStat.conversionRatePercent > 0
          ? Math.round(((v.conversionRatePercent - controlStat.conversionRatePercent) / controlStat.conversionRatePercent) * 10000) / 100
          : null;

      let zScore: number | null = null;
      let pValue: number | null = null;
      let isSig = false;

      if (
        v.assignedUsers >= exp.minSampleSize &&
        controlStat.assignedUsers >= exp.minSampleSize &&
        v.conversions + controlStat.conversions >= 5
      ) {
        const p1 = v.conversions / v.assignedUsers;
        const p0 = controlStat.conversions / controlStat.assignedUsers;
        const pPool = (v.conversions + controlStat.conversions) / (v.assignedUsers + controlStat.assignedUsers);
        const se = Math.sqrt(pPool * (1 - pPool) * (1 / v.assignedUsers + 1 / controlStat.assignedUsers));
        if (se > 0) {
          zScore = Math.round(((p1 - p0) / se) * 1000) / 1000;
          pValue = Math.round(normalTwoTailedPValue(zScore) * 10000) / 10000;
          isSig = pValue < 0.05;
        }
      }

      let comparisonSummary = 'INSUFFICIENT SAMPLE';
      if (v.assignedUsers >= exp.minSampleSize && controlStat.assignedUsers >= exp.minSampleSize) {
        if (isSig && absDiff > 0) {
          comparisonSummary = `Observed higher conversion (+${absDiff} pp, p=${pValue})`;
        } else if (isSig && absDiff < 0) {
          comparisonSummary = `Observed lower conversion (${absDiff} pp, p=${pValue})`;
        } else {
          comparisonSummary = `Observed difference (${absDiff >= 0 ? '+' : ''}${absDiff} pp) is not statistically significant`;
        }
      } else {
        comparisonSummary = `Insufficient sample (${v.assignedUsers}/${exp.minSampleSize} assigned)`;
      }

      return {
        ...v,
        absoluteDiffPercentagePoints: absDiff,
        relativeLiftPercent: relLift,
        zScore,
        pValue,
        isStatisticallySignificant: isSig,
        comparisonSummary,
      };
    });

    // Overall conservative statistical evaluation (Step 30 & 31)
    let overallSampleStatus: 'INSUFFICIENT_SAMPLE' | 'SUFFICIENT_SAMPLE' = allMeetMinSample
      ? 'SUFFICIENT_SAMPLE'
      : 'INSUFFICIENT_SAMPLE';

    let statisticalConclusion = '';
    let recommendedAction = '';
    if (!allMeetMinSample) {
      statisticalConclusion = `INSUFFICIENT SAMPLE: Each variant requires at least ${exp.minSampleSize} assigned users before evaluating statistical significance. No winner can be declared.`;
      recommendedAction = 'CONTINUE_COLLECTING_DATA';
    } else {
      const sigPositive = comparisons.find(
        (c) => !c.isControl && c.isStatisticallySignificant && c.absoluteDiffPercentagePoints > 0
      );
      if (sigPositive) {
        statisticalConclusion = `Observed statistically significant higher conversion in ${sigPositive.name} (+${sigPositive.absoluteDiffPercentagePoints} percentage points over Control, p=${sigPositive.pValue}).`;
        recommendedAction = 'CANDIDATE_FOR_ROLLOUT_REVIEW';
      } else {
        statisticalConclusion =
          'No variant has demonstrated a statistically significant improvement over Control (alpha = 0.05).';
        recommendedAction = 'KEEP_CONTROL_OR_ITERATE';
      }
    }

    const durationDays = exp.startAt
      ? Math.max(
          0,
          Math.round(
            (((exp.endAt ? exp.endAt.getTime() : Date.now()) - exp.startAt.getTime()) /
              (24 * 60 * 60 * 1000)) *
              10
          ) / 10
        )
      : 0;

    return {
      experiment: {
        id: exp.id,
        key: exp.key,
        name: exp.name,
        description: exp.description,
        status: exp.status,
        primaryMetric: exp.primaryMetric,
        secondaryMetrics: exp.secondaryMetrics,
        trafficPercentage: exp.trafficPercentage,
        minSampleSize: exp.minSampleSize,
        startAt: exp.startAt,
        endAt: exp.endAt,
        durationDays,
        createdAt: exp.createdAt,
      },
      sampleStatus: overallSampleStatus,
      minimumSampleWarning: !allMeetMinSample
        ? `Minimum sample threshold of ${exp.minSampleSize} users per variant has not been reached.`
        : null,
      statisticalConclusion,
      recommendedAction,
      variants: comparisons,
      auditLogs: exp.auditLogs,
    };
  }
}

export const experimentService = new ExperimentService();
