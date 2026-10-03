// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { RegisterBody, LoginBody } from '../types/auth.types.js';
import { validate } from '../middleware/validate.middleware.js';
import { z } from 'zod';

// Zod schemas for request validation
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(5),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = [
  validate(registerSchema, 'body'),
  async (req: Request, res: Response) => {
    const body = req.body as RegisterBody;
    const result = await authService.register(body);
    return res.status(201).json({ success: true, message: 'User registered', data: result });
  },
];

export const login = [
  validate(loginSchema, 'body'),
  async (req: Request, res: Response) => {
    const body = req.body as LoginBody;
    const result = await authService.login(body);
    return res.status(200).json({ success: true, message: 'Logged in', data: result });
  },
];

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };
  const result = await authService.refreshToken(refreshToken);
  return res.status(200).json({ success: true, message: 'Token refreshed', data: result });
};

export const logout = async (_req: Request, res: Response) => {
  // In this minimal version we just respond – token revocation can be added later
  return res.status(200).json({ success: true, message: 'Logged out' });
};

export const me = async (req: Request, res: Response) => {
  // auth.middleware guarantees req.user
  const user = await authService.getMe((req as any).user.id);
  return res.status(200).json({ success: true, message: 'User profile', data: user });
};
