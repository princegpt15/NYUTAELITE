import { z } from 'zod';

/**
 * Validation schema for creating an order.
 * The frontend should only send the shipping address ID and an optional coupon code.
 */
export const createOrderSchema = z.object({
  addressId: z.string().uuid(),
  couponCode: z.string().optional(),
});
