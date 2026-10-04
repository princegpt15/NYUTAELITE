// src/routes/payment.routes.ts
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createOrderSchema, verifyPaymentSchema, refundSchema } from '../validators/payment.validator.js';
import { createOrder, verifyPayment, webhookHandler, refund } from '../controllers/payment.controller.js'

const router = Router();

// Create Razorpay order – authenticated user
router.post(
  '/create-order',
  requireAuth,
  validate(createOrderSchema),
  createOrder,
);

// Verify payment after checkout – authenticated user
router.post(
  '/verify',
  requireAuth,
  validate(verifyPaymentSchema),
  verifyPayment,
);

// Razorpay webhook – no auth
router.post(
  '/webhook',
  webhookHandler,
);

// Refund – admin only
router.post(
  '/refund',
  requireAuth,
  requireAdmin,
  validate(refundSchema),
  refund,
);

export default router;
