// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // Default to 500 if status not set
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  // In production we never leak stack traces
  const response: any = {
    success: false,
    message,
    error: { code },
  };

  // Optionally include validation details
  if (err.details) {
    response.error.details = err.details;
  }

  res.status(status).json(response);
}
