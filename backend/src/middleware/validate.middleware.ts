// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Generic validation middleware.
 * Pass a Zod schema and optionally specify whether to validate `body`, `query` or `params`.
 */
export function validate(schema: ZodSchema<any>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = result.error.format();
      return res.status(422).json({
        success: false,
        message: 'Validation error',
        error: { code: 'VALIDATION_ERROR', details: errors },
      });
    }
    // replace the validated data (typed) back onto the request for downstream use
    (req as any)[source] = result.data;
    return next();
  };
}
