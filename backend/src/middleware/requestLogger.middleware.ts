// backend/src/middleware/requestLogger.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { metricsService } from '../services/metrics.service.js';

const SLOW_REQUEST_THRESHOLD_MS = Number(process.env.SLOW_REQUEST_THRESHOLD_MS) || 1000;

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = performance.now();

  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - startTime);
    const statusCode = res.statusCode;
    const route = req.originalUrl || req.url;
    const method = req.method;
    const requestId = req.requestId;

    // Record request into in-memory operational metrics
    metricsService.recordRequest(statusCode, durationMs);

    const logMeta = {
      requestId,
      method,
      route,
      statusCode,
      durationMs,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    if (durationMs >= SLOW_REQUEST_THRESHOLD_MS) {
      logger.warn(`[SLOW_REQUEST] ${method} ${route} took ${durationMs}ms`, {
        ...logMeta,
        isSlow: true,
        thresholdMs: SLOW_REQUEST_THRESHOLD_MS,
      });
    } else if (statusCode >= 500) {
      // 5xx errors are logged at error level
      logger.error(`[HTTP 5xx] ${method} ${route} finished with ${statusCode} in ${durationMs}ms`, logMeta);
    } else {
      // Normal request log
      logger.info(`${method} ${route} ${statusCode} ${durationMs}ms`, logMeta);
    }
  });

  next();
}
