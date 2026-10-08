// backend/src/services/ga4Idempotency.service.ts
import { AnalyticsEventType, PaymentStatus, OrderStatus } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { extractOrderCouponMeta } from './coupon.service.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

export interface SafeGA4AnalyticsItemPayload {
  item_id: string;
  item_name: string;
  item_brand: string;
  item_category: string;
  item_variant?: string;
  price: number;
  quantity: number;
}

export interface PurchaseAnalyticsClaimResult {
  eligible: boolean;
  alreadyRecorded: boolean;
  idempotencyKey: string | null;
  eventId?: string;
  reason?: string;
  payload?: {
    transactionId: string;
    orderId: string;
    currency: string;
    value: number;
    tax: number;
    shipping: number;
    discount: number;
    couponCode: string | null;
    items: SafeGA4AnalyticsItemPayload[];
  };
}

export interface RefundAnalyticsClaimResult {
  eligible: boolean;
  alreadyRecorded: boolean;
  idempotencyKey: string | null;
  refundId: string | null;
  eventId?: string;
  reason?: string;
  payload?: {
    transactionId: string;
    orderId: string;
    refundId: string;
    currency: string;
    value: number;
    couponCode: string | null;
    items: SafeGA4AnalyticsItemPayload[];
  };
}

function roundMoney(val: unknown): number {
  const num = Number(val);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100) / 100;
}

function mapOrderItemsToSafeGA4Items(items: any[]): SafeGA4AnalyticsItemPayload[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const product = item.product || {};
    const sku = String(product.sku || item.productId || 'makhana-pack').trim();
    const name = String(item.productName || product.name || 'NYUTA ELITE Makhana').trim();
    const category = String(
      product.category || (name.toLowerCase().includes('premium') ? 'Premium' : 'Normal')
    ).trim();
    const weightNum = Number(product.weight || 0);
    const out: SafeGA4AnalyticsItemPayload = {
      item_id: sku,
      item_name: name,
      item_brand: 'NYUTA ELITE MAKHANA',
      item_category: category,
      price: roundMoney(item.price),
      quantity: Math.max(1, Math.round(Number(item.quantity || 1))),
    };
    if (weightNum > 0) {
      out.item_variant = `${weightNum}g`;
    }
    return out;
  });
}

export class GA4IdempotencyService {
  /**
   * Authoritatively verify and atomically claim GA4 `purchase` eligibility for an order.
   * - Requires order.paymentStatus === 'CAPTURED' and order.status !== 'CANCELLED'.
   * - Guarantees global idempotency in PostgreSQL across browsers, devices, cleared localStorage, and concurrent requests.
   * - Never alters order status, payment status, totals, or inventory.
   * - Never exposes PII, addresses, JWTs, or payment secrets.
   */
  async claimPurchaseEvent(
    orderIdOrNumber: string,
    actor: { id: string; role: string }
  ): Promise<PurchaseAnalyticsClaimResult> {
    const cleanTarget = String(orderIdOrNumber || '').trim();
    if (!cleanTarget) {
      throw new NotFoundError('Order not found');
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: cleanTarget }, { orderNumber: cleanTarget }],
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                sku: true,
                name: true,
                category: true,
                weight: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (actor.role !== 'ADMIN' && order.userId !== actor.id) {
      throw new ForbiddenError('You do not have permission to access this order');
    }

    // Strict financial gate: only CAPTURED, non-cancelled orders can ever emit GA4 purchase
    if (
      order.paymentStatus !== PaymentStatus.CAPTURED ||
      order.status === OrderStatus.CANCELLED
    ) {
      return {
        eligible: false,
        alreadyRecorded: false,
        idempotencyKey: null,
        reason:
          order.status === OrderStatus.CANCELLED
            ? 'ORDER_CANCELLED'
            : `PAYMENT_STATUS_${order.paymentStatus}`,
      };
    }

    const idempotencyKey = `PURCHASE:${order.id}`;

    // Fast pre-check before attempting atomic insert
    const existing = await prisma.analyticsEvent.findUnique({
      where: { idempotencyKey },
      select: { id: true, idempotencyKey: true },
    });

    if (existing) {
      return {
        eligible: false,
        alreadyRecorded: true,
        idempotencyKey: existing.idempotencyKey,
        eventId: existing.id,
        reason: 'ALREADY_RECORDED',
      };
    }

    const { couponMeta } = extractOrderCouponMeta(order.shippingAddress);
    const safeItems = mapOrderItemsToSafeGA4Items(order.items);

    try {
      const created = await prisma.analyticsEvent.create({
        data: {
          idempotencyKey,
          orderId: order.id,
          eventType: AnalyticsEventType.PURCHASE,
          transactionId: order.orderNumber,
          currency: order.currency || 'INR',
          value: roundMoney(order.totalAmount),
        },
      });

      return {
        eligible: true,
        alreadyRecorded: false,
        idempotencyKey: created.idempotencyKey,
        eventId: created.id,
        payload: {
          transactionId: order.orderNumber,
          orderId: order.id,
          currency: order.currency || 'INR',
          value: roundMoney(order.totalAmount),
          tax: roundMoney(order.taxAmount || 0),
          shipping: roundMoney(order.shippingAmount || 0),
          discount: roundMoney(order.discountAmount || 0),
          couponCode: couponMeta?.couponCode || null,
          items: safeItems,
        },
      };
    } catch (err: any) {
      // P2002: Unique constraint violation from concurrent request
      if (err?.code === 'P2002') {
        const concurrentRecord = await prisma.analyticsEvent.findUnique({
          where: { idempotencyKey },
          select: { id: true, idempotencyKey: true },
        });
        return {
          eligible: false,
          alreadyRecorded: true,
          idempotencyKey,
          eventId: concurrentRecord?.id,
          reason: 'ALREADY_RECORDED',
        };
      }
      throw err;
    }
  }

  /**
   * Authoritatively verify and atomically claim GA4 `refund` eligibility for an order + refund identity.
   * - Requires backend-confirmed REFUNDED payment record (or REFUNDED order paymentStatus).
   * - Supports multiple distinct refunds on the same order while deduplicating each individual refund globally.
   * - Never alters order status, payment status, totals, or inventory.
   */
  async claimRefundEvent(
    orderIdOrNumber: string,
    params: { refundId?: string | null },
    actor: { id: string; role: string }
  ): Promise<RefundAnalyticsClaimResult> {
    const cleanTarget = String(orderIdOrNumber || '').trim();
    if (!cleanTarget) {
      throw new NotFoundError('Order not found');
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: cleanTarget }, { orderNumber: cleanTarget }],
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                sku: true,
                name: true,
                category: true,
                weight: true,
              },
            },
          },
        },
        payments: {
          where: { status: PaymentStatus.REFUNDED },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            providerPaymentId: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (actor.role !== 'ADMIN' && order.userId !== actor.id) {
      throw new ForbiddenError('You do not have permission to access this order');
    }

    const refundedPayments = order.payments || [];
    const hasConfirmedRefund =
      order.paymentStatus === PaymentStatus.REFUNDED || refundedPayments.length > 0;

    if (!hasConfirmedRefund) {
      return {
        eligible: false,
        alreadyRecorded: false,
        idempotencyKey: null,
        refundId: null,
        reason: 'REFUND_NOT_CONFIRMED',
      };
    }

    const requestedRefundId = params?.refundId ? String(params.refundId).trim() : null;
    let resolvedRefundId: string | null = null;
    let resolvedRefundAmount = 0;

    if (requestedRefundId) {
      const matchedPayment = refundedPayments.find(
        (p) => p.id === requestedRefundId || p.providerPaymentId === requestedRefundId
      );
      if (matchedPayment) {
        resolvedRefundId = matchedPayment.id;
        resolvedRefundAmount = roundMoney(matchedPayment.amount);
      } else if (
        order.paymentStatus === PaymentStatus.REFUNDED &&
        refundedPayments.length === 0 &&
        requestedRefundId === `ORDER_REFUND:${order.id}`
      ) {
        resolvedRefundId = `ORDER_REFUND:${order.id}`;
        resolvedRefundAmount = roundMoney(order.totalAmount);
      } else {
        return {
          eligible: false,
          alreadyRecorded: false,
          idempotencyKey: null,
          refundId: requestedRefundId,
          reason: 'REFUND_RECORD_NOT_FOUND',
        };
      }
    } else if (refundedPayments.length > 0) {
      // Find existing recorded refund events for this order so if there are multiple legitimate refunds,
      // we pick the next unrecorded refund in chronological order (or the last one if all are already recorded)
      const existingEvents = await prisma.analyticsEvent.findMany({
        where: {
          orderId: order.id,
          eventType: AnalyticsEventType.REFUND,
        },
        select: { refundId: true, idempotencyKey: true, id: true },
      });
      const recordedRefundIds = new Set(existingEvents.map((e) => e.refundId).filter(Boolean));
      const unrecordedPayment = refundedPayments.find((p) => !recordedRefundIds.has(p.id));
      const targetPayment = unrecordedPayment || refundedPayments[refundedPayments.length - 1];
      resolvedRefundId = targetPayment.id;
      resolvedRefundAmount = roundMoney(targetPayment.amount);
    } else {
      resolvedRefundId = `ORDER_REFUND:${order.id}`;
      resolvedRefundAmount = roundMoney(order.totalAmount);
    }

    const idempotencyKey = `REFUND:${order.id}:${resolvedRefundId}`;

    const existing = await prisma.analyticsEvent.findUnique({
      where: { idempotencyKey },
      select: { id: true, idempotencyKey: true },
    });

    if (existing) {
      return {
        eligible: false,
        alreadyRecorded: true,
        idempotencyKey: existing.idempotencyKey,
        refundId: resolvedRefundId,
        eventId: existing.id,
        reason: 'ALREADY_RECORDED',
      };
    }

    const { couponMeta } = extractOrderCouponMeta(order.shippingAddress);
    const safeItems = mapOrderItemsToSafeGA4Items(order.items);

    try {
      const created = await prisma.analyticsEvent.create({
        data: {
          idempotencyKey,
          orderId: order.id,
          refundId: resolvedRefundId,
          eventType: AnalyticsEventType.REFUND,
          transactionId: order.orderNumber,
          currency: order.currency || 'INR',
          value: resolvedRefundAmount,
        },
      });

      return {
        eligible: true,
        alreadyRecorded: false,
        idempotencyKey: created.idempotencyKey,
        refundId: resolvedRefundId,
        eventId: created.id,
        payload: {
          transactionId: order.orderNumber,
          orderId: order.id,
          refundId: resolvedRefundId,
          currency: order.currency || 'INR',
          value: resolvedRefundAmount,
          couponCode: couponMeta?.couponCode || null,
          items: safeItems,
        },
      };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const concurrentRecord = await prisma.analyticsEvent.findUnique({
          where: { idempotencyKey },
          select: { id: true, idempotencyKey: true },
        });
        return {
          eligible: false,
          alreadyRecorded: true,
          idempotencyKey,
          refundId: resolvedRefundId,
          eventId: concurrentRecord?.id,
          reason: 'ALREADY_RECORDED',
        };
      }
      throw err;
    }
  }
}

export const ga4IdempotencyService = new GA4IdempotencyService();
