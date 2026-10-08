// backend/src/middleware/requestId.middleware.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const SAFE_REQUEST_ID_REGEX = /^[a-zA-Z0-9_\-\.]{8,64}$/;

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Ensures every incoming request has a cryptographically safe correlation ID.
 * Safely reuses valid client-supplied X-Request-ID or generates a new randomUUID.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incomingId = req.headers['x-request-id'];

  let requestId: string;
  if (typeof incomingId === 'string' && SAFE_REQUEST_ID_REGEX.test(incomingId.trim())) {
    requestId = incomingId.trim();
  } else {
    requestId = crypto.randomUUID();
  }

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
}
