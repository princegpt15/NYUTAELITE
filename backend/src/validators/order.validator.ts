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

/**
 * Validation schema for creating an order.
 * Client sends shipping address details (or existing addressId) and optional couponCode / paymentMethod.
 * Prices, subtotals, and totals are computed strictly server-side.
 */
export const createOrderSchema = z
  .object({
    addressId: z.string().uuid().optional(),
    address: addressSchema.optional(),
    couponCode: z.string().optional(),
    paymentMethod: z.string().optional(),
  })
  .refine((data) => !!(data.addressId || data.address), {
    message: 'Either addressId or address object must be provided',
    path: ['address'],
  });
