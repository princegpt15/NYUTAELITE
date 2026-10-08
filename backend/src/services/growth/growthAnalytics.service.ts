// backend/src/services/growth/growthAnalytics.service.ts
import prisma from '../../lib/prisma.js';
import {
  resolveAnalyticsDateRange,
  isQualifyingPaidOrder,
  getOrderRefundedPaise,
  toPaise,
  toRupees,
  safePercent,
  type AnalyticsDateRangeInput,
} from '../analytics.service.js';
import { extractOrderCouponMeta } from '../coupon.service.js';
import { customerSegmentationService } from './customerSegmentation.service.js';
import { experimentService } from './experiment.service.js';

export const STANDARDIZED_BEHAVIORAL_EVENTS = [
  // Storefront & Conversion Funnel
  'page_view',
  'view_item_list',
  'select_item',
  'view_item',
  'add_to_cart',
  'remove_from_cart',
  'view_cart',
  'begin_checkout',
  'add_shipping_info',
  'add_payment_info',
  'purchase',
  'refund',
  // Retention
  'view_wishlist',
  'add_to_wishlist',
  'remove_from_wishlist',
  'wishlist_to_cart',
  'begin_reorder',
  'submit_review',
  'back_in_stock_signup',
  'loyalty_view',
  'referral_share',
  // Growth & Marketing
  'campaign_click',
  'cart_recovery_click',
] as const;

export type StandardizedEventName = (typeof STANDARDIZED_BEHAVIORAL_EVENTS)[number];

const SENSITIVE_PII_KEYS = [
  'email',
  'phone',
  'phonenumber',
  'mobile',
  'password',
  'passwordhash',
  'address',
  'addressline1',
  'addressline2',
  'street',
  'token',
  'accesstoken',
  'refreshtoken',
  'jwt',
  'secret',
  'signature',
  'fullname',
  'name',
];

/**
 * Strip any PII or secret fields from behavioral metadata before persistence.
 */
export function sanitizeEventMetadata(meta: unknown): Record<string, any> {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return {};
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(meta as Record<string, any>)) {
    const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (SENSITIVE_PII_KEYS.includes(norm)) continue;
    if (typeof v === 'string') {
      // Mask if value looks like an email or JWT
      if (v.includes('@') || /^eyJ[A-Za-z0-9_-]+\./.test(v)) continue;
      clean[k] = v.slice(0, 200);
    } else if (typeof v === 'number' || typeof v === 'boolean' || v === null) {
      clean[k] = v;
    }
  }
  return clean;
}

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function toIstYearMonth(utcDate: Date): string {
  const shifted = new Date(utcDate.getTime() + IST_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function addMonthsToYm(ym: string, offsetMonths: number): string {
  const [y, m] = ym.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + offsetMonths, 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
}

interface CacheEntry<T> {
  data: T;
  calculatedAt: string;
  expiresAt: number;
}

const CACHE_TTL_MS = 15_000; // Short-lived 15s server-side cache for aggregate admin dashboard only

export class GrowthAnalyticsService {
  private dashboardCache = new Map<string, CacheEntry<any>>();

  public clearCache(): void {
    this.dashboardCache.clear();
  }

  /**
   * Record a first-party behavioral event with strict PII sanitization.
   */
  public async trackBehavioralEvent(input: {
    eventName: string;
    userId?: string | null;
    visitorId?: string | null;
    productId?: string | null;
    orderId?: string | null;
    metadata?: Record<string, any>;
  }) {
    const eventName = (input.eventName || '').trim().toLowerCase();
    if (!STANDARDIZED_BEHAVIORAL_EVENTS.includes(eventName as StandardizedEventName)) {
      const err: any = new Error(
        `Invalid eventName "${input.eventName}". Must be one of the standardized taxonomy events.`
      );
      err.statusCode = 422;
      err.code = 'INVALID_EVENT_NAME';
      throw err;
    }

    const visitorId = input.visitorId ? String(input.visitorId).trim() : null;
    if (visitorId && visitorId.includes('@')) {
      const err: any = new Error('visitorId must not contain email or PII.');
      err.statusCode = 422;
      err.code = 'PII_IN_VISITOR_ID';
      throw err;
    }

    const sanitizedMeta = sanitizeEventMetadata(input.metadata);

    const record = await prisma.behavioralEvent.create({
      data: {
        eventName,
        userId: input.userId || null,
        visitorId,
        productId: input.productId || null,
        orderId: input.orderId || null,
        metadata: sanitizedMeta,
      },
    });

    this.clearCache();
    return record;
  }

  /**
   * STEP 4 & STEP 5: Conversion Funnel & Detailed Checkout Funnel.
   * READ-ONLY: Never mutates Order, Payment, Refund, Coupon, or Loyalty.
   */
  public async getFunnelAnalytics(rangeInput: AnalyticsDateRangeInput = {}) {
    const dateRange = resolveAnalyticsDateRange(rangeInput);
    const { startUtc, endUtc } = dateRange;

    const [events, cartsInPeriod, ordersInPeriod] = await Promise.all([
      prisma.behavioralEvent.findMany({
        where: { createdAt: { gte: startUtc, lte: endUtc } },
        select: { eventName: true, userId: true, visitorId: true, productId: true, orderId: true },
      }),
      prisma.cart.findMany({
        where: {
          OR: [
            { createdAt: { gte: startUtc, lte: endUtc } },
            { updatedAt: { gte: startUtc, lte: endUtc } },
          ],
        },
        include: { items: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startUtc, lte: endUtc } },
        include: { payments: true },
      }),
    ]);

    const getEventStats = (names: string[]) => {
      const matching = events.filter((e) => names.includes(e.eventName));
      const actors = new Set<string>();
      for (const e of matching) {
        if (e.userId) actors.add(`u:${e.userId}`);
        else if (e.visitorId) actors.add(`v:${e.visitorId}`);
      }
      return { eventCount: matching.length, actorCount: actors.size };
    };

    // Authoritative Order counts from PostgreSQL
    const totalOrdersStarted = ordersInPeriod.length;
    const ordersWithShippingAddress = ordersInPeriod.filter((o) => Boolean(o.shippingAddress)).length;
    const ordersWithPaymentInitiated = ordersInPeriod.filter(
      (o) => Boolean(o.razorpayOrderId) || o.payments.length > 0
    ).length;

    const qualifyingPaidOrders = ordersInPeriod.filter(
      (o) => isQualifyingPaidOrder(o) && o.status !== 'CANCELLED'
    );
    const confirmedPaidOrders = qualifyingPaidOrders.filter((o) =>
      ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)
    );

    const failedPaymentOrders = ordersInPeriod.filter(
      (o) =>
        !isQualifyingPaidOrder(o) &&
        (o.paymentStatus === 'FAILED' || o.payments.some((p) => p.status === 'FAILED'))
    );
    const unpaidCancelledOrders = ordersInPeriod.filter(
      (o) => !isQualifyingPaidOrder(o) && o.status === 'CANCELLED'
    );

    const cartsWithItems = cartsInPeriod.filter((c) => c.items.length > 0);

    // Core Storefront Funnel (Step 4)
    const landingStats = getEventStats(['page_view', 'view_item_list']);
    const productViewStats = getEventStats(['view_item']);
    const addToCartEventStats = getEventStats(['add_to_cart']);
    const viewCartEventStats = getEventStats(['view_cart']);
    const beginCheckoutEventStats = getEventStats(['begin_checkout']);
    const shippingEventStats = getEventStats(['add_shipping_info']);
    const paymentEventStats = getEventStats(['add_payment_info']);

    const coreStagesRaw = [
      {
        stageKey: 'landing',
        label: 'Landing / Catalog Browse',
        sourceType: 'USER_EVENTS',
        eventCount: landingStats.eventCount,
        userOrActorCount: landingStats.actorCount,
        authoritativeCount: Math.max(landingStats.eventCount, productViewStats.eventCount),
      },
      {
        stageKey: 'product_view',
        label: 'Product Detail View',
        sourceType: 'USER_EVENTS',
        eventCount: productViewStats.eventCount,
        userOrActorCount: productViewStats.actorCount,
        authoritativeCount: productViewStats.eventCount,
      },
      {
        stageKey: 'add_to_cart',
        label: 'Add to Cart',
        sourceType: 'HYBRID_EVENTS_AND_DB_CARTS',
        eventCount: addToCartEventStats.eventCount,
        userOrActorCount: Math.max(addToCartEventStats.actorCount, cartsWithItems.length),
        authoritativeCount: Math.max(addToCartEventStats.eventCount, cartsWithItems.length),
      },
      {
        stageKey: 'view_cart',
        label: 'View Cart',
        sourceType: 'HYBRID_EVENTS_AND_DB_CARTS',
        eventCount: viewCartEventStats.eventCount,
        userOrActorCount: Math.max(viewCartEventStats.actorCount, cartsWithItems.length),
        authoritativeCount: Math.max(viewCartEventStats.eventCount, cartsWithItems.length),
      },
      {
        stageKey: 'begin_checkout',
        label: 'Begin Checkout',
        sourceType: 'POSTGRESQL_ORDERS',
        eventCount: beginCheckoutEventStats.eventCount,
        userOrActorCount: new Set(ordersInPeriod.map((o) => o.userId)).size,
        authoritativeCount: Math.max(beginCheckoutEventStats.eventCount, totalOrdersStarted),
      },
      {
        stageKey: 'shipping_information',
        label: 'Shipping Information Added',
        sourceType: 'POSTGRESQL_ORDERS',
        eventCount: shippingEventStats.eventCount,
        userOrActorCount: new Set(
          ordersInPeriod.filter((o) => Boolean(o.shippingAddress)).map((o) => o.userId)
        ).size,
        authoritativeCount: Math.max(shippingEventStats.eventCount, ordersWithShippingAddress),
      },
      {
        stageKey: 'payment_initiated',
        label: 'Payment Initiated',
        sourceType: 'POSTGRESQL_PAYMENTS',
        eventCount: paymentEventStats.eventCount,
        userOrActorCount: new Set(
          ordersInPeriod
            .filter((o) => Boolean(o.razorpayOrderId) || o.payments.length > 0)
            .map((o) => o.userId)
        ).size,
        authoritativeCount: Math.max(paymentEventStats.eventCount, ordersWithPaymentInitiated),
      },
      {
        stageKey: 'captured_purchase',
        label: 'Captured Purchase (Authoritative)',
        sourceType: 'POSTGRESQL_CAPTURED_ORDERS',
        eventCount: qualifyingPaidOrders.length,
        userOrActorCount: new Set(qualifyingPaidOrders.map((o) => o.userId)).size,
        authoritativeCount: qualifyingPaidOrders.length,
      },
    ];

    const coreFunnel = coreStagesRaw.map((stage, idx) => {
      const prevCount = idx === 0 ? stage.authoritativeCount : coreStagesRaw[idx - 1].authoritativeCount;
      const stepConversionPercent =
        idx === 0
          ? stage.authoritativeCount > 0
            ? 100
            : 0
          : prevCount > 0
          ? Math.min(100, safePercent(stage.authoritativeCount, prevCount))
          : 0;
      const dropOffPercent =
        idx === 0 || prevCount <= 0 ? 0 : Math.max(0, Math.round((100 - stepConversionPercent) * 100) / 100);

      return {
        ...stage,
        stepConversionPercent,
        dropOffPercent,
      };
    });

    // Detailed Checkout Funnel (Step 5) — Strictly PostgreSQL Authoritative
    const checkoutStagesRaw = [
      {
        stageKey: 'cart',
        label: 'Active Carts / Checkout Entry',
        count: Math.max(cartsWithItems.length, totalOrdersStarted),
        uniqueCustomers: new Set([
          ...cartsWithItems.map((c) => c.userId),
          ...ordersInPeriod.map((o) => o.userId),
        ]).size,
      },
      {
        stageKey: 'checkout_started',
        label: 'Checkout Started (Order Created)',
        count: totalOrdersStarted,
        uniqueCustomers: new Set(ordersInPeriod.map((o) => o.userId)).size,
      },
      {
        stageKey: 'address_added',
        label: 'Shipping Address Verified',
        count: ordersWithShippingAddress,
        uniqueCustomers: new Set(
          ordersInPeriod.filter((o) => Boolean(o.shippingAddress)).map((o) => o.userId)
        ).size,
      },
      {
        stageKey: 'payment_initiated',
        label: 'Payment Gateway Order Initiated',
        count: ordersWithPaymentInitiated,
        uniqueCustomers: new Set(
          ordersInPeriod
            .filter((o) => Boolean(o.razorpayOrderId) || o.payments.length > 0)
            .map((o) => o.userId)
        ).size,
      },
      {
        stageKey: 'payment_captured',
        label: 'Payment Captured (Verified)',
        count: qualifyingPaidOrders.length,
        uniqueCustomers: new Set(qualifyingPaidOrders.map((o) => o.userId)).size,
      },
      {
        stageKey: 'order_confirmed',
        label: 'Order Confirmed / Fulfilled',
        count: confirmedPaidOrders.length,
        uniqueCustomers: new Set(confirmedPaidOrders.map((o) => o.userId)).size,
      },
    ];

    const checkoutFunnel = checkoutStagesRaw.map((stage, idx) => {
      const prevCount = idx === 0 ? stage.count : checkoutStagesRaw[idx - 1].count;
      const topCount = checkoutStagesRaw[0].count;
      const conversionFromPreviousPercent =
        idx === 0 ? (stage.count > 0 ? 100 : 0) : prevCount > 0 ? Math.min(100, safePercent(stage.count, prevCount)) : 0;
      const dropOffFromPreviousPercent =
        idx === 0 || prevCount <= 0 ? 0 : Math.max(0, Math.round((100 - conversionFromPreviousPercent) * 100) / 100);
      const overallConversionPercent = topCount > 0 ? Math.min(100, safePercent(stage.count, topCount)) : 0;

      return {
        ...stage,
        conversionFromPreviousPercent,
        dropOffFromPreviousPercent,
        overallConversionPercent,
      };
    });

    return {
      calculatedAt: new Date().toISOString(),
      freshnessStatus: 'LIVE',
      dateRange,
      sessionTrackingNote:
        'First-party user events, actors, and authoritative PostgreSQL orders are reported separately. Synthetic session counts are never fabricated.',
      coreFunnel,
      checkoutFunnel,
      exclusions: {
        failedPaymentsExcludedCount: failedPaymentOrders.length,
        unpaidCancelledExcludedCount: unpaidCancelledOrders.length,
      },
    };
  }

  /**
   * STEP 6 & STEP 17: Revenue Funnel & AOV Analytics (Consistent with Phase 12).
   */
  public async getRevenueAndAovAnalytics(rangeInput: AnalyticsDateRangeInput = {}) {
    const dateRange = resolveAnalyticsDateRange(rangeInput);
    const { startUtc, endUtc } = dateRange;

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startUtc, lte: endUtc } },
      include: { payments: true },
    });

    let qualifyingPaidOrdersCount = 0;
    let excludedFailedOrdersCount = 0;
    let excludedUnpaidCancelledCount = 0;
    let excludedPendingOrdersCount = 0;

    let grossSalesPaise = 0;
    let refundsPaise = 0;
    let totalDiscountPaise = 0;

    for (const order of orders) {
      const isPaid = isQualifyingPaidOrder(order);
      if (!isPaid) {
        if (order.status === 'CANCELLED') {
          excludedUnpaidCancelledCount++;
        } else if (
          order.paymentStatus === 'FAILED' ||
          order.payments.some((p) => p.status === 'FAILED')
        ) {
          excludedFailedOrdersCount++;
        } else {
          excludedPendingOrdersCount++;
        }
        continue;
      }

      if (order.status === 'CANCELLED' && order.paymentStatus !== 'REFUNDED' && order.paymentStatus !== 'CAPTURED') {
        excludedUnpaidCancelledCount++;
        continue;
      }

      qualifyingPaidOrdersCount++;
      grossSalesPaise += toPaise(order.totalAmount);
      totalDiscountPaise += toPaise(order.discountAmount || 0);
      const { refundedPaise } = getOrderRefundedPaise(order);
      refundsPaise += refundedPaise;
    }

    const netRevenuePaise = Math.max(0, grossSalesPaise - refundsPaise);
    const grossSales = toRupees(grossSalesPaise);
    const refunds = toRupees(refundsPaise);
    const netRevenue = toRupees(netRevenuePaise);
    const totalDiscounts = toRupees(totalDiscountPaise);

    const grossAov =
      qualifyingPaidOrdersCount > 0
        ? toRupees(Math.round(grossSalesPaise / qualifyingPaidOrdersCount))
        : 0;
    const netAov =
      qualifyingPaidOrdersCount > 0
        ? toRupees(Math.round(netRevenuePaise / qualifyingPaidOrdersCount))
        : 0;

    return {
      calculatedAt: new Date().toISOString(),
      freshnessStatus: 'LIVE',
      dateRange,
      financialSourceOfTruth: 'PostgreSQL Orders + Verified Captured Payments + Verified Refunds',
      aovDefinition:
        'Gross AOV = Gross Sales / Qualifying Paid Orders; Net AOV = (Gross Sales - Verified Refunds) / Qualifying Paid Orders. Excludes failed, pending, and unpaid cancelled orders.',
      metrics: {
        qualifyingPaidOrdersCount,
        grossSales,
        refunds,
        netRevenue,
        totalDiscounts,
        grossAov,
        netAov,
        excludedOrders: {
          failedPayments: excludedFailedOrdersCount,
          unpaidCancelled: excludedUnpaidCancelledCount,
          pendingUnpaid: excludedPendingOrdersCount,
        },
      },
    };
  }

  /**
   * STEP 7 & STEP 8: Product Conversion & Performance Analytics.
   */
  public async getProductConversionAnalytics(rangeInput: AnalyticsDateRangeInput = {}) {
    const dateRange = resolveAnalyticsDateRange(rangeInput);
    const { startUtc, endUtc } = dateRange;

    const [products, events, orders] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.behavioralEvent.findMany({
        where: {
          createdAt: { gte: startUtc, lte: endUtc },
          productId: { not: null },
          eventName: { in: ['view_item', 'add_to_cart'] },
        },
        select: { productId: true, eventName: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startUtc, lte: endUtc } },
        include: { items: true, payments: true },
      }),
    ]);

    const viewsByProduct = new Map<string, number>();
    const addToCartByProduct = new Map<string, number>();

    for (const ev of events) {
      if (!ev.productId) continue;
      if (ev.eventName === 'view_item') {
        viewsByProduct.set(ev.productId, (viewsByProduct.get(ev.productId) || 0) + 1);
      } else if (ev.eventName === 'add_to_cart') {
        addToCartByProduct.set(ev.productId, (addToCartByProduct.get(ev.productId) || 0) + 1);
      }
    }

    const productRows = products.map((product) => {
      const views = viewsByProduct.get(product.id) || 0;
      const addToCartCount = addToCartByProduct.get(product.id) || 0;

      let checkoutAppearances = 0;
      let purchases = 0;
      let unitsSold = 0;
      let grossRevenuePaise = 0;
      let refundsPaise = 0;
      const buyerOrderCounts = new Map<string, number>();

      for (const order of orders) {
        const matchingItems = order.items.filter((i) => i.productId === product.id);
        if (matchingItems.length === 0) continue;

        checkoutAppearances++;

        if (!isQualifyingPaidOrder(order) || order.status === 'CANCELLED') {
          continue;
        }

        purchases++;
        buyerOrderCounts.set(order.userId, (buyerOrderCounts.get(order.userId) || 0) + 1);

        const itemQty = matchingItems.reduce((s, i) => s + i.quantity, 0);
        const itemGrossPaise = matchingItems.reduce(
          (s, i) => s + toPaise(i.subtotal || i.price * i.quantity),
          0
        );
        unitsSold += itemQty;
        grossRevenuePaise += itemGrossPaise;

        // Prorate order refund if applicable
        const { refundedPaise: orderRefundPaise } = getOrderRefundedPaise(order);
        if (orderRefundPaise > 0 && order.subtotal > 0) {
          const share = Math.min(1, toRupees(itemGrossPaise) / order.subtotal);
          refundsPaise += Math.round(orderRefundPaise * share);
        }
      }

      const netRevenuePaise = Math.max(0, grossRevenuePaise - refundsPaise);
      const repeatCustomersCount = Array.from(buyerOrderCounts.values()).filter((c) => c >= 2).length;
      const totalUniqueBuyers = buyerOrderCounts.size;
      const repeatPurchaseRatePercent = safePercent(repeatCustomersCount, totalUniqueBuyers);

      // Step 7: Never fabricate conversion rate if product views are 0
      const hasViewData = views > 0;
      const conversionRatePercent = hasViewData ? Math.min(100, safePercent(purchases, views)) : null;
      const conversionStatus = hasViewData ? 'AVAILABLE' : 'INSUFFICIENT_DATA';

      const sufficientSample = views >= 10 || checkoutAppearances >= 3;

      return {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        category: product.category,
        price: product.price,
        stock: product.stock,
        views,
        addToCartCount,
        checkoutAppearances,
        purchases,
        unitsSold,
        grossRevenue: toRupees(grossRevenuePaise),
        refunds: toRupees(refundsPaise),
        netRevenue: toRupees(netRevenuePaise),
        uniqueBuyers: totalUniqueBuyers,
        repeatCustomersCount,
        repeatPurchaseRatePercent,
        conversionRatePercent,
        conversionStatus,
        sampleSizeStatus: sufficientSample ? 'SUFFICIENT_SAMPLE' : 'SMALL_SAMPLE',
      };
    });

    const topByRevenue = [...productRows].sort((a, b) => b.netRevenue - a.netRevenue);
    const topByUnits = [...productRows].sort((a, b) => b.unitsSold - a.unitsSold);
    const topByOrders = [...productRows].sort((a, b) => b.purchases - a.purchases);
    const topByConversion = productRows
      .filter((p) => p.conversionRatePercent !== null)
      .sort((a, b) => (b.conversionRatePercent || 0) - (a.conversionRatePercent || 0));
    const topByRepeatPurchase = [...productRows].sort(
      (a, b) => b.repeatCustomersCount - a.repeatCustomersCount
    );

    // Step 8: Bottom-performing products only where sufficient sample exists
    const bottomPerformers = productRows
      .filter((p) => p.sampleSizeStatus === 'SUFFICIENT_SAMPLE')
      .sort((a, b) => a.netRevenue - b.netRevenue);

    return {
      calculatedAt: new Date().toISOString(),
      freshnessStatus: 'LIVE',
      dateRange,
      conversionDefinition:
        'Product Conversion Rate = (Qualifying Paid Orders containing Product / Product Detail Views) * 100. Returns null (INSUFFICIENT_DATA) when views === 0.',
      products: productRows,
      rankings: {
        topByRevenue,
        topByUnits,
        topByOrders,
        topByConversion,
        topByRepeatPurchase,
        bottomPerformers,
      },
    };
  }

  /**
   * STEP 9, 10 & 45: Cart & Abandoned Cart Recovery Analytics.
   */
  public async getCartRecoveryAnalytics(rangeInput: AnalyticsDateRangeInput = {}) {
    const dateRange = resolveAnalyticsDateRange(rangeInput);
    const { startUtc, endUtc } = dateRange;

    const [activeCarts, recoveries, clickEvents] = await Promise.all([
      prisma.cart.findMany({
        where: { items: { some: {} } },
        select: { id: true, userId: true, updatedAt: true },
      }),
      prisma.cartRecovery.findMany({
        where: { createdAt: { gte: startUtc, lte: endUtc } },
        include: {
          user: {
            select: {
              id: true,
              orders: {
                include: { payments: true },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      }),
      prisma.behavioralEvent.count({
        where: {
          eventName: 'cart_recovery_click',
          createdAt: { gte: startUtc, lte: endUtc },
        },
      }),
    ]);

    const eligibleCount = recoveries.length;
    const contactedRecoveries = recoveries.filter((r) => r.attemptCount >= 1);
    const contactedCount = contactedRecoveries.length;
    const totalAttempts = recoveries.reduce((s, r) => s + r.attemptCount, 0);

    // Step 9 & 45: A recovered cart must map to a qualifying paid order within the attribution window (7 days from recovery creation)
    let verifiedRecoveredCount = 0;
    let recoveredNetRevenuePaise = 0;
    let recoveredGrossRevenuePaise = 0;
    const countedOrderIds = new Set<string>();

    for (const rec of recoveries) {
      if (rec.status !== 'RECOVERED') continue;
      const userOrders = rec.user?.orders || [];
      const windowEnd = new Date(rec.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Find qualifying paid order placed on or after rec.eligibleAt (or matched by recoveredOrderId)
      const qualifyingOrder = userOrders.find((o) => {
        if (!isQualifyingPaidOrder(o) || o.status === 'CANCELLED') return false;
        if (rec.recoveredOrderId && o.id === rec.recoveredOrderId) return true;
        return o.createdAt >= rec.eligibleAt && o.createdAt <= windowEnd;
      });

      if (qualifyingOrder && !countedOrderIds.has(qualifyingOrder.id)) {
        countedOrderIds.add(qualifyingOrder.id);
        verifiedRecoveredCount++;
        const grossP = toPaise(qualifyingOrder.totalAmount);
        const { refundedPaise } = getOrderRefundedPaise(qualifyingOrder);
        recoveredGrossRevenuePaise += grossP;
        recoveredNetRevenuePaise += Math.max(0, grossP - refundedPaise);
      }
    }

    const baseDenominator = contactedCount > 0 ? contactedCount : eligibleCount;
    const recoveryRatePercent = safePercent(verifiedRecoveredCount, baseDenominator);

    return {
      calculatedAt: new Date().toISOString(),
      freshnessStatus: 'LIVE',
      dateRange,
      recoveredCartDefinition:
        'A cart recovery record marked RECOVERED that maps to a verified qualifying paid order (paymentStatus = CAPTURED) within the 7-day attribution window. Excludes failed payments, unpaid cancellations, and expired recoveries.',
      metrics: {
        activeCartsCount: activeCarts.length,
        eligibleAbandonedCartsCount: eligibleCount,
        contactedCount,
        totalRecoveryAttempts: totalAttempts,
        deliveredCount: null,
        deliveryTrackingStatus: 'NOT AVAILABLE',
        openedCount: null,
        openTrackingStatus: 'NOT AVAILABLE',
        clickedCount: clickEvents > 0 ? clickEvents : null,
        clickTrackingStatus: clickEvents > 0 ? 'FIRST_PARTY_LINK_CLICKS' : 'NOT AVAILABLE',
        recoveredCartsCount: verifiedRecoveredCount,
        recoveryRatePercent,
        recoveredGrossRevenue: toRupees(recoveredGrossRevenuePaise),
        recoveredNetRevenue: toRupees(recoveredNetRevenuePaise),
      },
    };
  }

  /**
   * STEP 11, 12 & 44: Campaign Analytics & ROI.
   */
  public async getCampaignPerformanceAnalytics(rangeInput: AnalyticsDateRangeInput = {}) {
    const dateRange = resolveAnalyticsDateRange(rangeInput);

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        recipients: {
          select: { status: true },
        },
        orders: {
          include: { payments: true },
        },
      },
    });

    // Also fetch orders matched by utmCampaign for campaigns that have utmCampaign set
    const utmStrings = campaigns
      .map((c) => c.utmCampaign)
      .filter((u): u is string => Boolean(u));
    const utmOrders =
      utmStrings.length > 0
        ? await prisma.order.findMany({
            where: { utmCampaign: { in: utmStrings } },
            include: { payments: true },
          })
        : [];

    const globalCountedOrderIds = new Set<string>();

    const campaignRows = campaigns.map((c) => {
      const recipientCount = c.recipients.length || c.totalRecipients;
      const sent = c.recipients.filter((r) => r.status === 'SENT').length || c.sentCount;
      const failed = c.recipients.filter((r) => r.status === 'FAILED').length || c.failedCount;
      const skipped = c.recipients.filter((r) => r.status === 'SKIPPED').length || c.skippedCount;
      const unsubscribed = c.recipients.filter((r) => r.status === 'UNSUBSCRIBED').length;

      // Combine direct campaignId orders and utmCampaign orders without double-counting
      const candidateOrders = [
        ...c.orders,
        ...utmOrders.filter((uo) => c.utmCampaign && uo.utmCampaign === c.utmCampaign),
      ];

      let qualifyingOrdersCount = 0;
      let grossRevenuePaise = 0;
      let refundsPaise = 0;
      let couponUsageCount = 0;

      const seenInCampaign = new Set<string>();
      for (const order of candidateOrders) {
        if (seenInCampaign.has(order.id) || globalCountedOrderIds.has(order.id)) continue;
        seenInCampaign.add(order.id);

        if (!isQualifyingPaidOrder(order) || order.status === 'CANCELLED') {
          continue;
        }

        globalCountedOrderIds.add(order.id);
        qualifyingOrdersCount++;
        grossRevenuePaise += toPaise(order.totalAmount);
        const { refundedPaise } = getOrderRefundedPaise(order);
        refundsPaise += refundedPaise;

        const { couponMeta } = extractOrderCouponMeta(order.shippingAddress);
        if (couponMeta?.couponCode || (order.discountAmount && order.discountAmount > 0)) {
          couponUsageCount++;
        }
      }

      const netRevenuePaise = Math.max(0, grossRevenuePaise - refundsPaise);
      const netRevenue = toRupees(netRevenuePaise);
      const grossRevenue = toRupees(grossRevenuePaise);
      const refunds = toRupees(refundsPaise);

      const conversionRatePercent = sent > 0 ? safePercent(qualifyingOrdersCount, sent) : 0;
      const revenuePerRecipient = sent > 0 ? toRupees(Math.round(netRevenuePaise / sent)) : 0;

      return {
        campaignId: c.id,
        name: c.name,
        status: c.status,
        channel: c.channel,
        audience: c.audience,
        couponCode: c.couponCode,
        utmCampaign: c.utmCampaign,
        createdAt: c.createdAt,
        recipientCount,
        sent,
        failed,
        skipped,
        unsubscribed,
        orders: qualifyingOrdersCount,
        grossRevenue,
        refunds,
        revenue: netRevenue,
        netRevenue,
        couponUsageCount,
        conversionRatePercent,
        revenuePerRecipient,
        roi: null,
        roiStatus: 'COST DATA NOT CONFIGURED',
      };
    });

    const totals = campaignRows.reduce(
      (acc, r) => {
        acc.totalCampaigns++;
        acc.totalRecipients += r.recipientCount;
        acc.totalSent += r.sent;
        acc.totalOrders += r.orders;
        acc.totalNetRevenuePaise += toPaise(r.netRevenue);
        return acc;
      },
      { totalCampaigns: 0, totalRecipients: 0, totalSent: 0, totalOrders: 0, totalNetRevenuePaise: 0 }
    );

    return {
      calculatedAt: new Date().toISOString(),
      freshnessStatus: 'LIVE',
      dateRange,
      roiPolicy: 'COST DATA NOT CONFIGURED — Campaign ROI is never fabricated or assumed zero-cost.',
      summary: {
        totalCampaigns: totals.totalCampaigns,
        totalRecipients: totals.totalRecipients,
        totalSent: totals.totalSent,
        totalAttributedOrders: totals.totalOrders,
        totalAttributedNetRevenue: toRupees(totals.totalNetRevenuePaise),
        roiStatus: 'COST DATA NOT CONFIGURED',
      },
      campaigns: campaignRows,
    };
  }

  /**
   * STEP 13 & STEP 46: Segment Performance Analytics.
   * Reuses Phase 18 customerSegmentationService — zero duplicate segment definitions, zero PII exposed.
   */
  public async getSegmentPerformanceAnalytics(rangeInput?: AnalyticsDateRangeInput) {
    if (rangeInput && Object.keys(rangeInput).length > 0) {
      resolveAnalyticsDateRange(rangeInput);
    }
    const [segmentSummaries, allOrders, loyaltyRedemptions, referrals] = await Promise.all([
      customerSegmentationService.getSegmentSummaries(),
      prisma.order.findMany({
        include: { payments: true },
      }),
      prisma.loyaltyTransaction.findMany({
        where: { type: 'REDEEM_ORDER' },
        select: { userId: true, referenceId: true },
      }),
      prisma.referral.findMany({
        select: { referrerId: true, status: true },
      }),
    ]);

    const ordersByUser = new Map<string, typeof allOrders>();
    for (const o of allOrders) {
      const list = ordersByUser.get(o.userId) || [];
      list.push(o);
      ordersByUser.set(o.userId, list);
    }

    const loyaltyOrderIds = new Set(
      loyaltyRedemptions.map((l) => l.referenceId).filter((id): id is string => Boolean(id))
    );
    const loyaltyUsers = new Set(loyaltyRedemptions.map((l) => l.userId));

    const referralsByUser = new Map<string, number>();
    for (const r of referrals) {
      referralsByUser.set(r.referrerId, (referralsByUser.get(r.referrerId) || 0) + 1);
    }

    const segmentPerformance = [];
    for (const seg of segmentSummaries) {
      const userIds = await customerSegmentationService.getSegmentUserIds(seg.key);

      let totalOrders = 0;
      let qualifyingPaidOrders = 0;
      let grossRevenuePaise = 0;
      let refundsPaise = 0;
      let couponUsageOrders = 0;
      let loyaltyUsageOrders = 0;
      let customersWithPaidOrders = 0;
      let repeatBuyers = 0;
      let referralActivityCount = 0;
      let loyaltyActiveUsers = 0;

      for (const uid of userIds) {
        if (loyaltyUsers.has(uid)) loyaltyActiveUsers++;
        referralActivityCount += referralsByUser.get(uid) || 0;

        const uOrders = ordersByUser.get(uid) || [];
        totalOrders += uOrders.length;

        const paidOrders = uOrders.filter(
          (o) => isQualifyingPaidOrder(o) && o.status !== 'CANCELLED'
        );
        if (paidOrders.length > 0) customersWithPaidOrders++;
        if (paidOrders.length >= 2) repeatBuyers++;

        for (const po of paidOrders) {
          qualifyingPaidOrders++;
          grossRevenuePaise += toPaise(po.totalAmount);
          const { refundedPaise } = getOrderRefundedPaise(po);
          refundsPaise += refundedPaise;

          const { couponMeta: cMeta } = extractOrderCouponMeta(po.shippingAddress);
          if (cMeta?.couponCode || (po.discountAmount && po.discountAmount > 0)) {
            couponUsageOrders++;
          }
          if (loyaltyOrderIds.has(po.id)) {
            loyaltyUsageOrders++;
          }
        }
      }

      const netRevenuePaise = Math.max(0, grossRevenuePaise - refundsPaise);
      const aov =
        qualifyingPaidOrders > 0
          ? toRupees(Math.round(netRevenuePaise / qualifyingPaidOrders))
          : 0;
      const repeatPurchaseRatePercent = safePercent(repeatBuyers, customersWithPaidOrders);

      segmentPerformance.push({
        segmentKey: seg.key,
        name: seg.name,
        description: seg.description,
        customerCount: userIds.length,
        orders: totalOrders,
        qualifyingPaidOrders,
        grossRevenue: toRupees(grossRevenuePaise),
        refunds: toRupees(refundsPaise),
        netRevenue: toRupees(netRevenuePaise),
        aov,
        repeatPurchaseRatePercent,
        couponUsageOrders,
        loyaltyUsageOrders,
        loyaltyActiveUsers,
        referralActivityCount,
      });
    }

    return {
      calculatedAt: new Date().toISOString(),
      freshnessStatus: 'LIVE',
      privacyNote: 'Aggregate segment analytics only. Individual customer PII is strictly excluded.',
      segments: segmentPerformance,
    };
  }

  /**
   * STEP 14: Customer Cohort Analytics (Grouped by First Qualifying Purchase Month in IST).
   */
  public async getCohortAnalytics(rangeInput?: AnalyticsDateRangeInput, now: Date = new Date()) {
    if (rangeInput && Object.keys(rangeInput).length > 0) {
      resolveAnalyticsDateRange(rangeInput);
    }
    const orders = await prisma.order.findMany({
      include: { payments: true },
      orderBy: { createdAt: 'asc' },
    });

    const qualifyingOrders = orders.filter(
      (o) => isQualifyingPaidOrder(o) && o.status !== 'CANCELLED'
    );

    const firstPurchaseYmByUser = new Map<string, string>();
    const userActivityByYm = new Map<string, Map<string, { orders: number; netRevenuePaise: number }>>();

    for (const order of qualifyingOrders) {
      const ym = toIstYearMonth(order.createdAt);
      if (!firstPurchaseYmByUser.has(order.userId)) {
        firstPurchaseYmByUser.set(order.userId, ym);
      }

      if (!userActivityByYm.has(order.userId)) {
        userActivityByYm.set(order.userId, new Map());
      }
      const uMap = userActivityByYm.get(order.userId)!;
      const existing = uMap.get(ym) || { orders: 0, netRevenuePaise: 0 };
      const { refundedPaise } = getOrderRefundedPaise(order);
      existing.orders++;
      existing.netRevenuePaise += Math.max(0, toPaise(order.totalAmount) - refundedPaise);
      uMap.set(ym, existing);
    }

    const usersByCohort = new Map<string, string[]>();
    for (const [userId, cohortYm] of firstPurchaseYmByUser.entries()) {
      const list = usersByCohort.get(cohortYm) || [];
      list.push(userId);
      usersByCohort.set(cohortYm, list);
    }

    const currentIstYm = toIstYearMonth(now);
    const sortedCohortYms = Array.from(usersByCohort.keys()).sort();

    const cohorts = sortedCohortYms.map((cohortYm) => {
      const cohortUsers = usersByCohort.get(cohortYm) || [];
      const cohortSize = cohortUsers.length;

      // Month 0 base revenue
      let month0RevenuePaise = 0;
      for (const uid of cohortUsers) {
        month0RevenuePaise += userActivityByYm.get(uid)?.get(cohortYm)?.netRevenuePaise || 0;
      }

      const periods = [0, 1, 2, 3].map((monthOffset) => {
        const targetYm = addMonthsToYm(cohortYm, monthOffset);
        // Step 14: Do not fabricate future periods. If targetYm > currentIstYm, return NOT YET AVAILABLE
        if (targetYm > currentIstYm) {
          return {
            monthOffset,
            label: `Month ${monthOffset}`,
            calendarMonth: targetYm,
            status: 'NOT YET AVAILABLE' as const,
            retainedCustomers: null,
            repeatPurchaseRatePercent: null,
            revenue: null,
            revenueRetentionPercent: null,
          };
        }

        let retainedCustomers = 0;
        let periodRevenuePaise = 0;
        let periodOrders = 0;

        for (const uid of cohortUsers) {
          const act = userActivityByYm.get(uid)?.get(targetYm);
          if (act && act.orders > 0) {
            retainedCustomers++;
            periodRevenuePaise += act.netRevenuePaise;
            periodOrders += act.orders;
          }
        }

        return {
          monthOffset,
          label: `Month ${monthOffset}`,
          calendarMonth: targetYm,
          status: 'AVAILABLE' as const,
          retainedCustomers,
          ordersCount: periodOrders,
          repeatPurchaseRatePercent: safePercent(retainedCustomers, cohortSize),
          revenue: toRupees(periodRevenuePaise),
          revenueRetentionPercent:
            month0RevenuePaise > 0 ? safePercent(periodRevenuePaise, month0RevenuePaise) : 0,
        };
      });

      return {
        cohortMonth: cohortYm,
        cohortSize,
        initialRevenue: toRupees(month0RevenuePaise),
        periods,
      };
    });

    return {
      calculatedAt: new Date().toISOString(),
      freshnessStatus: 'LIVE',
      cohortDefinition:
        'Customers grouped by calendar month (IST) of their first qualifying paid order. Future unelapsed months are strictly marked NOT YET AVAILABLE.',
      cohorts,
    };
  }

  /**
   * STEP 15 & STEP 16: Repeat Purchase & Historical Customer Lifetime Value (LTV).
   */
  public async getRepeatAndLtvAnalytics(rangeInput?: AnalyticsDateRangeInput) {
    if (rangeInput && Object.keys(rangeInput).length > 0) {
      resolveAnalyticsDateRange(rangeInput);
    }
    const orders = await prisma.order.findMany({
      include: { payments: true },
      orderBy: { createdAt: 'asc' },
    });

    const qualifyingOrders = orders.filter(
      (o) => isQualifyingPaidOrder(o) && o.status !== 'CANCELLED'
    );

    const ordersByCustomer = new Map<
      string,
      Array<{ createdAt: Date; grossPaise: number; netPaise: number }>
    >();

    let totalGrossPaise = 0;
    let totalNetPaise = 0;

    for (const order of qualifyingOrders) {
      const grossP = toPaise(order.totalAmount);
      const { refundedPaise } = getOrderRefundedPaise(order);
      const netP = Math.max(0, grossP - refundedPaise);

      totalGrossPaise += grossP;
      totalNetPaise += netP;

      const list = ordersByCustomer.get(order.userId) || [];
      list.push({ createdAt: order.createdAt, grossPaise: grossP, netPaise: netP });
      ordersByCustomer.set(order.userId, list);
    }

    const totalBuyingCustomers = ordersByCustomer.size;
    let firstTimeCustomers = 0;
    let repeatCustomers = 0;
    const secondPurchaseIntervalsDays: number[] = [];

    for (const [, custOrders] of ordersByCustomer.entries()) {
      if (custOrders.length === 1) {
        firstTimeCustomers++;
      } else if (custOrders.length >= 2) {
        repeatCustomers++;
        const firstDate = custOrders[0].createdAt.getTime();
        const secondDate = custOrders[1].createdAt.getTime();
        const diffDays = Math.max(0, (secondDate - firstDate) / (24 * 60 * 60 * 1000));
        secondPurchaseIntervalsDays.push(diffDays);
      }
    }

    const repeatPurchaseRatePercent = safePercent(repeatCustomers, totalBuyingCustomers);
    const ordersPerCustomer =
      totalBuyingCustomers > 0
        ? Math.round((qualifyingOrders.length / totalBuyingCustomers) * 100) / 100
        : 0;

    const averageDaysToSecondPurchase =
      secondPurchaseIntervalsDays.length > 0
        ? Math.round(
            (secondPurchaseIntervalsDays.reduce((a, b) => a + b, 0) /
              secondPurchaseIntervalsDays.length) *
              10
          ) / 10
        : null;

    // Step 16: Historical LTV (Strictly labeled HISTORICAL LTV, never called predicted LTV)
    const historicalNetLtv =
      totalBuyingCustomers > 0 ? toRupees(Math.round(totalNetPaise / totalBuyingCustomers)) : 0;
    const historicalGrossLtv =
      totalBuyingCustomers > 0 ? toRupees(Math.round(totalGrossPaise / totalBuyingCustomers)) : 0;

    return {
      calculatedAt: new Date().toISOString(),
      freshnessStatus: 'LIVE',
      qualifyingOrderDefinition:
        'Order with paymentStatus = CAPTURED (or verified CAPTURED payment record) and status != CANCELLED.',
      repeatPurchase: {
        totalBuyingCustomers,
        firstTimeCustomers,
        repeatCustomers,
        repeatPurchaseRatePercent,
        ordersPerCustomer,
        averageDaysToSecondPurchase,
        timeToSecondPurchaseStatus:
          secondPurchaseIntervalsDays.length > 0 ? 'AVAILABLE' : 'INSUFFICIENT DATA',
      },
      customerLifetimeValue: {
        classification: 'HISTORICAL_LTV',
        methodologyLabel:
          'Historical Average Cumulative Net Revenue per Buying Customer (Observed PostgreSQL Ledger — Not a Predictive Forecast)',
        historicalNetLtv,
        historicalGrossLtv,
        predictedLtv: null,
        predictedLtvStatus: 'NOT_CONFIGURED_HISTORICAL_ONLY',
      },
    };
  }

  /**
   * STEP 18: Coupon Performance Analytics (Observational comparison without false causal claims).
   */
  public async getCouponPerformanceAnalytics(rangeInput: AnalyticsDateRangeInput = {}) {
    const dateRange = resolveAnalyticsDateRange(rangeInput);
    const { startUtc, endUtc } = dateRange;

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startUtc, lte: endUtc } },
      include: { payments: true },
    });

    const qualifyingOrders = orders.filter(
      (o) => isQualifyingPaidOrder(o) && o.status !== 'CANCELLED'
    );

    const couponOrders: typeof qualifyingOrders = [];
    const nonCouponOrders: typeof qualifyingOrders = [];
    const byCode = new Map<
      string,
      { orders: number; grossPaise: number; discountPaise: number; netPaise: number }
    >();

    for (const o of qualifyingOrders) {
      const { couponMeta: meta } = extractOrderCouponMeta(o.shippingAddress);
      const discountP = toPaise(o.discountAmount || 0);
      const hasCoupon = Boolean(meta?.couponCode) || discountP > 0;

      if (hasCoupon) {
        couponOrders.push(o);
        const code = meta?.couponCode || 'APPLIED_DISCOUNT';
        const entry = byCode.get(code) || { orders: 0, grossPaise: 0, discountPaise: 0, netPaise: 0 };
        const grossP = toPaise(o.totalAmount);
        const { refundedPaise } = getOrderRefundedPaise(o);
        entry.orders++;
        entry.grossPaise += grossP;
        entry.discountPaise += discountP;
        entry.netPaise += Math.max(0, grossP - refundedPaise);
        byCode.set(code, entry);
      } else {
        nonCouponOrders.push(o);
      }
    }

    const summarizeGroup = (group: typeof qualifyingOrders) => {
      let grossP = 0;
      let discountP = 0;
      let netP = 0;
      const orderCountByUser = new Map<string, number>();

      for (const o of group) {
        const gp = toPaise(o.totalAmount);
        const dp = toPaise(o.discountAmount || 0);
        const { refundedPaise } = getOrderRefundedPaise(o);
        grossP += gp;
        discountP += dp;
        netP += Math.max(0, gp - refundedPaise);
        orderCountByUser.set(o.userId, (orderCountByUser.get(o.userId) || 0) + 1);
      }

      const uniqueCustomers = orderCountByUser.size;
      const repeatCustomers = Array.from(orderCountByUser.values()).filter((c) => c >= 2).length;

      return {
        ordersCount: group.length,
        uniqueCustomers,
        grossRevenue: toRupees(grossP),
        discountAmount: toRupees(discountP),
        netRevenue: toRupees(netP),
        aov: group.length > 0 ? toRupees(Math.round(netP / group.length)) : 0,
        repeatPurchaseRatePercent: safePercent(repeatCustomers, uniqueCustomers),
      };
    };

    const couponBreakdown = Array.from(byCode.entries()).map(([code, stats]) => ({
      couponCode: code,
      ordersCount: stats.orders,
      grossRevenue: toRupees(stats.grossPaise),
      discountAmount: toRupees(stats.discountPaise),
      netRevenue: toRupees(stats.netPaise),
      aov: stats.orders > 0 ? toRupees(Math.round(stats.netPaise / stats.orders)) : 0,
    }));

    return {
      calculatedAt: new Date().toISOString(),
      freshnessStatus: 'LIVE',
      dateRange,
      causalityDisclaimer:
        'OBSERVATIONAL CORRELATION ONLY: Comparisons between coupon and non-coupon orders do not prove causal incremental lift without a controlled randomized experiment.',
      couponUsersSummary: summarizeGroup(couponOrders),
      nonCouponUsersSummary: summarizeGroup(nonCouponOrders),
      coupons: couponBreakdown,
    };
  }

  /**
   * STEP 19, 20, 21 & 22: Retention Mechanisms Performance (Loyalty, Referral, Wishlist, Reviews).
   */
  public async getRetentionMechanismsAnalytics() {
    const [
      loyaltyAccounts,
      loyaltyTxs,
      referrals,
      usersWithReferralCode,
      wishlistItems,
      wishlistEvents,
      reviews,
      allOrders,
    ] = await Promise.all([
      prisma.loyaltyAccount.findMany(),
      prisma.loyaltyTransaction.findMany(),
      prisma.referral.findMany(),
      prisma.user.count({ where: { referralCode: { not: null } } }),
      prisma.wishlistItem.findMany(),
      prisma.behavioralEvent.findMany({
        where: {
          eventName: {
            in: ['add_to_wishlist', 'remove_from_wishlist', 'wishlist_to_cart'],
          },
        },
      }),
      prisma.review.findMany(),
      prisma.order.findMany({ include: { items: true, payments: true } }),
    ]);

    const qualifyingOrders = allOrders.filter(
      (o) => isQualifyingPaidOrder(o) && o.status !== 'CANCELLED'
    );
    const qualifyingOrderById = new Map(qualifyingOrders.map((o) => [o.id, o]));

    // 1. Loyalty Performance (Step 19)
    let pointsEarned = 0;
    let pointsRedeemed = 0;
    let pointsReversed = 0;
    const customersRedeeming = new Set<string>();
    const loyaltyOrderIds = new Set<string>();

    for (const tx of loyaltyTxs) {
      if (tx.type === 'EARN_ORDER' || tx.type === 'BONUS') {
        pointsEarned += Math.abs(tx.points);
      } else if (tx.type === 'REDEEM_ORDER') {
        pointsRedeemed += Math.abs(tx.points);
        customersRedeeming.add(tx.userId);
        if (tx.referenceId) loyaltyOrderIds.add(tx.referenceId);
      } else if (tx.type === 'REFUND_REVERSAL') {
        pointsReversed += Math.abs(tx.points);
      }
    }

    let loyaltyAssociatedNetRevenuePaise = 0;
    let verifiedLoyaltyOrdersCount = 0;
    for (const oid of loyaltyOrderIds) {
      const ord = qualifyingOrderById.get(oid);
      if (ord) {
        verifiedLoyaltyOrdersCount++;
        const { refundedPaise } = getOrderRefundedPaise(ord);
        loyaltyAssociatedNetRevenuePaise += Math.max(0, toPaise(ord.totalAmount) - refundedPaise);
      }
    }

    // 2. Referral Performance (Step 20 — Deduplicated)
    const qualifiedReferrals = referrals.filter((r) =>
      ['QUALIFIED', 'REWARDED', 'COMPLETED'].includes(r.status.toUpperCase())
    );
    const referredUserIds = new Set(qualifiedReferrals.map((r) => r.referredUserId));
    let referralOrdersCount = 0;
    let referralNetRevenuePaise = 0;
    const seenReferralOrderIds = new Set<string>();

    for (const ord of qualifyingOrders) {
      if (referredUserIds.has(ord.userId) && !seenReferralOrderIds.has(ord.id)) {
        seenReferralOrderIds.add(ord.id);
        referralOrdersCount++;
        const { refundedPaise } = getOrderRefundedPaise(ord);
        referralNetRevenuePaise += Math.max(0, toPaise(ord.totalAmount) - refundedPaise);
      }
    }

    const totalReferralRewardsPoints = referrals.reduce((s, r) => s + (r.rewardPoints || 0), 0);

    // 3. Wishlist Analytics (Step 21)
    const wishlistAddsEvents = wishlistEvents.filter((e) => e.eventName === 'add_to_wishlist').length;
    const wishlistRemovalsEvents = wishlistEvents.filter((e) => e.eventName === 'remove_from_wishlist').length;
    const wishlistToCartEvents = wishlistEvents.filter((e) => e.eventName === 'wishlist_to_cart');

    // Only count wishlist-to-purchase where user had wishlist_to_cart event for productId and a subsequent qualifying paid order
    let wishlistToPurchaseCount = 0;
    const countedWishlistOrders = new Set<string>();
    for (const wEv of wishlistToCartEvents) {
      if (!wEv.userId || !wEv.productId) continue;
      const matchingOrder = qualifyingOrders.find(
        (o) =>
          o.userId === wEv.userId &&
          o.createdAt >= wEv.createdAt &&
          o.items.some((i) => i.productId === wEv.productId)
      );
      if (matchingOrder && !countedWishlistOrders.has(`${matchingOrder.id}:${wEv.productId}`)) {
        countedWishlistOrders.add(`${matchingOrder.id}:${wEv.productId}`);
        wishlistToPurchaseCount++;
      }
    }

    // 4. Review Analytics (Step 22)
    const approvedReviews = reviews.filter((r) => r.status === 'APPROVED' || r.isApproved).length;
    const rejectedReviews = reviews.filter((r) => r.status === 'REJECTED').length;
    const pendingReviews = reviews.filter((r) => r.status === 'PENDING' && !r.isApproved).length;
    const verifiedPurchaseReviews = reviews.filter((r) => Boolean(r.orderId)).length;

    const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;
    for (const r of reviews) {
      const rt = Math.min(5, Math.max(1, r.rating));
      ratingDist[rt] = (ratingDist[rt] || 0) + 1;
      ratingSum += rt;
    }
    const averageRating = reviews.length > 0 ? Math.round((ratingSum / reviews.length) * 100) / 100 : null;

    // Observational repeat purchase comparison between reviewers and non-reviewers
    const reviewerUserIds = new Set(reviews.map((r) => r.userId));
    const ordersCountByUser = new Map<string, number>();
    for (const o of qualifyingOrders) {
      ordersCountByUser.set(o.userId, (ordersCountByUser.get(o.userId) || 0) + 1);
    }

    let reviewerBuyers = 0;
    let reviewerRepeatBuyers = 0;
    let nonReviewerBuyers = 0;
    let nonReviewerRepeatBuyers = 0;

    for (const [uid, count] of ordersCountByUser.entries()) {
      if (reviewerUserIds.has(uid)) {
        reviewerBuyers++;
        if (count >= 2) reviewerRepeatBuyers++;
      } else {
        nonReviewerBuyers++;
        if (count >= 2) nonReviewerRepeatBuyers++;
      }
    }

    return {
      calculatedAt: new Date().toISOString(),
      freshnessStatus: 'LIVE',
      loyalty: {
        activeAccountsCount: loyaltyAccounts.length,
        pointsEarned,
        pointsRedeemed,
        pointsReversed,
        customersUsingLoyaltyCount: customersRedeeming.size,
        ordersUsingLoyaltyCount: verifiedLoyaltyOrdersCount,
        revenueAssociatedWithLoyalty: toRupees(loyaltyAssociatedNetRevenuePaise),
      },
      referrals: {
        referralCodesCreatedCount: usersWithReferralCode,
        totalReferralsCount: referrals.length,
        successfulReferralsCount: qualifiedReferrals.length,
        qualifyingReferredCustomersCount: referredUserIds.size,
        referralOrdersCount,
        referralNetRevenue: toRupees(referralNetRevenuePaise),
        referralRewardPointsIssued: totalReferralRewardsPoints,
      },
      wishlist: {
        currentWishlistedItemsCount: wishlistItems.length,
        wishlistAddsCount: Math.max(wishlistItems.length, wishlistAddsEvents),
        wishlistRemovalsCount: wishlistRemovalsEvents,
        wishlistToCartCount: wishlistToCartEvents.length,
        wishlistToPurchaseCount,
      },
      reviews: {
        totalSubmissions: reviews.length,
        approvedReviews,
        rejectedReviews,
        pendingReviews,
        verifiedPurchaseReviews,
        averageRating,
        ratingDistribution: ratingDist,
        observationalRepeatComparison: {
          classification: 'OBSERVATIONAL_CORRELATION_ONLY',
          disclaimer:
            'Observational correlation only. Does not establish that submitting a review causes repeat purchases.',
          reviewerRepeatPurchaseRatePercent: safePercent(reviewerRepeatBuyers, reviewerBuyers),
          nonReviewerRepeatPurchaseRatePercent: safePercent(nonReviewerRepeatBuyers, nonReviewerBuyers),
        },
      },
    };
  }

  /**
   * STEP 36, 39 & 40: Unified Admin Growth Dashboard with short-lived safe caching & freshness metadata.
   */
  public async getUnifiedGrowthDashboard(
    rangeInput: AnalyticsDateRangeInput = {},
    bypassCache = false
  ) {
    const resolvedRange = resolveAnalyticsDateRange(rangeInput);
    const cacheKey = `growth_dash:${resolvedRange.startDate}:${resolvedRange.endDate}:${resolvedRange.granularity}`;

    if (!bypassCache) {
      const cached = this.dashboardCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return {
          ...cached.data,
          calculatedAt: cached.calculatedAt,
          freshnessStatus: 'CACHED',
          cacheTtlSeconds: Math.round((cached.expiresAt - Date.now()) / 1000),
        };
      }
    }

    const [
      revenueAndAov,
      funnel,
      products,
      cartRecovery,
      campaigns,
      segments,
      cohorts,
      repeatAndLtv,
      coupons,
      retentionMechanisms,
      experiments,
    ] = await Promise.all([
      this.getRevenueAndAovAnalytics(rangeInput),
      this.getFunnelAnalytics(rangeInput),
      this.getProductConversionAnalytics(rangeInput),
      this.getCartRecoveryAnalytics(rangeInput),
      this.getCampaignPerformanceAnalytics(rangeInput),
      this.getSegmentPerformanceAnalytics(),
      this.getCohortAnalytics(),
      this.getRepeatAndLtvAnalytics(),
      this.getCouponPerformanceAnalytics(rangeInput),
      this.getRetentionMechanismsAnalytics(),
      experimentService.listExperiments(),
    ]);

    const calculatedAt = new Date().toISOString();

    const payload = {
      calculatedAt,
      freshnessStatus: 'LIVE',
      cacheTtlSeconds: 15,
      dateRange: resolvedRange,
      executiveKpis: {
        grossRevenue: revenueAndAov.metrics.grossSales,
        refunds: revenueAndAov.metrics.refunds,
        netRevenue: revenueAndAov.metrics.netRevenue,
        qualifyingOrders: revenueAndAov.metrics.qualifyingPaidOrdersCount,
        grossAov: revenueAndAov.metrics.grossAov,
        netAov: revenueAndAov.metrics.netAov,
        buyingCustomers: repeatAndLtv.repeatPurchase.totalBuyingCustomers,
        repeatPurchaseRatePercent: repeatAndLtv.repeatPurchase.repeatPurchaseRatePercent,
        historicalNetLtv: repeatAndLtv.customerLifetimeValue.historicalNetLtv,
      },
      funnel,
      revenueAndAov,
      products,
      cartRecovery,
      campaigns,
      segments,
      cohorts,
      repeatAndLtv,
      coupons,
      retentionMechanisms,
      experimentsSummary: {
        totalCount: experiments.length,
        runningCount: experiments.filter((e) => e.status === 'RUNNING').length,
        completedCount: experiments.filter((e) => e.status === 'COMPLETED').length,
        insufficientSampleCount: experiments.filter((e) => e.sampleStatus === 'INSUFFICIENT_SAMPLE').length,
        experiments,
      },
    };

    this.dashboardCache.set(cacheKey, {
      data: payload,
      calculatedAt,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return payload;
  }
}

export const growthAnalyticsService = new GrowthAnalyticsService();
