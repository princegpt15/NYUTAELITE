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
import { noStoreCacheMiddleware, publicCatalogCacheMiddleware } from './middleware/cacheControl.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { notificationService } from './services/notification/notification.service.js';

const app = express();

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
if (prodOrigin === 'https://nutyaelite.com') {
  allowedOrigins.push('https://www.nutyaelite.com');
} else if (prodOrigin === 'https://www.nutyaelite.com') {
  allowedOrigins.push('https://nutyaelite.com');
}
if (env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173');
  allowedOrigins.push('http://localhost:3000');
}
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// 6. Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 100 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
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
