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

router.post('/register', authLimiter, ...authCtrl.register);
router.post('/login', authLimiter, ...authCtrl.login);
router.post('/refresh', authLimiter, authCtrl.refresh);
router.post('/logout', authLimiter, authCtrl.logout);
router.get('/me', requireAuth, authCtrl.me);

export default router;
