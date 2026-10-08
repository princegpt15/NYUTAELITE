// backend/src/routes/coupon.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { validateCouponSchema } from '../validators/order.validator.js';
import { validateCouponForCart } from '../controllers/coupon.controller.js';

const router = Router();

// Customer coupon validation against live database cart (requires authentication)
router.post('/validate', requireAuth, validate(validateCouponSchema, 'body'), validateCouponForCart);

export default router;
