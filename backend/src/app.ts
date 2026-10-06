// src/app.ts
import express, { Request, Response } from 'express';
import prisma from './lib/prisma.js';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import addressRoutes from './routes/address.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Basic middlewares
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(helmet());
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

// Global rate limiter (e.g., 100 req per 15 min in prod, higher in dev)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 100 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests', error: { code: 'RATE_LIMITED' } },
});
app.use(globalLimiter);

// Health check endpoints (supports both root /health and /api/health)
const healthHandler = async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, message: 'NYUTA ELITE API is running', env: env.NODE_ENV });
  } catch (_e) {
    res.status(500).json({ success: false, message: 'Database connection error', error: { code: 'DB_ERROR' } });
  }
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Not Found', error: { code: 'NOT_FOUND' } });
});

// Central error handler
app.use(errorHandler);

export default app;
