// src/routes/auth.routes.ts
import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Apply rate limiter to auth endpoints (stricter in prod, relaxed in dev)
// keyGenerator must use the real client IP from req.ip (Cloudflare sets this via
// trust proxy correctly). Without this, the limiter uses the shared Cloudflare
// edge IP — 5 logins/min across every user on the site.
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 20 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? req.socket.remoteAddress ?? 'unknown',
  message: { success: false, message: 'Too many requests', error: { code: 'RATE_LIMITED' } },
});

// Dedicated limiter for OTP generation (kept for reference; routes are disabled below)
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? req.socket.remoteAddress ?? 'unknown',
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait a few minutes before trying again.',
    error: { code: 'RATE_LIMITED' },
  },
});

// OTP Sign-In has been removed from the product. These routes return 410 Gone
// to inform any cached clients that the feature is no longer available.
// The backend service code and database tables are preserved for data integrity.
const otpDisabled = (_req: any, res: any) =>
  res.status(410).json({
    success: false,
    message: 'Phone OTP sign-in has been discontinued. Please use Google Sign-In or email & password.',
    error: { code: 'FEATURE_DISABLED' },
  });

router.post('/register', authLimiter, ...authCtrl.register);
router.post('/login', authLimiter, ...authCtrl.login);
router.post('/google', authLimiter, ...authCtrl.googleLogin);
router.post('/otp/request', otpLimiter, otpDisabled);
router.post('/otp/verify', authLimiter, otpDisabled);
router.post('/refresh', authLimiter, authCtrl.refresh);
router.post('/logout', authLimiter, authCtrl.logout);
router.get('/me', requireAuth, authCtrl.me);

export default router;
