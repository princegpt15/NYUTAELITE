// backend/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { errorMonitor } from '../services/errorMonitor.service.js';
import { metricsService } from '../services/metrics.service.js';
import { env } from '../config/env.js';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId;

  // Default to 500 if status not set
  let status = err.statusCode || err.status || 500;
  if (err.name === 'ZodError') {
    status = 400;
  }
  if (
    status === 401 &&
    !err.code?.includes('UNAUTHORIZED') &&
    !err.code?.includes('INVALID_') &&
    !err.code?.includes('AUTH') &&
    err.name !== 'UnauthorizedError'
  ) {
    status = 500;
  }

  const rawMessage = err.message || 'Internal Server Error';
  const code = err.code || (err.name === 'ZodError' ? 'VALIDATION_ERROR' : status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST');

  // Sanitize 500 messages in production to prevent leaking SQL / Prisma / system internals
  const isInternal = status >= 500;
  const isPrismaError =
    err.name?.includes('Prisma') ||
    rawMessage.includes('prisma') ||
    rawMessage.includes('SELECT') ||
    rawMessage.includes('column') ||
    rawMessage.includes('constraint');

  let safeMessage = rawMessage;
  if (isInternal && (isPrismaError || env.NODE_ENV === 'production')) {
    safeMessage = 'Internal server error';
  }

  // Record operational metrics and capture exception
  metricsService.recordError({
    timestamp: new Date().toISOString(),
    requestId,
    message: safeMessage,
    code,
    statusCode: status,
  });

  errorMonitor.captureException(err, {
    requestId,
    route: req.originalUrl || req.url,
    method: req.method,
    statusCode: status,
    code,
  });

  // Log structured server-side error with stack trace (kept on server only)
  logger.error(`[ErrorHandler] ${req.method} ${req.originalUrl || req.url} -> ${status} [${code}]`, {
    requestId,
    route: req.originalUrl || req.url,
    method: req.method,
    statusCode: status,
    code,
    errorMessage: rawMessage,
    stack: err.stack,
  });

  const response: any = {
    success: false,
    message: safeMessage,
    error: { code },
  };

  if (requestId) {
    response.requestId = requestId;
  }

  // Preserve validation details if attached
  if (err.details) {
    response.error.details = err.details;
  }
  if (err.issues) {
    response.error.issues = err.issues;
  }

  res.status(status).json(response);
}
