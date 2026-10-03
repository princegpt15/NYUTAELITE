// src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js'
import type { User } from '@prisma/client';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export function generateAccessToken(user: User): string {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function generateRefreshToken(user: User): string {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): { sub: string; role: string } | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { sub: string; role: string } | null {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as any;
  } catch {
    return null;
  }
}
