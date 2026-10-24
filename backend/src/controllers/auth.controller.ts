// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import {
  RegisterBody,
  LoginBody,
  GoogleLoginBody,
  RequestOtpBody,
  VerifyOtpBody,
} from '../types/auth.types.js';
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

const googleSchema = z.object({
  credential: z.string().min(1, 'Google credential token is required'),
});

const requestOtpSchema = z.object({
  phone: z.string().min(8, 'Mobile number is required').max(18),
  countryCode: z.string().optional().default('+91'),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(8, 'Mobile number is required').max(18),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit number'),
  countryCode: z.string().optional().default('+91'),
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

export const googleLogin = [
  validate(googleSchema, 'body'),
  async (req: Request, res: Response, next: any) => {
    try {
      const { credential } = req.body as GoogleLoginBody;
      const result = await authService.googleAuth(credential);
      res.status(200).json({ success: true, message: 'Logged in with Google', data: result });
    } catch (err) {
      next(err);
    }
  },
];

export const requestOtp = [
  validate(requestOtpSchema, 'body'),
  async (req: Request, res: Response, next: any) => {
    try {
      const { phone, countryCode } = req.body as RequestOtpBody;
      const result = await authService.requestPhoneOtp(phone, countryCode);
      res.status(200).json({
        success: true,
        message: 'Verification OTP sent successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
];

export const verifyOtp = [
  validate(verifyOtpSchema, 'body'),
  async (req: Request, res: Response, next: any) => {
    try {
      const { phone, otp, countryCode } = req.body as VerifyOtpBody;
      const result = await authService.verifyPhoneOtp(phone, otp, countryCode);
      res.status(200).json({
        success: true,
        message: result.isNewUser ? 'Account registered successfully' : 'Signed in successfully',
        data: result,
      });
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
