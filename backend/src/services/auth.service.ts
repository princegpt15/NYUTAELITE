// src/services/auth.service.ts
import prisma from '../lib/prisma.js';
import { RegisterBody, LoginBody, AuthResponse } from '../types/auth.types.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js'
import { User } from '@prisma/client';

/**
 * Register a new user.
 * Returns user data (no password hash) and tokens.
 */
export async function register(body: RegisterBody) {
  const { name, email, phone, password } = body;
  // Check duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err: any = new Error('Email already registered');
    err.statusCode = 409;
    err.code = 'EMAIL_EXISTS';
    throw err;
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: 'CUSTOMER',
    },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });
  const accessToken = generateAccessToken(user as User);
  const refreshToken = generateRefreshToken(user as User);
  return { accessToken, refreshToken, user } as AuthResponse;
}

/**
 * Login existing user.
 */
export async function login(body: LoginBody) {
  const { email, password } = body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err: any = new Error('Invalid credentials');
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }
  const pwdOk = await comparePassword(password, user.passwordHash);
  if (!pwdOk) {
    const err: any = new Error('Invalid credentials');
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const safeUser = { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
  return { accessToken, refreshToken, user: safeUser } as AuthResponse;
}

/**
 * Refresh access token using a valid refresh token.
 */
export async function refreshToken(refreshToken: string) {
  const payload = (await import('../utils/jwt.js')).verifyRefreshToken(refreshToken);
  if (!payload) {
    const err: any = new Error('Invalid refresh token');
    err.statusCode = 401;
    err.code = 'INVALID_REFRESH';
    throw err;
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    const err: any = new Error('User not found');
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  const accessToken = generateAccessToken(user);
  return { accessToken };
}

/**
 * Get current user profile (safe fields only).
 */
export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, updatedAt: true },
  });
  if (!user) {
    const err: any = new Error('User not found');
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  return user;
}
