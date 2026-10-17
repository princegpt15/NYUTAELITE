// backend/src/app.ts
import express, { Request, Response } from 'express';
import prisma from './lib/prisma.js';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import { requestLoggerMiddleware } from './middleware/requestLogger.middleware.js';
import { healthService } from './services/health.service.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import addressRoutes from './routes/address.routes.js';
import { paymentObservabilityMiddleware } from './middleware/paymentObservability.middleware.js';
import paymentRoutes from './routes/payment.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import adminRoutes from './routes/admin.routes.js';
import retentionRoutes from './routes/retention.routes.js';
import growthRoutes from './routes/growth.routes.js';
import bulkEnquiryRoutes from './routes/bulkEnquiry.routes.js';
import { noStoreCacheMiddleware, publicCatalogCacheMiddleware } from './middleware/cacheControl.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { notificationService } from './services/notification/notification.service.js';

const app = express();
app.set('trust proxy', 1); // Trust Railway edge proxy (single hop)

// 1. Request correlation ID middleware (must be first)
app.use(requestIdMiddleware);

// 2. Request performance & structured logging middleware
app.use(requestLoggerMiddleware);

// 3. Body parser with rawBody preservation for Razorpay webhook verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// 4. Security headers
app.use(helmet());

// 5. CORS policy
const prodOrigin = env.FRONTEND_URL.replace(/\/+$/, '');
const allowedOrigins = [prodOrigin];
const standardOrigins = [
  'https://nutyaelite.com',
  'https://www.nutyaelite.com',
  'https://nyutaelite.com',
  'https://www.nyutaelite.com',
];
for (const origin of standardOrigins) {
  if (!allowedOrigins.includes(origin)) {
    allowedOrigins.push(origin);
  }
}
if (env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173');
  allowedOrigins.push('http://localhost:3000');
}

// Allow Cloudflare Pages preview deployments (*.nyutaelite.pages.dev)
// These are staging/preview builds — credentials are still scoped per-origin.
const cfPagesPreviewPattern = /^https:\/\/[a-z0-9-]+\.nyutaelite\.pages\.dev$/;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (cfPagesPreviewPattern.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// 6. Global rate limiter
// Key generator: when behind Cloudflare Pages, the real client IP is in
// X-Forwarded-For (Railway populates this from Cloudflare's CF-Connecting-IP).
// Using req.ip after trust proxy correctly returns the real user IP.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // 1000 requests per 15 minutes per real client IP.
  // The previous value of 100 was far too low: authenticated page loads
  // issue 5–10 API requests each, so a single user navigating the account
  // and wishlist pages could exhaust the shared Cloudflare-IP quota in one session.
  max: env.NODE_ENV === 'production' ? 1000 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  // Use the real client IP. With trust proxy = 1, req.ip is the first
  // X-Forwarded-For value, which Cloudflare sets to the actual visitor IP.
  keyGenerator: (req) => req.ip ?? req.socket.remoteAddress ?? 'unknown',
  message: { success: false, message: 'Too many requests', error: { code: 'RATE_LIMITED' } },
});
app.use(globalLimiter);

// 7. Health & Observability endpoints
const basicHealthHandler = (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'nyuta-elite-api',
    version: env.APP_VERSION,
    environment: env.NODE_ENV,
  });
};

app.get('/health', basicHealthHandler);
app.get('/api/health', basicHealthHandler);

// Liveness probe: verifies process is alive (does NOT touch DB)
app.get('/api/health/live', (_req: Request, res: Response) => {
  res.json(healthService.getLiveness());
});

// Readiness probe: verifies DB connectivity and configuration (returns 503 if DB fails)
app.get('/api/health/ready', async (_req: Request, res: Response) => {
  const readiness = await healthService.getReadiness();
  res.status(readiness.statusCode).json(readiness.payload);
});

// 8. API routes
app.use('/api/auth', noStoreCacheMiddleware, authRoutes);
app.use('/api/products', publicCatalogCacheMiddleware, productRoutes);
app.use('/api/cart', noStoreCacheMiddleware, cartRoutes);
app.use('/api/orders', noStoreCacheMiddleware, orderRoutes);
app.use('/api/addresses', noStoreCacheMiddleware, addressRoutes);

// Payment notification reconciliation hook
app.use('/api/payments', (req: Request, res: Response, next) => {
  res.on('finish', () => {
    if (req.method === 'POST' && res.statusCode >= 200 && res.statusCode < 300) {
      Promise.resolve()
        .then(async () => {
          const directOrderId = typeof req.body?.orderId === 'string' ? req.body.orderId : null;
          if (directOrderId) {
            await notificationService.reconcilePaymentNotificationsForOrder(directOrderId);
            return;
          }
          const rzpOrderId =
            req.body?.razorpay_order_id ||
            req.body?.payload?.payment?.entity?.order_id ||
            req.body?.payload?.order?.entity?.id ||
            null;
          if (typeof rzpOrderId === 'string' && rzpOrderId) {
            const matchedOrder = await prisma.order.findFirst({
              where: { razorpayOrderId: rzpOrderId },
              select: { id: true },
            });
            if (matchedOrder) {
              await notificationService.reconcilePaymentNotificationsForOrder(matchedOrder.id);
            }
          }
        })
        .catch(() => {});
    }
  });
  next();
});
app.use('/api/payments', paymentObservabilityMiddleware);
app.use('/api/payments', noStoreCacheMiddleware, paymentRoutes);
app.use('/api/coupons', noStoreCacheMiddleware, couponRoutes);
app.use('/api/admin', noStoreCacheMiddleware, adminRoutes);
app.use('/api', noStoreCacheMiddleware, retentionRoutes);
app.use('/api', noStoreCacheMiddleware, growthRoutes);
app.use('/api/bulk-enquiry', noStoreCacheMiddleware, bulkEnquiryRoutes);

// 9. 404 handler with requestId
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    error: { code: 'NOT_FOUND' },
    requestId: req.requestId,
  });
});

// 10. Central error handler
app.use(errorHandler);

export default app;
