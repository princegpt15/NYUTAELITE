// src/middleware/admin.middleware.ts
import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { AuthRequest } from './auth.middleware.js';

/** Middleware that ensures the request is made by an admin user */
export const requireAdmin = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new UnauthorizedError('Missing Authorization header');
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    if (!payload) throw new UnauthorizedError('Invalid token');
    // Attach user info to request (same as auth middleware)
    req.user = { id: payload.sub, role: payload.role };
    if (payload.role !== 'ADMIN') {
      throw new ForbiddenError('Admin privileges required');
    }
    next();
    return; // explicit return
  } catch (err) {
    next(err);
    return; // explicit return
  }
};
