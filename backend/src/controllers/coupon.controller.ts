// backend/src/controllers/coupon.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { couponService } from '../services/coupon.service.js';

/**
 * Validate a coupon code against the authenticated user's database cart.
 * Server calculates subtotal, discount, shipping, and final total exclusively from PostgreSQL.
 */
export async function validateCouponForCart(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { couponCode } = req.body;
    const result = await couponService.validateCouponForCart(userId, couponCode);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err: any) {
    // Ensure unexpected internal errors never leak Prisma/DB stack traces
    if (!err.statusCode) {
      const safeErr: any = new Error('Unable to validate coupon. Please try again.');
      safeErr.statusCode = 500;
      safeErr.code = 'COUPON_VALIDATION_FAILED';
      return next(safeErr);
    }
    next(err);
  }
}
