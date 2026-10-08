// backend/src/validators/order.validator.ts
import { z } from 'zod';

export const addressSchema = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return {
        fullName: val.fullName ?? val.name,
        phone: val.phone,
        addressLine1: val.addressLine1 ?? val.street,
        addressLine2: val.addressLine2,
        city: val.city,
        state: val.state,
        postalCode: val.postalCode ?? val.pincode ?? val.zip,
        country: val.country ?? 'India',
        landmark: val.landmark,
        isDefault: val.isDefault,
      };
    }
    return val;
  },
  z.object({
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().min(5, 'Valid phone number is required'),
    addressLine1: z.string().min(1, 'Address line 1 is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().default('India'),
    landmark: z.string().optional(),
    isDefault: z.boolean().optional(),
  })
);

const singleCouponCodeSchema = z
  .any()
  .superRefine((val, ctx) => {
    if (val === undefined || val === null || val === '') {
      return;
    }
    if (Array.isArray(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only one coupon can be applied per order.',
      });
      return;
    }
    if (typeof val !== 'string') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Coupon code must be a string.',
      });
      return;
    }
    const trimmed = val.trim();
    if (trimmed.length > 0 && /[,;+|\s]/.test(trimmed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only one coupon can be applied per order.',
      });
    }
  });

/**
 * Validation schema for creating an order.
 * Client sends shipping address details (or existing addressId) and optional couponCode / paymentMethod.
 * Prices, subtotals, discounts, totals, and userId are strictly forbidden from client input.
 */
export const createOrderSchema = z
  .object({
    addressId: z.string().uuid().optional(),
    address: addressSchema.optional(),
    couponCode: singleCouponCodeSchema.optional(),
    couponCodes: z.any().optional(),
    paymentMethod: z.string().optional(),
    redeemPoints: z.number().int().nonnegative().optional(),
  })
  .strict({
    message:
      'Client-supplied financial or identity fields (subtotal, discount, total, price, userId, or multiple coupons) are strictly forbidden.',
  })
  .superRefine((data, ctx) => {
    if (data.couponCodes !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['couponCodes'],
        message: 'Only one coupon can be applied per order.',
      });
    }
    if (!data.addressId && !data.address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['address'],
        message: 'Either addressId or address object must be provided',
      });
    }
  });

/**
 * Validation schema for POST /api/coupons/validate and POST /api/cart/coupon.
 * Accepts ONLY `couponCode`. Rejects multiple coupons and any client-supplied financial/identity fields.
 */
export const validateCouponSchema = z
  .object({
    couponCode: z.any().optional(),
    couponCodes: z.any().optional(),
  })
  .strict({
    message:
      'Only couponCode is permitted. Client-supplied subtotal, discount, total, price, or userId fields are strictly forbidden.',
  })
  .superRefine((data, ctx) => {
    if (data.couponCodes !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['couponCodes'],
        message: 'Only one coupon can be applied per order.',
      });
      return;
    }
    const val = data.couponCode;
    if (Array.isArray(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['couponCode'],
        message: 'Only one coupon can be applied per order.',
      });
      return;
    }
    if (typeof val !== 'string' || !val.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['couponCode'],
        message: 'Coupon code is required.',
      });
      return;
    }
    const trimmed = val.trim();
    if (/[,;+|\s]/.test(trimmed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['couponCode'],
        message: 'Only one coupon can be applied per order.',
      });
    }
  });
