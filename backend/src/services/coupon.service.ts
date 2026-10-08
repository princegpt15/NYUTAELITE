// backend/src/services/coupon.service.ts
import type { Coupon, CouponDiscountType, Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

export interface AppliedCouponMetadata {
  couponId: string;
  couponCode: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountAmount: number;
  minimumOrderAmount: number | null;
  maximumDiscount: number | null;
  appliedAt: string;
}

/** Convert INR rupees to integer paise deterministically (₹100 = 10000 paise) */
export function toPaise(amountInr: number): number {
  if (!Number.isFinite(amountInr)) return 0;
  return Math.round(Number(amountInr) * 100);
}

/** Convert integer paise back to INR rupees with 2 decimal precision */
export function fromPaise(paise: number): number {
  if (!Number.isFinite(paise)) return 0;
  return Number((Math.round(paise) / 100).toFixed(2));
}

export function createCouponError(message: string, code = 'COUPON_ERROR', statusCode = 422): Error {
  const err: any = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

/**
 * Normalize and validate a single coupon code string.
 * Rejects arrays, comma/space-separated multiple codes, empty codes, or unsafe characters.
 */
export function normalizeCouponCode(rawCode: unknown): string {
  if (Array.isArray(rawCode)) {
    throw createCouponError('Only one coupon can be applied per order.', 'MULTIPLE_COUPONS_NOT_ALLOWED', 422);
  }
  if (typeof rawCode !== 'string') {
    throw createCouponError('Coupon code is required.', 'COUPON_CODE_REQUIRED', 422);
  }

  const trimmed = rawCode.trim();
  if (!trimmed) {
    throw createCouponError('Coupon code is required.', 'COUPON_CODE_REQUIRED', 422);
  }

  // Detect multiple coupon stacking attempts (e.g. "SAVE10,SAVE20", "SAVE10 SAVE20", "SAVE10+SAVE20")
  if (/[,;+|\s]/.test(trimmed)) {
    throw createCouponError('Only one coupon can be applied per order.', 'MULTIPLE_COUPONS_NOT_ALLOWED', 422);
  }

  const normalized = trimmed.toUpperCase();

  // Safe characters check (alphanumeric, hyphen, underscore; length 2..32)
  if (!/^[A-Z0-9_-]{2,32}$/.test(normalized)) {
    throw createCouponError('Coupon code is invalid.', 'INVALID_COUPON_CODE', 422);
  }

  return normalized;
}

/**
 * Deterministically calculate discount in integer paise.
 * Guarantees:
 * - 0 <= discountPaise <= subtotalPaise
 * - PERCENTAGE respects maximumDiscount if configured
 * - FIXED never exceeds subtotalPaise (never produces negative payable total)
 */
export function calculateDiscountPaise(
  subtotalPaise: number,
  coupon: Pick<Coupon, 'discountType' | 'discountValue' | 'maximumDiscount'>
): number {
  if (subtotalPaise <= 0 || coupon.discountValue <= 0) {
    return 0;
  }

  let discountPaise = 0;

  if (coupon.discountType === 'PERCENTAGE') {
    // Percentage must be > 0 and <= 100
    const clampedPct = Math.min(100, Math.max(0, Number(coupon.discountValue)));
    discountPaise = Math.round((subtotalPaise * clampedPct) / 100);

    if (coupon.maximumDiscount !== null && coupon.maximumDiscount !== undefined && coupon.maximumDiscount > 0) {
      const maxDiscountPaise = toPaise(coupon.maximumDiscount);
      discountPaise = Math.min(discountPaise, maxDiscountPaise);
    }
  } else if (coupon.discountType === 'FIXED') {
    discountPaise = toPaise(coupon.discountValue);
  }

  // Never allow discount to exceed eligible subtotal or be negative
  return Math.max(0, Math.min(discountPaise, subtotalPaise));
}

/**
 * Extract `_couponMeta` from an Order's `shippingAddress` JSONB snapshot
 * and return a clean shippingAddress object without internal metadata keys.
 */
export function extractOrderCouponMeta(shippingAddressRaw: unknown): {
  cleanShippingAddress: any;
  couponMeta: AppliedCouponMetadata | null;
} {
  if (!shippingAddressRaw || typeof shippingAddressRaw !== 'object' || Array.isArray(shippingAddressRaw)) {
    return { cleanShippingAddress: shippingAddressRaw ?? null, couponMeta: null };
  }

  const rawObj = shippingAddressRaw as Record<string, any>;
  const { _couponMeta, ...restAddress } = rawObj;

  if (_couponMeta && typeof _couponMeta === 'object' && _couponMeta.couponCode) {
    return {
      cleanShippingAddress: Object.keys(restAddress).length > 0 ? restAddress : null,
      couponMeta: {
        couponId: String(_couponMeta.couponId || ''),
        couponCode: String(_couponMeta.couponCode),
        discountType: _couponMeta.discountType || 'FIXED',
        discountValue: Number(_couponMeta.discountValue || 0),
        discountAmount: Number(_couponMeta.discountAmount || 0),
        minimumOrderAmount:
          _couponMeta.minimumOrderAmount !== undefined && _couponMeta.minimumOrderAmount !== null
            ? Number(_couponMeta.minimumOrderAmount)
            : null,
        maximumDiscount:
          _couponMeta.maximumDiscount !== undefined && _couponMeta.maximumDiscount !== null
            ? Number(_couponMeta.maximumDiscount)
            : null,
        appliedAt: String(_couponMeta.appliedAt || ''),
      },
    };
  }

  return { cleanShippingAddress: restAddress, couponMeta: null };
}

export class CouponService {
  /**
   * Count how many orders a given user has created with a specific coupon.
   * Uses PostgreSQL JSONB extraction on Order.shippingAddress._couponMeta.
   * Per Phase 10 financial rules, a coupon usage consumed by a created order remains consumed
   * even if the order is later cancelled or refunded.
   */
  async getCustomerCouponUsageCount(
    userId: string,
    coupon: Pick<Coupon, 'id' | 'code'>,
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const db = tx || prisma;
    const rows = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "Order"
      WHERE "userId" = ${userId}
        AND (
          "shippingAddress"->'_couponMeta'->>'couponId' = ${coupon.id}
          OR UPPER("shippingAddress"->'_couponMeta'->>'couponCode') = ${coupon.code}
        )
    `;
    return Number(rows[0]?.count || 0);
  }

  /**
   * Validate a coupon code against all business rules in PostgreSQL and calculate the discount in paise.
   * Does NOT increment usage count (usage is incremented only inside OrderService.createOrder transaction).
   */
  async validateAndCalculate(params: {
    rawCode: unknown;
    subtotalPaise: number;
    userId: string;
    tx?: Prisma.TransactionClient;
  }): Promise<{
    coupon: Coupon;
    discountPaise: number;
    discountAmount: number;
  }> {
    const { rawCode, subtotalPaise, userId, tx } = params;
    const db = tx || prisma;

    // 1. Normalize & validate single code format
    const normalizedCode = normalizeCouponCode(rawCode);

    // 2. Lookup coupon in PostgreSQL (case-insensitive safety with normalized uppercase priority)
    let coupon = await db.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      coupon = await db.coupon.findFirst({
        where: { code: { equals: normalizedCode, mode: 'insensitive' } },
      });
    }

    if (!coupon) {
      throw createCouponError('Coupon code is invalid.', 'INVALID_COUPON_CODE', 422);
    }

    // 3. Active check
    if (!coupon.isActive) {
      throw createCouponError('This coupon is inactive.', 'COUPON_INACTIVE', 422);
    }

    // 4. Date validity checks using authoritative server time and PostgreSQL columns
    const nowMs = Date.now();
    if (coupon.startsAt) {
      const startMs = coupon.startsAt.getTime();
      if (!Number.isNaN(startMs) && startMs > nowMs) {
        throw createCouponError('This coupon is not active yet.', 'COUPON_NOT_STARTED', 422);
      }
    }

    if (coupon.expiresAt) {
      const expiryMs = coupon.expiresAt.getTime();
      if (!Number.isNaN(expiryMs) && expiryMs <= nowMs) {
        throw createCouponError('This coupon has expired.', 'COUPON_EXPIRED', 422);
      }
    }

    // 5. Minimum order amount check (in integer paise)
    if (coupon.minimumOrderAmount !== null && coupon.minimumOrderAmount !== undefined && coupon.minimumOrderAmount > 0) {
      const minOrderPaise = toPaise(coupon.minimumOrderAmount);
      if (subtotalPaise < minOrderPaise) {
        const formattedMin = new Intl.NumberFormat('en-IN', {
          maximumFractionDigits: 2,
        }).format(coupon.minimumOrderAmount);
        throw createCouponError(
          `Minimum order value for this coupon is ₹${formattedMin}.`,
          'MINIMUM_ORDER_NOT_MET',
          422
        );
      }
    }

    // 6. Global usage limit check
    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
      throw createCouponError('This coupon has reached its usage limit.', 'USAGE_LIMIT_REACHED', 422);
    }

    // 7. Per-customer usage limit check (directly from PostgreSQL Coupon.perCustomerLimit)
    const perCustomerLimit = coupon.perCustomerLimit ?? null;
    if (perCustomerLimit !== null && perCustomerLimit !== undefined && perCustomerLimit >= 1) {
      const customerUsed = await this.getCustomerCouponUsageCount(userId, coupon, tx);
      if (customerUsed >= perCustomerLimit) {
        throw createCouponError('You have already used this coupon.', 'PER_CUSTOMER_LIMIT_REACHED', 422);
      }
    }

    // 8. Validate coupon discount configuration
    if (coupon.discountValue <= 0) {
      throw createCouponError('Coupon code is invalid.', 'INVALID_COUPON_VALUE', 422);
    }
    if (coupon.discountType === 'PERCENTAGE' && coupon.discountValue > 100) {
      throw createCouponError('Coupon code is invalid.', 'INVALID_COUPON_VALUE', 422);
    }

    // 9. Deterministic discount calculation in paise
    const discountPaise = calculateDiscountPaise(subtotalPaise, coupon);
    const discountAmount = fromPaise(discountPaise);

    return {
      coupon,
      discountPaise,
      discountAmount,
    };
  }

  /**
   * Atomically validate and consume a coupon inside an active database transaction (`tx`).
   * Uses a conditional PostgreSQL UPDATE statement that locks the Coupon row,
   * prevents race conditions when `usageLimit` is reached (e.g. `usageLimit = 1`),
   * and re-verifies `perCustomerLimit` while holding the row lock.
   */
  async consumeCouponInTransaction(
    tx: Prisma.TransactionClient,
    params: {
      rawCode: unknown;
      subtotalPaise: number;
      userId: string;
    }
  ): Promise<{
    discountPaise: number;
    discountAmount: number;
    couponMetaSnapshot: AppliedCouponMetadata;
  }> {
    const { coupon, discountPaise, discountAmount } = await this.validateAndCalculate({
      rawCode: params.rawCode,
      subtotalPaise: params.subtotalPaise,
      userId: params.userId,
      tx,
    });

    // Atomic conditional increment in PostgreSQL.
    // This statement acquires an exclusive row lock on the Coupon row until the transaction commits/rolls back,
    // ensuring two concurrent orders cannot both consume the final available usage slot.
    const updatedRows = await tx.$executeRaw`
      UPDATE "Coupon"
      SET "usedCount" = "usedCount" + 1,
          "updatedAt" = NOW()
      WHERE "id" = ${coupon.id}
        AND "isActive" = true
        AND ("startsAt" IS NULL OR "startsAt" <= NOW())
        AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
        AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")
    `;

    if (updatedRows === 0) {
      const fresh = await tx.coupon.findUnique({ where: { id: coupon.id } });
      if (!fresh || !fresh.isActive) {
        throw createCouponError('This coupon is inactive.', 'COUPON_INACTIVE', 422);
      }
      if (fresh.startsAt && fresh.startsAt.getTime() > Date.now()) {
        throw createCouponError('This coupon is not active yet.', 'COUPON_NOT_STARTED', 422);
      }
      if (fresh.expiresAt && fresh.expiresAt.getTime() <= Date.now()) {
        throw createCouponError('This coupon has expired.', 'COUPON_EXPIRED', 422);
      }
      throw createCouponError('This coupon has reached its usage limit.', 'USAGE_LIMIT_REACHED', 422);
    }

    // Re-check per-customer usage limit AFTER acquiring the exclusive lock on the Coupon row
    // so concurrent requests from the same customer are serialized and cannot bypass perCustomerLimit.
    const perCustomerLimit = coupon.perCustomerLimit ?? null;
    if (perCustomerLimit !== null && perCustomerLimit !== undefined && perCustomerLimit >= 1) {
      const customerUsed = await this.getCustomerCouponUsageCount(params.userId, coupon, tx);
      if (customerUsed >= perCustomerLimit) {
        throw createCouponError('You have already used this coupon.', 'PER_CUSTOMER_LIMIT_REACHED', 422);
      }
    }

    const couponMetaSnapshot: AppliedCouponMetadata = {
      couponId: coupon.id,
      couponCode: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      minimumOrderAmount: coupon.minimumOrderAmount ?? null,
      maximumDiscount: coupon.maximumDiscount ?? null,
      appliedAt: new Date().toISOString(),
    };

    return {
      discountPaise,
      discountAmount,
      couponMetaSnapshot,
    };
  }

  /**
   * Validate a coupon against the authenticated user's live PostgreSQL cart.
   * Never accepts subtotal, prices, discount, or userId from the client.
   */
  async validateCouponForCart(userId: string, rawCode: unknown) {
    const normalizedCode = normalizeCouponCode(rawCode);

    // Load authenticated user's cart from PostgreSQL
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw createCouponError(
        'Your cart is empty. Add products to your cart before applying a coupon.',
        'EMPTY_CART',
        422
      );
    }

    // Fetch authoritative product records from PostgreSQL
    const productIds = cart.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotalPaise = 0;
    for (const item of cart.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw createCouponError(`Product not found in catalog: ${item.productName}`, 'PRODUCT_NOT_FOUND', 422);
      }
      if (!product.isActive) {
        throw createCouponError(`Product "${product.name}" is currently unavailable.`, 'PRODUCT_INACTIVE', 422);
      }
      if (item.quantity <= 0) {
        throw createCouponError(`Invalid quantity for "${product.name}".`, 'INVALID_QUANTITY', 422);
      }
      if (product.stock < item.quantity) {
        throw createCouponError(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, in cart: ${item.quantity}.`,
          'INSUFFICIENT_STOCK',
          422
        );
      }

      const unitPricePaise = toPaise(product.price);
      subtotalPaise += unitPricePaise * item.quantity;
    }

    const { coupon, discountPaise, discountAmount } = await this.validateAndCalculate({
      rawCode: normalizedCode,
      subtotalPaise,
      userId,
    });

    const freeShippingThresholdPaise = toPaise(499);
    const shippingPaise =
      subtotalPaise >= freeShippingThresholdPaise || subtotalPaise === 0 ? 0 : toPaise(40);
    const totalPaise = Math.max(0, subtotalPaise - discountPaise + shippingPaise);

    const subtotal = fromPaise(subtotalPaise);
    const shippingAmount = fromPaise(shippingPaise);
    const totalAmount = fromPaise(totalPaise);

    // Return strictly customer-safe fields (never expose internal coupon ID or admin usage limits)
    return {
      valid: true,
      couponCode: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumOrderAmount: coupon.minimumOrderAmount ?? null,
      maximumDiscount: coupon.maximumDiscount ?? null,
      subtotal,
      discountAmount,
      shippingAmount,
      totalAmount,
      currency: 'INR',
      message: `${coupon.code} applied! You saved ₹${discountAmount}.`,
    };
  }
}

export const couponService = new CouponService();
