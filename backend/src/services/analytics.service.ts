// backend/src/services/analytics.service.ts
import prisma from '../lib/prisma.js';
import { extractOrderCouponMeta } from './coupon.service.js';
import type { OrderStatus, PaymentStatus, ShippingStatus } from '@prisma/client';

export type AnalyticsRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'previous_month'
  | 'this_year'
  | 'custom';

export type AnalyticsGranularity = 'auto' | 'daily' | 'weekly' | 'monthly';

export interface AnalyticsDateRangeInput {
  range?: string;
  startDate?: string;
  endDate?: string;
  granularity?: string;
}

export interface ResolvedAnalyticsDateRange {
  range: AnalyticsRangePreset;
  timezone: 'Asia/Kolkata';
  utcOffset: '+05:30';
  startDate: string; // YYYY-MM-DD in IST
  endDate: string; // YYYY-MM-DD in IST
  startUtc: Date;
  endUtc: Date;
  dayCount: number;
  granularity: 'daily' | 'weekly' | 'monthly';
}

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // +05:30 in milliseconds
const MAX_DATE_RANGE_DAYS = 731; // Max 2 years to prevent unbounded scan abuse

function createValidationError(message: string, code = 'VALIDATION_ERROR'): Error {
  const err: any = new Error(message);
  err.statusCode = 422;
  err.code = code;
  return err;
}

/**
 * Convert a UTC Date instant into an IST (Asia/Kolkata, UTC+05:30) calendar representation.
 */
function toIstCalendarParts(utcDate: Date): { year: number; month: number; day: number; ymd: string } {
  const istShifted = new Date(utcDate.getTime() + IST_OFFSET_MS);
  const year = istShifted.getUTCFullYear();
  const month = istShifted.getUTCMonth() + 1;
  const day = istShifted.getUTCDate();
  const ymd = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { year, month, day, ymd };
}

/**
 * Validate and parse a YYYY-MM-DD or ISO date string into an IST YYYY-MM-DD string.
 * Rejects impossible calendar dates like 2026-02-30 or malformed strings.
 */
export function parseStrictCalendarDateToIstYmd(rawInput: string, fieldName: string): string {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    throw createValidationError(`${fieldName} cannot be empty.`);
  }

  // Case 1: Strict YYYY-MM-DD format
  const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);

    if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
      throw createValidationError(`Invalid ${fieldName}: "${rawInput}".`);
    }

    const probe = new Date(Date.UTC(year, month - 1, day));
    if (
      probe.getUTCFullYear() !== year ||
      probe.getUTCMonth() + 1 !== month ||
      probe.getUTCDate() !== day
    ) {
      throw createValidationError(`Invalid calendar date for ${fieldName}: "${rawInput}".`);
    }

    return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
  }

  // Case 2: Full ISO-8601 datetime string
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$/;
  if (!isoRegex.test(trimmed)) {
    throw createValidationError(
      `Invalid ${fieldName} format: "${rawInput}". Expected YYYY-MM-DD or ISO-8601 timestamp.`
    );
  }

  const datePart = trimmed.slice(0, 10);
  // Ensure the calendar date portion itself is valid (e.g. not 2026-02-30T00:00:00Z)
  parseStrictCalendarDateToIstYmd(datePart, fieldName);

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw createValidationError(`Invalid ${fieldName}: "${rawInput}".`);
  }

  return toIstCalendarParts(parsed).ymd;
}

function addDaysToYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function istStartOfDayUtc(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000+05:30`);
}

function istEndOfDayUtc(ymd: string): Date {
  return new Date(`${ymd}T23:59:59.999+05:30`);
}

/**
 * Resolve and validate server-authoritative date range in Asia/Kolkata (UTC+05:30).
 */
export function resolveAnalyticsDateRange(
  input: AnalyticsDateRangeInput = {},
  now: Date = new Date()
): ResolvedAnalyticsDateRange {
  const rawRange = (input.range || '').trim().toLowerCase();
  const hasCustomDates = Boolean(input.startDate || input.endDate);

  let preset: AnalyticsRangePreset = 'last_30_days';
  if (rawRange) {
    const aliasMap: Record<string, AnalyticsRangePreset> = {
      today: 'today',
      yesterday: 'yesterday',
      last_7_days: 'last_7_days',
      '7d': 'last_7_days',
      last_30_days: 'last_30_days',
      '30d': 'last_30_days',
      last_90_days: 'last_90_days',
      '90d': 'last_90_days',
      this_month: 'this_month',
      previous_month: 'previous_month',
      this_year: 'this_year',
      custom: 'custom',
    };
    const mapped = aliasMap[rawRange];
    if (!mapped) {
      throw createValidationError(
        `Invalid range preset "${input.range}". Allowed: today, yesterday, last_7_days, last_30_days, last_90_days, this_month, previous_month, this_year, custom.`
      );
    }
    preset = mapped;
  } else if (hasCustomDates) {
    preset = 'custom';
  }

  const todayIst = toIstCalendarParts(now);
  let startYmd = todayIst.ymd;
  let endYmd = todayIst.ymd;

  if (preset === 'custom' || hasCustomDates) {
    if (!input.startDate || !input.endDate) {
      throw createValidationError(
        'Both startDate and endDate are required when using a custom date range.'
      );
    }
    startYmd = parseStrictCalendarDateToIstYmd(input.startDate, 'startDate');
    endYmd = parseStrictCalendarDateToIstYmd(input.endDate, 'endDate');
    preset = 'custom';
  } else if (preset === 'today') {
    startYmd = todayIst.ymd;
    endYmd = todayIst.ymd;
  } else if (preset === 'yesterday') {
    const yest = addDaysToYmd(todayIst.ymd, -1);
    startYmd = yest;
    endYmd = yest;
  } else if (preset === 'last_7_days') {
    startYmd = addDaysToYmd(todayIst.ymd, -6);
    endYmd = todayIst.ymd;
  } else if (preset === 'last_30_days') {
    startYmd = addDaysToYmd(todayIst.ymd, -29);
    endYmd = todayIst.ymd;
  } else if (preset === 'last_90_days') {
    startYmd = addDaysToYmd(todayIst.ymd, -89);
    endYmd = todayIst.ymd;
  } else if (preset === 'this_month') {
    startYmd = `${String(todayIst.year).padStart(4, '0')}-${String(todayIst.month).padStart(2, '0')}-01`;
    endYmd = todayIst.ymd;
  } else if (preset === 'previous_month') {
    const prevMonthYear = todayIst.month === 1 ? todayIst.year - 1 : todayIst.year;
    const prevMonth = todayIst.month === 1 ? 12 : todayIst.month - 1;
    const lastDayOfPrevMonth = new Date(Date.UTC(prevMonthYear, prevMonth, 0)).getUTCDate();
    startYmd = `${String(prevMonthYear).padStart(4, '0')}-${String(prevMonth).padStart(2, '0')}-01`;
    endYmd = `${String(prevMonthYear).padStart(4, '0')}-${String(prevMonth).padStart(2, '0')}-${String(lastDayOfPrevMonth).padStart(2, '0')}`;
  } else if (preset === 'this_year') {
    startYmd = `${String(todayIst.year).padStart(4, '0')}-01-01`;
    endYmd = todayIst.ymd;
  }

  const startUtc = istStartOfDayUtc(startYmd);
  const endUtc = istEndOfDayUtc(endYmd);

  if (startUtc.getTime() > endUtc.getTime()) {
    throw createValidationError('startDate must be on or before endDate.');
  }

  const dayCount = Math.round((endUtc.getTime() - startUtc.getTime()) / (24 * 60 * 60 * 1000));
  if (dayCount > MAX_DATE_RANGE_DAYS) {
    throw createValidationError(
      `Selected date range (${dayCount} days) exceeds the maximum allowed range of ${MAX_DATE_RANGE_DAYS} days.`
    );
  }

  const rawGranularity = (input.granularity || 'auto').trim().toLowerCase();
  if (!['auto', 'daily', 'weekly', 'monthly'].includes(rawGranularity)) {
    throw createValidationError(
      `Invalid granularity "${input.granularity}". Allowed: auto, daily, weekly, monthly.`
    );
  }

  let granularity: 'daily' | 'weekly' | 'monthly' = 'daily';
  if (rawGranularity === 'auto') {
    if (dayCount <= 35) {
      granularity = 'daily';
    } else if (dayCount <= 180) {
      granularity = 'weekly';
    } else {
      granularity = 'monthly';
    }
  } else {
    granularity = rawGranularity as 'daily' | 'weekly' | 'monthly';
  }

  return {
    range: preset,
    timezone: 'Asia/Kolkata',
    utcOffset: '+05:30',
    startDate: startYmd,
    endDate: endYmd,
    startUtc,
    endUtc,
    dayCount,
    granularity,
  };
}

/**
 * Convert Rupees float to integer paise safely.
 */
export function toPaise(rupees: number | null | undefined): number {
  const num = Number(rupees || 0);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Convert integer paise to Rupees rounded to 2 decimal places.
 */
export function toRupees(paise: number): number {
  if (!Number.isFinite(paise)) return 0;
  return Math.round(paise) / 100;
}

/**
 * Safe percentage calculation (returns 0 when denominator <= 0, never NaN or Infinity).
 */
export function safePercent(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return Math.round((numerator / denominator) * 10000) / 100;
}

interface OrderPaymentLite {
  id: string;
  amount: number;
  status: PaymentStatus;
  providerPaymentId: string | null;
  signatureVerified: boolean;
  rawResponse?: any;
  createdAt: Date;
}

interface OrderAnalyticsRow {
  id: string;
  orderNumber: string;
  userId: string;
  subtotal: number;
  discountAmount: number | null;
  shippingAmount: number | null;
  taxAmount: number | null;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  shippingAddress: any;
  createdAt: Date;
  payments: OrderPaymentLite[];
}

/**
 * Authoritative Business Rule:
 * An order is a Qualifying Paid Order if and only if its payment was captured:
 * - order.paymentStatus === 'CAPTURED' or 'REFUNDED'
 * - OR it has a verified CAPTURED payment record.
 * Unpaid pending orders, failed payment orders, and cancelled unpaid orders are strictly excluded.
 */
export function isQualifyingPaidOrder(order: {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  payments?: Array<{ status: PaymentStatus; signatureVerified?: boolean }>;
}): boolean {
  if (order.paymentStatus === 'CAPTURED' || order.paymentStatus === 'REFUNDED') {
    return true;
  }
  if (
    order.payments &&
    order.payments.some((p) => p.status === 'CAPTURED' && p.signatureVerified !== false)
  ) {
    return true;
  }
  return false;
}

/**
 * Authoritative Refund Calculation for an Order (in integer paise):
 * Sums Payment records with status === 'REFUNDED' (or falls back to order.totalAmount if order.paymentStatus === 'REFUNDED'
 * and no separate child REFUNDED payment rows exist), capped at the order's totalAmount.
 */
export function getOrderRefundedPaise<
  T extends {
    id: string;
    amount: number;
    status: PaymentStatus;
    providerPaymentId: string | null;
    rawResponse?: any;
    createdAt?: Date;
  },
>(order: {
  totalAmount: number;
  paymentStatus: PaymentStatus;
  payments: T[];
}): { refundedPaise: number; refundCount: number; refundRecords: T[] } {
  const orderTotalPaise = toPaise(order.totalAmount);
  if (orderTotalPaise <= 0) {
    return { refundedPaise: 0, refundCount: 0, refundRecords: [] };
  }

  const capturedPayment = order.payments.find(
    (p) => p.status === 'CAPTURED' && p.providerPaymentId && !p.providerPaymentId.startsWith('rfnd_')
  );

  const refundRecords = order.payments.filter(
    (p) =>
      p.status === 'REFUNDED' &&
      (!p.providerPaymentId ||
        p.providerPaymentId.startsWith('rfnd_') ||
        (capturedPayment && p.id !== capturedPayment.id) ||
        !capturedPayment)
  );

  if (refundRecords.length > 0) {
    const sumPaise = refundRecords.reduce((acc, r) => acc + toPaise(r.amount), 0);
    return {
      refundedPaise: Math.min(orderTotalPaise, Math.max(0, sumPaise)),
      refundCount: refundRecords.length,
      refundRecords,
    };
  }

  if (order.paymentStatus === 'REFUNDED') {
    return {
      refundedPaise: orderTotalPaise,
      refundCount: 1,
      refundRecords: [],
    };
  }

  return { refundedPaise: 0, refundCount: 0, refundRecords: [] };
}

/**
 * Group an IST YYYY-MM-DD string into a bucket key ('YYYY-MM-DD', 'YYYY-MM-DD' week start Monday, or 'YYYY-MM').
 */
function getBucketKeyForIstYmd(ymd: string, granularity: 'daily' | 'weekly' | 'monthly'): string {
  if (granularity === 'daily') {
    return ymd;
  }
  if (granularity === 'monthly') {
    return ymd.slice(0, 7); // YYYY-MM
  }
  // weekly: ISO week starting Monday
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = dt.getUTCDay(); // 0 (Sun) .. 6 (Sat)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return addDaysToYmd(ymd, diffToMonday);
}

function buildAllBucketKeys(
  startYmd: string,
  endYmd: string,
  granularity: 'daily' | 'weekly' | 'monthly'
): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  let cursor = startYmd;
  let guard = 0;
  while (cursor <= endYmd && guard <= MAX_DATE_RANGE_DAYS + 5) {
    const key = getBucketKeyForIstYmd(cursor, granularity);
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
    cursor = addDaysToYmd(cursor, 1);
    guard += 1;
  }
  return keys;
}

export class AnalyticsService {
  /**
   * Load orders inside the resolved date range with their payment records.
   * Strictly READ-ONLY.
   */
  private async fetchOrdersInPeriod(range: ResolvedAnalyticsDateRange): Promise<OrderAnalyticsRow[]> {
    return prisma.order.findMany({
      where: {
        createdAt: {
          gte: range.startUtc,
          lte: range.endUtc,
        },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        subtotal: true,
        discountAmount: true,
        shippingAmount: true,
        taxAmount: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        shippingStatus: true,
        shippingAddress: true,
        createdAt: true,
        payments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            amount: true,
            status: true,
            providerPaymentId: true,
            signatureVerified: true,
            rawResponse: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * 1. GET /api/admin/analytics/summary
   * Main KPI summary, customer retention snapshot, inventory health, cart overview, and operational alerts.
   */
  async getSummary(query: AnalyticsDateRangeInput = {}) {
    const dateRange = resolveAnalyticsDateRange(query);

    const [
      ordersInPeriod,
      allQualifyingOrdersByUser,
      totalCustomersAllTime,
      newRegisteredCustomersInPeriod,
      products,
      cartsWithItems,
      totalCartsCount,
    ] = await Promise.all([
      this.fetchOrdersInPeriod(dateRange),
      // Fetch userId + minimum/count of qualifying paid orders across all time to compute accurate New vs Returning buyers
      prisma.order.groupBy({
        by: ['userId'],
        where: {
          paymentStatus: { in: ['CAPTURED', 'REFUNDED'] },
        },
        _min: { createdAt: true },
        _count: { id: true },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: dateRange.startUtc, lte: dateRange.endUtc },
        },
      }),
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
          category: true,
          price: true,
          stock: true,
          isActive: true,
        },
      }),
      prisma.cart.findMany({
        where: { items: { some: {} } },
        select: {
          id: true,
          items: {
            select: {
              quantity: true,
              price: true,
            },
          },
        },
      }),
      prisma.cart.count(),
    ]);

    // Calculate revenue & order KPIs
    let grossSalesPaise = 0;
    let refundedAmountPaise = 0;
    let totalDiscountPaise = 0;
    let qualifyingOrdersCount = 0;
    let refundedOrdersCount = 0;
    let couponOrdersCount = 0;

    const statusCounts: Record<OrderStatus, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    const periodQualifyingOrdersCountByUser = new Map<string, number>();

    for (const order of ordersInPeriod) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;

      if (isQualifyingPaidOrder(order)) {
        qualifyingOrdersCount += 1;
        const orderTotalPaise = toPaise(order.totalAmount);
        grossSalesPaise += orderTotalPaise;

        const { refundedPaise } = getOrderRefundedPaise(order);
        if (refundedPaise > 0) {
          refundedAmountPaise += refundedPaise;
          refundedOrdersCount += 1;
        }

        const discountPaise = toPaise(order.discountAmount);
        if (discountPaise > 0) {
          totalDiscountPaise += discountPaise;
          couponOrdersCount += 1;
        }

        periodQualifyingOrdersCountByUser.set(
          order.userId,
          (periodQualifyingOrdersCountByUser.get(order.userId) || 0) + 1
        );
      }
    }

    const netRevenuePaise = Math.max(0, grossSalesPaise - refundedAmountPaise);
    const averageOrderValuePaise =
      qualifyingOrdersCount > 0 ? Math.round(grossSalesPaise / qualifyingOrdersCount) : 0;

    const refundRatePercent = safePercent(refundedOrdersCount, qualifyingOrdersCount);
    const refundVolumeRatePercent = safePercent(refundedAmountPaise, grossSalesPaise);

    // Units sold in period across qualifying paid orders
    const qualifyingOrderIds = ordersInPeriod
      .filter((o) => isQualifyingPaidOrder(o))
      .map((o) => o.id);

    let unitsSold = 0;
    if (qualifyingOrderIds.length > 0) {
      const itemsAgg = await prisma.orderItem.aggregate({
        where: { orderId: { in: qualifyingOrderIds } },
        _sum: { quantity: true },
      });
      unitsSold = itemsAgg._sum.quantity || 0;
    }

    // Customer cohort classification in period
    const firstOrderMap = new Map<string, { firstOrderAt: Date; lifetimeOrders: number }>();
    for (const row of allQualifyingOrdersByUser) {
      if (row._min.createdAt) {
        firstOrderMap.set(row.userId, {
          firstOrderAt: row._min.createdAt,
          lifetimeOrders: row._count.id,
        });
      }
    }

    let newBuyingCustomersInPeriod = 0;
    let returningCustomersInPeriod = 0;
    for (const [userId, periodOrderCount] of periodQualifyingOrdersCountByUser.entries()) {
      const hist = firstOrderMap.get(userId);
      const firstAt = hist?.firstOrderAt;
      const hadPriorOrderBeforePeriod =
        firstAt !== undefined && firstAt.getTime() < dateRange.startUtc.getTime();

      if (!hadPriorOrderBeforePeriod && firstAt && firstAt.getTime() >= dateRange.startUtc.getTime()) {
        newBuyingCustomersInPeriod += 1;
      }
      if (hadPriorOrderBeforePeriod || periodOrderCount > 1) {
        returningCustomersInPeriod += 1;
      }
    }

    const activeBuyingCustomersInPeriod = periodQualifyingOrdersCountByUser.size;
    const repeatPurchaseRatePercent = safePercent(
      returningCustomersInPeriod,
      activeBuyingCustomersInPeriod
    );

    // Inventory snapshot
    let activeProducts = 0;
    let inactiveProducts = 0;
    let outOfStockProducts = 0;
    let lowStockProducts = 0;
    let totalStockUnits = 0;
    let estimatedStockValuePaise = 0;

    for (const p of products) {
      if (p.isActive) {
        activeProducts += 1;
        totalStockUnits += Math.max(0, p.stock);
        estimatedStockValuePaise += Math.max(0, p.stock) * toPaise(p.price);
        if (p.stock <= 0) {
          outOfStockProducts += 1;
        } else if (p.stock <= 10) {
          lowStockProducts += 1;
        }
      } else {
        inactiveProducts += 1;
      }
    }

    // Cart snapshot
    let totalCartUnits = 0;
    let activeCartValuePaise = 0;
    for (const cart of cartsWithItems) {
      for (const item of cart.items) {
        totalCartUnits += item.quantity;
        activeCartValuePaise += item.quantity * toPaise(item.price);
      }
    }

    return {
      meta: {
        ...dateRange,
        currency: 'INR',
        moneyUnit: 'INR_RUPEES',
        definitions: {
          grossSales:
            'Sum of Order.totalAmount for qualifying paid orders (paymentStatus CAPTURED or REFUNDED) created within the selected IST period.',
          refundedAmount:
            'Sum of verified refunded Payment amounts against qualifying orders in the selected period.',
          netRevenue: 'Gross Sales minus Refunded Amount.',
          averageOrderValue: 'Gross Sales divided by Qualifying Paid Orders count.',
          refundRate:
            'Percentage of Qualifying Paid Orders that have a full or partial refund (Refunded Orders / Qualifying Paid Orders * 100).',
        },
      },
      kpis: {
        netRevenue: toRupees(netRevenuePaise),
        netRevenueRupees: toRupees(netRevenuePaise),
        netRevenuePaise,
        grossSales: toRupees(grossSalesPaise),
        grossSalesRupees: toRupees(grossSalesPaise),
        grossSalesPaise,
        totalOrders: ordersInPeriod.length,
        qualifyingOrdersCount,
        averageOrderValue: toRupees(averageOrderValuePaise),
        averageOrderValueRupees: toRupees(averageOrderValuePaise),
        averageOrderValuePaise,
        refundedAmount: toRupees(refundedAmountPaise),
        refundedAmountRupees: toRupees(refundedAmountPaise),
        refundedAmountPaise,
        refundedOrdersCount,
        refundRatePercent,
        refundVolumeRatePercent,
        totalCustomers: totalCustomersAllTime,
        activeBuyingCustomers: activeBuyingCustomersInPeriod,
        newCustomers: newBuyingCustomersInPeriod,
        newRegisteredCustomers: newRegisteredCustomersInPeriod,
        returningCustomers: returningCustomersInPeriod,
        repeatPurchaseRatePercent,
        unitsSold,
        couponDiscountTotal: toRupees(totalDiscountPaise),
        couponDiscountRupees: toRupees(totalDiscountPaise),
        couponDiscountPaise: totalDiscountPaise,
        couponOrdersCount,
      },
      ordersByStatus: statusCounts,
      inventory: {
        totalProducts: products.length,
        activeProducts,
        inactiveProducts,
        outOfStockProducts,
        lowStockProducts,
        totalStockUnits,
        estimatedStockValueRupees: toRupees(estimatedStockValuePaise),
        estimatedStockValuePaise,
      },
      carts: {
        totalCarts: totalCartsCount,
        cartsWithItems: cartsWithItems.length,
        totalCartUnits,
        activeCartValueRupees: toRupees(activeCartValuePaise),
        activeCartValuePaise,
        note: 'Abandoned-cart analytics require additional cart lifecycle tracking.',
      },
    };
  }

  /**
   * 2. GET /api/admin/analytics/revenue
   * Time-series revenue breakdown (Gross Sales, Refunds, Net Revenue) by daily/weekly/monthly buckets in IST.
   */
  async getRevenueAnalytics(query: AnalyticsDateRangeInput = {}) {
    const dateRange = resolveAnalyticsDateRange(query);
    const orders = await this.fetchOrdersInPeriod(dateRange);

    const bucketKeys = buildAllBucketKeys(
      dateRange.startDate,
      dateRange.endDate,
      dateRange.granularity
    );

    const bucketMap = new Map<
      string,
      {
        date: string;
        grossSalesPaise: number;
        refundsPaise: number;
        discountPaise: number;
        qualifyingOrdersCount: number;
        totalOrdersCount: number;
      }
    >();

    for (const key of bucketKeys) {
      bucketMap.set(key, {
        date: key,
        grossSalesPaise: 0,
        refundsPaise: 0,
        discountPaise: 0,
        qualifyingOrdersCount: 0,
        totalOrdersCount: 0,
      });
    }

    let totalGrossPaise = 0;
    let totalRefundsPaise = 0;
    let totalDiscountPaise = 0;
    let totalQualifyingOrders = 0;

    for (const order of orders) {
      const orderYmd = toIstCalendarParts(order.createdAt).ymd;
      const bucketKey = getBucketKeyForIstYmd(orderYmd, dateRange.granularity);
      let bucket = bucketMap.get(bucketKey);
      if (!bucket) {
        bucket = {
          date: bucketKey,
          grossSalesPaise: 0,
          refundsPaise: 0,
          discountPaise: 0,
          qualifyingOrdersCount: 0,
          totalOrdersCount: 0,
        };
        bucketMap.set(bucketKey, bucket);
      }

      bucket.totalOrdersCount += 1;

      if (isQualifyingPaidOrder(order)) {
        const orderPaise = toPaise(order.totalAmount);
        const { refundedPaise } = getOrderRefundedPaise(order);
        const discPaise = toPaise(order.discountAmount);

        bucket.grossSalesPaise += orderPaise;
        bucket.refundsPaise += refundedPaise;
        bucket.discountPaise += discPaise;
        bucket.qualifyingOrdersCount += 1;

        totalGrossPaise += orderPaise;
        totalRefundsPaise += refundedPaise;
        totalDiscountPaise += discPaise;
        totalQualifyingOrders += 1;
      }
    }

    const series = Array.from(bucketMap.values()).map((b) => {
      const netPaise = Math.max(0, b.grossSalesPaise - b.refundsPaise);
      return {
        date: b.date,
        grossSales: toRupees(b.grossSalesPaise),
        grossSalesRupees: toRupees(b.grossSalesPaise),
        grossSalesPaise: b.grossSalesPaise,
        refunds: toRupees(b.refundsPaise),
        refundsRupees: toRupees(b.refundsPaise),
        refundsPaise: b.refundsPaise,
        netRevenue: toRupees(netPaise),
        netRevenueRupees: toRupees(netPaise),
        netRevenuePaise: netPaise,
        discountRupees: toRupees(b.discountPaise),
        discountPaise: b.discountPaise,
        qualifyingOrdersCount: b.qualifyingOrdersCount,
        totalOrdersCount: b.totalOrdersCount,
      };
    });

    const totalNetPaise = Math.max(0, totalGrossPaise - totalRefundsPaise);

    return {
      meta: {
        ...dateRange,
        currency: 'INR',
        moneyUnit: 'INR_RUPEES',
      },
      totals: {
        grossSales: toRupees(totalGrossPaise),
        grossSalesRupees: toRupees(totalGrossPaise),
        grossSalesPaise: totalGrossPaise,
        refunds: toRupees(totalRefundsPaise),
        refundsRupees: toRupees(totalRefundsPaise),
        refundsPaise: totalRefundsPaise,
        netRevenue: toRupees(totalNetPaise),
        netRevenueRupees: toRupees(totalNetPaise),
        netRevenuePaise: totalNetPaise,
        discountRupees: toRupees(totalDiscountPaise),
        discountPaise: totalDiscountPaise,
        qualifyingOrdersCount: totalQualifyingOrders,
      },
      series,
    };
  }

  /**
   * 3. GET /api/admin/analytics/orders
   * Order volume, status distribution, shipping status distribution, and trend over time.
   */
  async getOrderAnalytics(query: AnalyticsDateRangeInput = {}) {
    const dateRange = resolveAnalyticsDateRange(query);
    const orders = await this.fetchOrdersInPeriod(dateRange);

    const statusCounts: Record<OrderStatus, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    const shippingStatusCounts: Record<ShippingStatus, number> = {
      PENDING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      RETURNED: 0,
    };

    const bucketKeys = buildAllBucketKeys(
      dateRange.startDate,
      dateRange.endDate,
      dateRange.granularity
    );
    const trendMap = new Map<
      string,
      {
        date: string;
        totalOrders: number;
        qualifyingOrders: number;
        confirmedOrders: number;
        deliveredOrders: number;
        cancelledOrders: number;
        pendingOrders: number;
      }
    >();

    for (const key of bucketKeys) {
      trendMap.set(key, {
        date: key,
        totalOrders: 0,
        qualifyingOrders: 0,
        confirmedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        pendingOrders: 0,
      });
    }

    for (const order of orders) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      shippingStatusCounts[order.shippingStatus] =
        (shippingStatusCounts[order.shippingStatus] || 0) + 1;

      const ymd = toIstCalendarParts(order.createdAt).ymd;
      const bucketKey = getBucketKeyForIstYmd(ymd, dateRange.granularity);
      const bucket = trendMap.get(bucketKey);
      if (bucket) {
        bucket.totalOrders += 1;
        if (isQualifyingPaidOrder(order)) {
          bucket.qualifyingOrders += 1;
        }
        if (order.status === 'CONFIRMED' || order.status === 'PROCESSING' || order.status === 'SHIPPED') {
          bucket.confirmedOrders += 1;
        } else if (order.status === 'DELIVERED') {
          bucket.deliveredOrders += 1;
        } else if (order.status === 'CANCELLED') {
          bucket.cancelledOrders += 1;
        } else if (order.status === 'PENDING') {
          bucket.pendingOrders += 1;
        }
      }
    }

    const totalOrders = orders.length;
    const statusDistribution = (Object.keys(statusCounts) as OrderStatus[]).map((status) => ({
      status,
      count: statusCounts[status],
      percentage: safePercent(statusCounts[status], totalOrders),
    }));

    const shippingDistribution = (Object.keys(shippingStatusCounts) as ShippingStatus[]).map(
      (shippingStatus) => ({
        shippingStatus,
        count: shippingStatusCounts[shippingStatus],
        percentage: safePercent(shippingStatusCounts[shippingStatus], totalOrders),
      })
    );

    return {
      meta: {
        ...dateRange,
      },
      totals: {
        totalOrders,
        pendingOrders: statusCounts.PENDING,
        confirmedOrders: statusCounts.CONFIRMED,
        processingOrders: statusCounts.PROCESSING,
        shippedOrders: statusCounts.SHIPPED,
        deliveredOrders: statusCounts.DELIVERED,
        cancelledOrders: statusCounts.CANCELLED,
      },
      statusDistribution,
      shippingDistribution,
      trend: Array.from(trendMap.values()),
    };
  }

  /**
   * 4. GET /api/admin/analytics/payments
   * Authoritative payment metrics from Payment table.
   */
  async getPaymentAnalytics(query: AnalyticsDateRangeInput = {}) {
    const dateRange = resolveAnalyticsDateRange(query);

    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: dateRange.startUtc,
          lte: dateRange.endUtc,
        },
      },
      select: {
        id: true,
        orderId: true,
        amount: true,
        status: true,
        providerPaymentId: true,
        signatureVerified: true,
        createdAt: true,
      },
    });

    const byStatus: Record<PaymentStatus, { count: number; amountPaise: number }> = {
      PENDING: { count: 0, amountPaise: 0 },
      AUTHORIZED: { count: 0, amountPaise: 0 },
      CAPTURED: { count: 0, amountPaise: 0 },
      FAILED: { count: 0, amountPaise: 0 },
      REFUNDED: { count: 0, amountPaise: 0 },
    };

    for (const p of payments) {
      const entry = byStatus[p.status];
      if (entry) {
        entry.count += 1;
        entry.amountPaise += toPaise(p.amount);
      }
    }

    const totalTransactions = payments.length;
    const statusBreakdown = (Object.keys(byStatus) as PaymentStatus[]).map((status) => ({
      status,
      count: byStatus[status].count,
      amountRupees: toRupees(byStatus[status].amountPaise),
      amountPaise: byStatus[status].amountPaise,
      percentage: safePercent(byStatus[status].count, totalTransactions),
    }));

    return {
      meta: {
        ...dateRange,
        currency: 'INR',
        moneyUnit: 'INR_RUPEES',
      },
      totals: {
        totalTransactions,
        capturedCount: byStatus.CAPTURED.count,
        capturedAmountRupees: toRupees(byStatus.CAPTURED.amountPaise),
        capturedAmountPaise: byStatus.CAPTURED.amountPaise,
        failedCount: byStatus.FAILED.count,
        failedAmountRupees: toRupees(byStatus.FAILED.amountPaise),
        failedAmountPaise: byStatus.FAILED.amountPaise,
        pendingCount: byStatus.PENDING.count,
        pendingAmountRupees: toRupees(byStatus.PENDING.amountPaise),
        pendingAmountPaise: byStatus.PENDING.amountPaise,
        authorizedCount: byStatus.AUTHORIZED.count,
        authorizedAmountRupees: toRupees(byStatus.AUTHORIZED.amountPaise),
        authorizedAmountPaise: byStatus.AUTHORIZED.amountPaise,
        refundedCount: byStatus.REFUNDED.count,
        refundedAmountRupees: toRupees(byStatus.REFUNDED.amountPaise),
        refundedAmountPaise: byStatus.REFUNDED.amountPaise,
        paymentSuccessRatePercent: safePercent(
          byStatus.CAPTURED.count,
          byStatus.CAPTURED.count + byStatus.FAILED.count
        ),
      },
      statusBreakdown,
    };
  }

  /**
   * 5. GET /api/admin/analytics/refunds
   * Authoritative refund metrics, refund rate, refunds by date, reasons breakdown, and refunded orders.
   */
  async getRefundAnalytics(query: AnalyticsDateRangeInput = {}) {
    const dateRange = resolveAnalyticsDateRange(query);
    const ordersInPeriod = await this.fetchOrdersInPeriod(dateRange);

    const bucketKeys = buildAllBucketKeys(
      dateRange.startDate,
      dateRange.endDate,
      dateRange.granularity
    );
    const refundTrendMap = new Map<
      string,
      { date: string; refundCount: number; refundAmountPaise: number }
    >();
    for (const key of bucketKeys) {
      refundTrendMap.set(key, { date: key, refundCount: 0, refundAmountPaise: 0 });
    }

    let qualifyingOrdersCount = 0;
    let grossSalesPaise = 0;
    let totalRefundedOrders = 0;
    let totalRefundTransactions = 0;
    let totalRefundAmountPaise = 0;

    const reasonMap = new Map<string, { reason: string; count: number; amountPaise: number }>();
    const refundedOrdersList: Array<{
      orderId: string;
      orderNumber: string;
      orderStatus: OrderStatus;
      paymentStatus: PaymentStatus;
      orderTotalRupees: number;
      orderTotalPaise: number;
      refundedAmountRupees: number;
      refundedAmountPaise: number;
      refundStatus: 'PARTIALLY_REFUNDED' | 'REFUNDED';
      reason: string;
      refundedAt: string;
    }> = [];

    for (const order of ordersInPeriod) {
      if (!isQualifyingPaidOrder(order)) continue;

      qualifyingOrdersCount += 1;
      const orderTotalPaise = toPaise(order.totalAmount);
      grossSalesPaise += orderTotalPaise;

      const { refundedPaise, refundCount, refundRecords } = getOrderRefundedPaise(order);
      if (refundedPaise > 0) {
        totalRefundedOrders += 1;
        totalRefundTransactions += refundCount;
        totalRefundAmountPaise += refundedPaise;

        const orderYmd = toIstCalendarParts(order.createdAt).ymd;
        const bucketKey = getBucketKeyForIstYmd(orderYmd, dateRange.granularity);
        const bucket = refundTrendMap.get(bucketKey);
        if (bucket) {
          bucket.refundCount += refundCount;
          bucket.refundAmountPaise += refundedPaise;
        }

        // Extract reason from rawResponse if available
        let primaryReason = 'Customer return / cancellation';
        let latestRefundDate = order.createdAt;
        for (const r of refundRecords) {
          const raw = r.rawResponse && typeof r.rawResponse === 'object' ? (r.rawResponse as any) : null;
          const rReason = raw?.reason ? String(raw.reason).trim() : 'Customer return / cancellation';
          primaryReason = rReason;
          latestRefundDate = r.createdAt || order.createdAt;
          const existingReason = reasonMap.get(rReason) || {
            reason: rReason,
            count: 0,
            amountPaise: 0,
          };
          existingReason.count += 1;
          existingReason.amountPaise += toPaise(r.amount);
          reasonMap.set(rReason, existingReason);
        }

        if (refundRecords.length === 0) {
          const existingReason = reasonMap.get(primaryReason) || {
            reason: primaryReason,
            count: 0,
            amountPaise: 0,
          };
          existingReason.count += 1;
          existingReason.amountPaise += refundedPaise;
          reasonMap.set(primaryReason, existingReason);
        }

        refundedOrdersList.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderStatus: order.status,
          paymentStatus: order.paymentStatus,
          orderTotalRupees: toRupees(orderTotalPaise),
          orderTotalPaise,
          refundedAmountRupees: toRupees(refundedPaise),
          refundedAmountPaise: refundedPaise,
          refundStatus: refundedPaise >= orderTotalPaise ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          reason: primaryReason,
          refundedAt: latestRefundDate.toISOString(),
        });
      }
    }

    const refundRatePercent = safePercent(totalRefundedOrders, qualifyingOrdersCount);
    const refundVolumeRatePercent = safePercent(totalRefundAmountPaise, grossSalesPaise);

    return {
      meta: {
        ...dateRange,
        currency: 'INR',
        moneyUnit: 'INR_RUPEES',
        refundRateDefinition:
          'Refund Rate = (Refunded Orders / Qualifying Paid Orders) * 100. Refund Volume Rate = (Refunded Amount / Gross Sales) * 100.',
      },
      totals: {
        totalRefunds: totalRefundTransactions,
        refundedOrdersCount: totalRefundedOrders,
        qualifyingOrdersCount,
        refundAmount: toRupees(totalRefundAmountPaise),
        refundAmountRupees: toRupees(totalRefundAmountPaise),
        refundAmountPaise: totalRefundAmountPaise,
        refundRatePercent,
        refundVolumeRatePercent,
      },
      trend: Array.from(refundTrendMap.values()).map((b) => ({
        date: b.date,
        refundCount: b.refundCount,
        refundAmount: toRupees(b.refundAmountPaise),
        refundAmountRupees: toRupees(b.refundAmountPaise),
        refundAmountPaise: b.refundAmountPaise,
      })),
      byReason: Array.from(reasonMap.values())
        .sort((a, b) => b.amountPaise - a.amountPaise)
        .map((r) => ({
          reason: r.reason,
          count: r.count,
          amountRupees: toRupees(r.amountPaise),
          amountPaise: r.amountPaise,
        })),
      refundedOrders: refundedOrdersList.slice(0, 25),
    };
  }

  /**
   * 6. GET /api/admin/analytics/products
   * Product performance ranking, category contribution, low-performing products, and inventory insights.
   */
  async getProductAnalytics(
    query: AnalyticsDateRangeInput & {
      page?: number;
      limit?: number;
      category?: string;
      search?: string;
      sortBy?: 'revenue' | 'unitsSold' | 'orders' | 'stock';
      sortOrder?: 'asc' | 'desc';
      performance?: 'all' | 'top' | 'low';
    } = {}
  ) {
    const dateRange = resolveAnalyticsDateRange(query);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const sortBy = query.sortBy || 'revenue';
    const sortOrder = query.sortOrder || 'desc';

    const [ordersInPeriod, allProducts] = await Promise.all([
      this.fetchOrdersInPeriod(dateRange),
      prisma.product.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          category: true,
          price: true,
          stock: true,
          isActive: true,
        },
      }),
    ]);

    const qualifyingOrderMap = new Map<
      string,
      { totalPaise: number; refundedPaise: number }
    >();
    for (const order of ordersInPeriod) {
      if (isQualifyingPaidOrder(order)) {
        const { refundedPaise } = getOrderRefundedPaise(order);
        qualifyingOrderMap.set(order.id, {
          totalPaise: toPaise(order.totalAmount),
          refundedPaise,
        });
      }
    }

    const qualifyingOrderIds = Array.from(qualifyingOrderMap.keys());
    const orderItems =
      qualifyingOrderIds.length > 0
        ? await prisma.orderItem.findMany({
            where: { orderId: { in: qualifyingOrderIds } },
            select: {
              orderId: true,
              productId: true,
              productName: true,
              quantity: true,
              price: true,
              subtotal: true,
            },
          })
        : [];

    // Aggregate per product
    const productStatsMap = new Map<
      string,
      {
        productId: string;
        name: string;
        sku: string | null;
        category: string;
        catalogPriceRupees: number;
        stock: number;
        isActive: boolean;
        unitsSold: number;
        grossRevenuePaise: number;
        estimatedRefundedPaise: number;
        orderIds: Set<string>;
      }
    >();

    for (const p of allProducts) {
      productStatsMap.set(p.id, {
        productId: p.id,
        name: p.name,
        sku: p.sku || null,
        category: p.category || 'Uncategorized',
        catalogPriceRupees: p.price,
        stock: p.stock,
        isActive: p.isActive,
        unitsSold: 0,
        grossRevenuePaise: 0,
        estimatedRefundedPaise: 0,
        orderIds: new Set<string>(),
      });
    }

    for (const item of orderItems) {
      let stat = productStatsMap.get(item.productId);
      if (!stat) {
        stat = {
          productId: item.productId,
          name: item.productName,
          sku: null,
          category: 'Uncategorized',
          catalogPriceRupees: item.price,
          stock: 0,
          isActive: false,
          unitsSold: 0,
          grossRevenuePaise: 0,
          estimatedRefundedPaise: 0,
          orderIds: new Set<string>(),
        };
        productStatsMap.set(item.productId, stat);
      }

      const itemSubtotalPaise = toPaise(item.subtotal || item.price * item.quantity);
      stat.unitsSold += item.quantity;
      stat.grossRevenuePaise += itemSubtotalPaise;
      stat.orderIds.add(item.orderId);

      const orderInfo = qualifyingOrderMap.get(item.orderId);
      if (orderInfo && orderInfo.refundedPaise > 0 && orderInfo.totalPaise > 0) {
        const proportionalRefund = Math.round(
          (itemSubtotalPaise / orderInfo.totalPaise) * orderInfo.refundedPaise
        );
        stat.estimatedRefundedPaise += Math.min(itemSubtotalPaise, proportionalRefund);
      }
    }

    let allProductRows = Array.from(productStatsMap.values()).map((s) => {
      const netRevenuePaise = Math.max(0, s.grossRevenuePaise - s.estimatedRefundedPaise);
      const avgSellingPricePaise =
        s.unitsSold > 0 ? Math.round(s.grossRevenuePaise / s.unitsSold) : toPaise(s.catalogPriceRupees);

      return {
        productId: s.productId,
        name: s.name,
        sku: s.sku,
        category: s.category,
        isActive: s.isActive,
        stock: s.stock,
        stockStatus:
          s.stock <= 0 ? 'OUT_OF_STOCK' : s.stock <= 10 ? 'LOW_STOCK' : 'IN_STOCK',
        unitsSold: s.unitsSold,
        ordersCount: s.orderIds.size,
        grossRevenue: toRupees(s.grossRevenuePaise),
        grossRevenueRupees: toRupees(s.grossRevenuePaise),
        grossRevenuePaise: s.grossRevenuePaise,
        estimatedRefundedRupees: toRupees(s.estimatedRefundedPaise),
        estimatedRefundedPaise: s.estimatedRefundedPaise,
        netRevenue: toRupees(netRevenuePaise),
        netRevenueRupees: toRupees(netRevenuePaise),
        netRevenuePaise,
        averageSellingPriceRupees: toRupees(avgSellingPricePaise),
        averageSellingPricePaise: avgSellingPricePaise,
      };
    });

    // Category aggregation across all products (before table filters)
    const categoryMap = new Map<
      string,
      { category: string; unitsSold: number; revenuePaise: number; productsCount: number }
    >();
    let totalCategoryRevenuePaise = 0;
    for (const row of allProductRows) {
      totalCategoryRevenuePaise += row.grossRevenuePaise;
      const cat = categoryMap.get(row.category) || {
        category: row.category,
        unitsSold: 0,
        revenuePaise: 0,
        productsCount: 0,
      };
      cat.unitsSold += row.unitsSold;
      cat.revenuePaise += row.grossRevenuePaise;
      cat.productsCount += 1;
      categoryMap.set(row.category, cat);
    }

    const categories = Array.from(categoryMap.values())
      .sort((a, b) => b.revenuePaise - a.revenuePaise)
      .map((c) => ({
        category: c.category,
        unitsSold: c.unitsSold,
        revenue: toRupees(c.revenuePaise),
        revenueRupees: toRupees(c.revenuePaise),
        revenuePaise: c.revenuePaise,
        productsCount: c.productsCount,
        percentageContribution: safePercent(c.revenuePaise, totalCategoryRevenuePaise),
      }));

    // Top products and low-performing products snapshots
    const topByRevenue = [...allProductRows]
      .sort((a, b) => b.grossRevenuePaise - a.grossRevenuePaise || b.unitsSold - a.unitsSold)
      .slice(0, 5);
    const topByUnits = [...allProductRows]
      .sort((a, b) => b.unitsSold - a.unitsSold || b.grossRevenuePaise - a.grossRevenuePaise)
      .slice(0, 5);
    const lowPerforming = [...allProductRows]
      .sort((a, b) => a.unitsSold - b.unitsSold || a.grossRevenuePaise - b.grossRevenuePaise)
      .slice(0, 5);

    // Apply optional category, search, and performance filter for table
    if (query.category) {
      const catLower = query.category.trim().toLowerCase();
      allProductRows = allProductRows.filter((r) => r.category.toLowerCase() === catLower);
    }
    if (query.search) {
      const q = query.search.trim().toLowerCase();
      allProductRows = allProductRows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.sku && r.sku.toLowerCase().includes(q)) ||
          r.category.toLowerCase().includes(q)
      );
    }
    if (query.performance === 'top') {
      allProductRows = allProductRows.filter((r) => r.unitsSold > 0);
    } else if (query.performance === 'low') {
      allProductRows = [...allProductRows].sort(
        (a, b) => a.unitsSold - b.unitsSold || a.grossRevenuePaise - b.grossRevenuePaise
      );
    }

    // Apply requested sorting
    if (query.performance !== 'low') {
      const dir = sortOrder === 'asc' ? 1 : -1;
      allProductRows.sort((a, b) => {
        if (sortBy === 'unitsSold') {
          return (a.unitsSold - b.unitsSold) * dir || (a.grossRevenuePaise - b.grossRevenuePaise) * dir;
        }
        if (sortBy === 'orders') {
          return (a.ordersCount - b.ordersCount) * dir || (a.grossRevenuePaise - b.grossRevenuePaise) * dir;
        }
        if (sortBy === 'stock') {
          return (a.stock - b.stock) * dir;
        }
        return (a.grossRevenuePaise - b.grossRevenuePaise) * dir || (a.unitsSold - b.unitsSold) * dir;
      });
    }

    const total = allProductRows.length;
    const paginatedProducts = allProductRows.slice((page - 1) * limit, page * limit);

    return {
      meta: {
        ...dateRange,
        currency: 'INR',
        moneyUnit: 'INR_RUPEES',
      },
      topByRevenue,
      topByUnits,
      lowPerforming,
      categories,
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  /**
   * 7. GET /api/admin/analytics/customers
   * Customer acquisition, repeat purchase retention, and sanitized top customers table.
   */
  async getCustomerAnalytics(
    query: AnalyticsDateRangeInput & {
      page?: number;
      limit?: number;
      search?: string;
    } = {}
  ) {
    const dateRange = resolveAnalyticsDateRange(query);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const [
      totalRegisteredCustomers,
      newRegisteredInPeriod,
      allQualifyingOrders,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: dateRange.startUtc, lte: dateRange.endUtc },
        },
      }),
      prisma.order.findMany({
        where: {
          paymentStatus: { in: ['CAPTURED', 'REFUNDED'] },
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          userId: true,
          totalAmount: true,
          paymentStatus: true,
          createdAt: true,
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              providerPaymentId: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const customerMap = new Map<
      string,
      {
        customerId: string;
        name: string;
        email: string;
        firstOrderAt: Date;
        lastOrderAt: Date;
        lifetimeOrders: number;
        periodOrders: number;
        lifetimeGrossSpendPaise: number;
        lifetimeNetSpendPaise: number;
        periodGrossSpendPaise: number;
      }
    >();

    for (const order of allQualifyingOrders) {
      const orderPaise = toPaise(order.totalAmount);
      const { refundedPaise } = getOrderRefundedPaise(order);
      const netOrderPaise = Math.max(0, orderPaise - refundedPaise);
      const inSelectedPeriod =
        order.createdAt.getTime() >= dateRange.startUtc.getTime() &&
        order.createdAt.getTime() <= dateRange.endUtc.getTime();

      let entry = customerMap.get(order.userId);
      if (!entry) {
        entry = {
          customerId: order.userId,
          name: order.user?.name || 'Customer',
          email: order.user?.email || '—',
          firstOrderAt: order.createdAt,
          lastOrderAt: order.createdAt,
          lifetimeOrders: 0,
          periodOrders: 0,
          lifetimeGrossSpendPaise: 0,
          lifetimeNetSpendPaise: 0,
          periodGrossSpendPaise: 0,
        };
        customerMap.set(order.userId, entry);
      }

      entry.lifetimeOrders += 1;
      entry.lifetimeGrossSpendPaise += orderPaise;
      entry.lifetimeNetSpendPaise += netOrderPaise;
      if (order.createdAt.getTime() < entry.firstOrderAt.getTime()) {
        entry.firstOrderAt = order.createdAt;
      }
      if (order.createdAt.getTime() > entry.lastOrderAt.getTime()) {
        entry.lastOrderAt = order.createdAt;
      }
      if (inSelectedPeriod) {
        entry.periodOrders += 1;
        entry.periodGrossSpendPaise += orderPaise;
      }
    }

    let customersWithQualifyingOrdersAllTime = 0;
    let activeCustomersInPeriod = 0;
    let newBuyingCustomersInPeriod = 0;
    let returningCustomersInPeriod = 0;
    let repeatCustomersAllTime = 0;
    let totalLifetimeGrossSpendPaise = 0;
    let totalLifetimeOrders = 0;

    for (const c of customerMap.values()) {
      customersWithQualifyingOrdersAllTime += 1;
      totalLifetimeGrossSpendPaise += c.lifetimeGrossSpendPaise;
      totalLifetimeOrders += c.lifetimeOrders;

      if (c.lifetimeOrders > 1) {
        repeatCustomersAllTime += 1;
      }

      if (c.periodOrders > 0) {
        activeCustomersInPeriod += 1;
        const firstInPeriod =
          c.firstOrderAt.getTime() >= dateRange.startUtc.getTime() &&
          c.firstOrderAt.getTime() <= dateRange.endUtc.getTime();
        const hadPriorOrderBeforePeriod =
          c.firstOrderAt.getTime() < dateRange.startUtc.getTime();

        if (firstInPeriod) {
          newBuyingCustomersInPeriod += 1;
        }
        if (hadPriorOrderBeforePeriod || c.periodOrders > 1) {
          returningCustomersInPeriod += 1;
        }
      }
    }

    const averageCustomerSpendPaise =
      customersWithQualifyingOrdersAllTime > 0
        ? Math.round(totalLifetimeGrossSpendPaise / customersWithQualifyingOrdersAllTime)
        : 0;
    const averageOrdersPerCustomer =
      customersWithQualifyingOrdersAllTime > 0
        ? Math.round((totalLifetimeOrders / customersWithQualifyingOrdersAllTime) * 100) / 100
        : 0;

    let rankedCustomers = Array.from(customerMap.values()).map((c) => ({
      customerId: c.customerId,
      name: c.name,
      email: c.email,
      ordersCount: c.lifetimeOrders,
      periodOrdersCount: c.periodOrders,
      lifetimeSpend: toRupees(c.lifetimeGrossSpendPaise),
      lifetimeSpendRupees: toRupees(c.lifetimeGrossSpendPaise),
      lifetimeSpendPaise: c.lifetimeGrossSpendPaise,
      netLifetimeSpendRupees: toRupees(c.lifetimeNetSpendPaise),
      netLifetimeSpendPaise: c.lifetimeNetSpendPaise,
      periodSpendRupees: toRupees(c.periodGrossSpendPaise),
      periodSpendPaise: c.periodGrossSpendPaise,
      firstOrderAt: c.firstOrderAt.toISOString(),
      lastOrderAt: c.lastOrderAt.toISOString(),
      customerType: c.lifetimeOrders > 1 ? ('RETURNING' as const) : ('NEW' as const),
    }));

    if (query.search) {
      const q = query.search.trim().toLowerCase();
      rankedCustomers = rankedCustomers.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      );
    }

    rankedCustomers.sort(
      (a, b) => b.lifetimeSpendPaise - a.lifetimeSpendPaise || b.ordersCount - a.ordersCount
    );

    const total = rankedCustomers.length;
    const paginatedCustomers = rankedCustomers.slice((page - 1) * limit, page * limit);

    return {
      meta: {
        ...dateRange,
        currency: 'INR',
        moneyUnit: 'INR_RUPEES',
        definitions: {
          newCustomer:
            'Customer whose first-ever qualifying paid order falls inside the selected date range.',
          returningCustomer:
            'Customer who placed a qualifying paid order in the selected range and either had prior qualifying order history or placed multiple qualifying orders.',
          repeatPurchaseRate:
            'Percentage of active buying customers in the period who are returning customers.',
        },
      },
      totals: {
        totalCustomers: totalRegisteredCustomers,
        customersWithOrders: customersWithQualifyingOrdersAllTime,
        activeCustomersInPeriod,
        newRegisteredInPeriod,
        newCustomers: newBuyingCustomersInPeriod,
        returningCustomers: returningCustomersInPeriod,
        repeatCustomersAllTime,
        repeatPurchaseRatePercent: safePercent(
          returningCustomersInPeriod,
          activeCustomersInPeriod
        ),
        lifetimeRepeatPurchaseRatePercent: safePercent(
          repeatCustomersAllTime,
          customersWithQualifyingOrdersAllTime
        ),
        averageCustomerSpend: toRupees(averageCustomerSpendPaise),
        averageCustomerSpendRupees: toRupees(averageCustomerSpendPaise),
        averageCustomerSpendPaise,
        averageOrdersPerCustomer,
      },
      topCustomers: paginatedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  /**
   * 8. GET /api/admin/analytics/coupons
   * Coupon effectiveness using authoritative PostgreSQL Coupon rows and persisted Order discount snapshots.
   */
  async getCouponAnalytics(
    query: AnalyticsDateRangeInput & {
      page?: number;
      limit?: number;
      search?: string;
    } = {}
  ) {
    const dateRange = resolveAnalyticsDateRange(query);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const [ordersInPeriod, allCoupons] = await Promise.all([
      this.fetchOrdersInPeriod(dateRange),
      prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const couponStatsMap = new Map<
      string,
      {
        couponId: string | null;
        code: string;
        discountType: string;
        discountValue: number;
        isActive: boolean;
        isExpired: boolean;
        usageLimit: number | null;
        persistedUsedCount: number;
        periodOrdersCount: number;
        periodDiscountGivenPaise: number;
        periodGrossRevenuePaise: number;
        periodNetRevenuePaise: number;
      }
    >();

    const now = new Date();
    for (const c of allCoupons) {
      const isExpired = Boolean(c.expiresAt && c.expiresAt.getTime() < now.getTime());
      couponStatsMap.set(c.code.toUpperCase(), {
        couponId: c.id,
        code: c.code.toUpperCase(),
        discountType: c.discountType,
        discountValue: c.discountValue,
        isActive: c.isActive,
        isExpired,
        usageLimit: c.usageLimit,
        persistedUsedCount: c.usedCount,
        periodOrdersCount: 0,
        periodDiscountGivenPaise: 0,
        periodGrossRevenuePaise: 0,
        periodNetRevenuePaise: 0,
      });
    }

    let totalQualifyingOrders = 0;
    let ordersUsingCouponsCount = 0;
    let totalDiscountGivenPaise = 0;
    let couponDrivenGrossSalesPaise = 0;
    let couponDrivenNetRevenuePaise = 0;

    for (const order of ordersInPeriod) {
      if (!isQualifyingPaidOrder(order)) continue;
      totalQualifyingOrders += 1;

      const { couponMeta } = extractOrderCouponMeta(order.shippingAddress);
      const discountPaise = toPaise(order.discountAmount ?? couponMeta?.discountAmount ?? 0);
      const rawCode = couponMeta?.couponCode ? String(couponMeta.couponCode).trim().toUpperCase() : null;

      if (discountPaise > 0 || rawCode) {
        const codeKey = rawCode || 'UNSPECIFIED_COUPON';
        const orderGrossPaise = toPaise(order.totalAmount);
        const { refundedPaise } = getOrderRefundedPaise(order);
        const orderNetPaise = Math.max(0, orderGrossPaise - refundedPaise);

        ordersUsingCouponsCount += 1;
        totalDiscountGivenPaise += discountPaise;
        couponDrivenGrossSalesPaise += orderGrossPaise;
        couponDrivenNetRevenuePaise += orderNetPaise;

        let entry = couponStatsMap.get(codeKey);
        if (!entry) {
          entry = {
            couponId: couponMeta?.couponId || null,
            code: codeKey,
            discountType: couponMeta?.discountType || 'FIXED',
            discountValue: couponMeta?.discountValue || toRupees(discountPaise),
            isActive: false,
            isExpired: false,
            usageLimit: null,
            persistedUsedCount: 1,
            periodOrdersCount: 0,
            periodDiscountGivenPaise: 0,
            periodGrossRevenuePaise: 0,
            periodNetRevenuePaise: 0,
          };
          couponStatsMap.set(codeKey, entry);
        }

        entry.periodOrdersCount += 1;
        entry.periodDiscountGivenPaise += discountPaise;
        entry.periodGrossRevenuePaise += orderGrossPaise;
        entry.periodNetRevenuePaise += orderNetPaise;
      }
    }

    const averageDiscountPerCouponOrderPaise =
      ordersUsingCouponsCount > 0
        ? Math.round(totalDiscountGivenPaise / ordersUsingCouponsCount)
        : 0;

    let couponRows = Array.from(couponStatsMap.values()).map((c) => ({
      couponId: c.couponId,
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      isActive: c.isActive,
      isExpired: c.isExpired,
      usageLimit: c.usageLimit,
      totalUsedCount: c.persistedUsedCount,
      ordersInPeriod: c.periodOrdersCount,
      discountGiven: toRupees(c.periodDiscountGivenPaise),
      discountGivenRupees: toRupees(c.periodDiscountGivenPaise),
      discountGivenPaise: c.periodDiscountGivenPaise,
      grossRevenueGenerated: toRupees(c.periodGrossRevenuePaise),
      grossRevenueGeneratedRupees: toRupees(c.periodGrossRevenuePaise),
      grossRevenueGeneratedPaise: c.periodGrossRevenuePaise,
      netRevenueGenerated: toRupees(c.periodNetRevenuePaise),
      netRevenueGeneratedRupees: toRupees(c.periodNetRevenuePaise),
      netRevenueGeneratedPaise: c.periodNetRevenuePaise,
    }));

    const activeCouponsCount = couponRows.filter((c) => c.isActive && !c.isExpired).length;
    const inactiveOrExpiredCouponsCount = couponRows.length - activeCouponsCount;
    const couponsUsedInPeriodCount = couponRows.filter((c) => c.ordersInPeriod > 0).length;

    if (query.search) {
      const q = query.search.trim().toLowerCase();
      couponRows = couponRows.filter((c) => c.code.toLowerCase().includes(q));
    }

    couponRows.sort(
      (a, b) =>
        b.grossRevenueGeneratedPaise - a.grossRevenueGeneratedPaise ||
        b.ordersInPeriod - a.ordersInPeriod ||
        b.totalUsedCount - a.totalUsedCount
    );

    const total = couponRows.length;
    const paginatedCoupons = couponRows.slice((page - 1) * limit, page * limit);

    return {
      meta: {
        ...dateRange,
        currency: 'INR',
        moneyUnit: 'INR_RUPEES',
      },
      totals: {
        totalConfiguredCoupons: allCoupons.length,
        activeCouponsCount,
        inactiveOrExpiredCouponsCount,
        couponsUsedInPeriodCount,
        ordersUsingCouponsCount,
        couponOrderSharePercent: safePercent(ordersUsingCouponsCount, totalQualifyingOrders),
        totalDiscountGiven: toRupees(totalDiscountGivenPaise),
        totalDiscountGivenRupees: toRupees(totalDiscountGivenPaise),
        totalDiscountGivenPaise,
        couponDrivenGrossSales: toRupees(couponDrivenGrossSalesPaise),
        couponDrivenGrossSalesRupees: toRupees(couponDrivenGrossSalesPaise),
        couponDrivenGrossSalesPaise,
        couponDrivenNetRevenue: toRupees(couponDrivenNetRevenuePaise),
        couponDrivenNetRevenueRupees: toRupees(couponDrivenNetRevenuePaise),
        couponDrivenNetRevenuePaise,
        averageDiscountPerCouponOrder: toRupees(averageDiscountPerCouponOrderPaise),
        averageDiscountPerCouponOrderRupees: toRupees(averageDiscountPerCouponOrderPaise),
        averageDiscountPerCouponOrderPaise,
      },
      coupons: paginatedCoupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
