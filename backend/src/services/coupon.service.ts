// src/services/coupon.service.ts
/**
 * Minimal stub for CouponService. Currently returns no discount.
 * Extend with real coupon logic as needed.
 */
export class CouponService {
  /**
   * Validate and apply a coupon code.
   * @param code Coupon code provided by the client (optional).
   * @param subtotal Current order subtotal before discount.
   * @returns An object containing the discount amount (0 if invalid) and the applied code.
   */
  async applyCouponIfValid(code: string | undefined, subtotal: number) {
    // Placeholder simple discount: 10% off for any valid code, capped at 100 INR
    const discountAmount = code ? Math.min(subtotal * 0.1, 100) : 0;
    return {
      discountAmount,
      discountCode: code ?? null,
    };
  }
}
