// backend/src/middleware/cacheControl.middleware.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Strict no-store cache policy for sensitive/financial/authenticated routes.
 * Prevents browser disk caching, shared proxies, and CDNs from storing private customer data.
 */
export function noStoreCacheMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}

/**
 * Public catalog cache policy.
 * Allows fast browser & edge CDN caching for public read-only catalog with quick revalidation.
 */
export function publicCatalogCacheMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
}
