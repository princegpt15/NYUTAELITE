// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

/**
 * Require a valid JWT access token.
 * Attaches `req.user` with minimal fields.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing Authorization header', error: { code: 'UNAUTHORIZED' } });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Invalid token', error: { code: 'UNAUTHORIZED' } });
  }
  // Attach user info to request
  req.user = { id: payload.sub, role: payload.role };
  next();
  return; // ensure explicit return
}

/**
 * Require ADMIN role – must be used after `requireAuth`.
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated', error: { code: 'UNAUTHORIZED' } });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden – admin only', error: { code: 'FORBIDDEN' } });
  }
  next();
  return; // ensure explicit return
}

