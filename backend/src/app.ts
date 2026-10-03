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
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Basic middlewares
app.use(express.json());
app.use(helmet());
const prodOrigin = env.FRONTEND_URL.replace(/\/+$/, '');
const allowedOrigins = [prodOrigin];
if (env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173');
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

// Global rate limiter (e.g., 100 req per 15 min)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests', error: { code: 'RATE_LIMITED' } },
});
app.use(globalLimiter);

// Health check
app.get('/api/health', async (_req: Request, res: Response) => {
  // simple DB ping (optional)
  try {

    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, message: 'NYUTA ELITE API is running' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database connection error', error: { code: 'DB_ERROR' } });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Not Found', error: { code: 'NOT_FOUND' } });
});

// Central error handler
app.use(errorHandler);

export default app;
