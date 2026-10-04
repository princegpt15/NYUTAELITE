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
  async (req: Request, res: Response, next: any) => {
    try {
      const body = req.body as RegisterBody;
      const result = await authService.register(body);
      res.status(201).json({ success: true, message: 'User registered', data: result });
    } catch (err) {
      next(err);
    }
  },
];

export const login = [
  validate(loginSchema, 'body'),
  async (req: Request, res: Response, next: any) => {
    try {
      const body = req.body as LoginBody;
      const result = await authService.login(body);
      res.status(200).json({ success: true, message: 'Logged in', data: result });
    } catch (err) {
      next(err);
    }
  },
];

export const refresh = async (req: Request, res: Response, next: any) => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    const result = await authService.refreshToken(refreshToken);
    res.status(200).json({ success: true, message: 'Token refreshed', data: result });
  } catch (err) {
    next(err);
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Logged out' });
};

export const me = async (req: Request, res: Response, next: any) => {
  try {
    const user = await authService.getMe((req as any).user.id);
    res.status(200).json({ success: true, message: 'User profile', data: user });
  } catch (err) {
    next(err);
  }
};
