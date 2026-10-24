// src/services/auth.service.ts
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../lib/prisma.js';
import { RegisterBody, LoginBody, AuthResponse } from '../types/auth.types.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { normalizePhoneNumber, maskPhoneNumber } from '../utils/phone.js';
import { getSmsProvider } from './sms/sms.service.js';
import { env } from '../config/env.js';
import { User } from '@prisma/client';

let googleClient: OAuth2Client | null = null;
function getGoogleClient(): OAuth2Client {
  if (!env.GOOGLE_CLIENT_ID) {
    const err: any = new Error('Google Sign-In is not configured on the server. Please set GOOGLE_CLIENT_ID.');
    err.statusCode = 503;
    err.code = 'GOOGLE_AUTH_NOT_CONFIGURED';
    throw err;
  }
  if (!googleClient) {
    googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }
  return googleClient;
}

/**
 * Register a new user with email & password.
 */
export async function register(body: RegisterBody) {
  const { name, email, phone, password } = body;
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
 * Login existing user with email & password.
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
 * Authenticate or register using a verified Google ID token.
 */
export async function googleAuth(idToken: string) {
  if (!idToken || typeof idToken !== 'string') {
    const err: any = new Error('Google token credential is required');
    err.statusCode = 400;
    err.code = 'INVALID_CREDENTIAL';
    throw err;
  }

  const client = getGoogleClient();

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch {
    const err: any = new Error('Invalid or expired Google credential');
    err.statusCode = 401;
    err.code = 'INVALID_GOOGLE_TOKEN';
    throw err;
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    const err: any = new Error('Incomplete claims in Google token');
    err.statusCode = 401;
    err.code = 'MALFORMED_GOOGLE_TOKEN';
    throw err;
  }

  const googleSub = payload.sub;
  const email = payload.email.toLowerCase().trim();
  const name = payload.name || payload.given_name || email.split('@')[0];
  const emailVerified = Boolean(payload.email_verified);

  if (!emailVerified) {
    const err: any = new Error('Google account email is not verified. Please verify your email with Google first.');
    err.statusCode = 403;
    err.code = 'EMAIL_NOT_VERIFIED';
    throw err;
  }

  let user = await prisma.user.findUnique({
    where: { googleId: googleSub },
  });

  if (user) {
    if (!user.isVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }
  } else {
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId: googleSub,
          isVerified: true,
          ...(existingByEmail.name ? {} : { name }),
        },
      });
    } else {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await hashPassword(randomPassword);

      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId: googleSub,
          passwordHash,
          role: 'CUSTOMER',
          isVerified: true,
        },
      });
    }
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };

  return { accessToken, refreshToken, user: safeUser } as AuthResponse;
}

/**
 * Request a 6-digit OTP to be delivered via SMS to a mobile number.
 */
export async function requestPhoneOtp(rawPhone: string, countryCode = '+91') {
  const norm = normalizePhoneNumber(rawPhone, countryCode);
  if (!norm.isValid) {
    const err: any = new Error(norm.error || 'Invalid phone number');
    err.statusCode = 400;
    err.code = 'INVALID_PHONE_NUMBER';
    throw err;
  }

  const phone = norm.normalized;

  // Check rate limiting / cooldown on existing record
  const existingOtp = await prisma.phoneOtp.findUnique({ where: { phone } });
  const now = new Date();

  if (existingOtp) {
    // 1. Resend cooldown: 60 seconds
    const timeSinceLastSent = now.getTime() - existingOtp.lastSentAt.getTime();
    if (timeSinceLastSent < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - timeSinceLastSent) / 1000);
      const err: any = new Error(`Please wait ${waitSeconds} seconds before requesting a new OTP.`);
      err.statusCode = 429;
      err.code = 'RESEND_COOLDOWN';
      err.retryAfter = waitSeconds;
      throw err;
    }

    // 2. Hourly rate limit: 5 requests per hour
    const windowElapsed = now.getTime() - existingOtp.windowStart.getTime();
    if (windowElapsed < 3600 * 1000) {
      if (existingOtp.requestCount >= 5) {
        const err: any = new Error('Too many OTP requests for this phone number. Please try again after 1 hour.');
        err.statusCode = 429;
        err.code = 'RATE_LIMIT_EXCEEDED';
        throw err;
      }
    }
  }

  // Generate cryptographically secure 6-digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString();
  const salt = crypto.randomBytes(16).toString('hex');
  const otpHash = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${phone}:${otp}:${salt}`)
    .digest('hex');

  // Dispatch OTP via SMS provider adapter
  const smsProvider = getSmsProvider();
  const sendResult = await smsProvider.sendOtp(phone, otp);

  if (!sendResult.success) {
    const err: any = new Error(sendResult.error || 'Failed to deliver OTP via SMS.');
    err.statusCode = 502;
    err.code = 'SMS_DELIVERY_FAILED';
    throw err;
  }

  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes validity
  const windowStart =
    existingOtp && now.getTime() - existingOtp.windowStart.getTime() < 3600 * 1000
      ? existingOtp.windowStart
      : now;
  const requestCount =
    existingOtp && now.getTime() - existingOtp.windowStart.getTime() < 3600 * 1000
      ? existingOtp.requestCount + 1
      : 1;

  await prisma.phoneOtp.upsert({
    where: { phone },
    create: {
      phone,
      otpHash,
      salt,
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
      lastSentAt: now,
      windowStart,
      requestCount,
    },
    update: {
      otpHash,
      salt,
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
      lastSentAt: now,
      windowStart,
      requestCount,
    },
  });

  return {
    phone: maskPhoneNumber(phone),
    formatted: norm.formatted,
    cooldownSeconds: 60,
    expiresInSeconds: 300,
  };
}

/**
 * Verify a 6-digit OTP submitted by a user and sign in / register account.
 */
export async function verifyPhoneOtp(rawPhone: string, submittedOtp: string, countryCode = '+91') {
  const norm = normalizePhoneNumber(rawPhone, countryCode);
  if (!norm.isValid) {
    const err: any = new Error(norm.error || 'Invalid phone number');
    err.statusCode = 400;
    err.code = 'INVALID_PHONE_NUMBER';
    throw err;
  }

  const phone = norm.normalized;
  const nationalNumber = norm.nationalNumber;

  if (!submittedOtp || !/^\d{6}$/.test(submittedOtp.trim())) {
    const err: any = new Error('Please enter a valid 6-digit verification code.');
    err.statusCode = 400;
    err.code = 'INVALID_OTP_FORMAT';
    throw err;
  }

  const cleanOtp = submittedOtp.trim();

  const record = await prisma.phoneOtp.findUnique({ where: { phone } });
  if (!record) {
    const err: any = new Error('No active OTP found or code has expired. Please request a new OTP.');
    err.statusCode = 400;
    err.code = 'OTP_NOT_FOUND';
    throw err;
  }

  const now = new Date();
  if (now > record.expiresAt) {
    await prisma.phoneOtp.delete({ where: { id: record.id } }).catch(() => {});
    const err: any = new Error('This verification code has expired. Please request a new OTP.');
    err.statusCode = 400;
    err.code = 'OTP_EXPIRED';
    throw err;
  }

  if (record.attempts >= record.maxAttempts) {
    await prisma.phoneOtp.delete({ where: { id: record.id } }).catch(() => {});
    const err: any = new Error('Maximum verification attempts exceeded. Please request a new OTP.');
    err.statusCode = 400;
    err.code = 'MAX_ATTEMPTS_EXCEEDED';
    throw err;
  }

  // Validate OTP with timing-safe HMAC compare
  const computedHash = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${phone}:${cleanOtp}:${record.salt}`)
    .digest('hex');

  const matches = crypto.timingSafeEqual(
    Buffer.from(computedHash, 'hex'),
    Buffer.from(record.otpHash, 'hex')
  );

  if (!matches) {
    const newAttempts = record.attempts + 1;
    if (newAttempts >= record.maxAttempts) {
      await prisma.phoneOtp.delete({ where: { id: record.id } }).catch(() => {});
      const err: any = new Error('Maximum verification attempts exceeded. Please request a new OTP.');
      err.statusCode = 400;
      err.code = 'MAX_ATTEMPTS_EXCEEDED';
      throw err;
    }

    await prisma.phoneOtp.update({
      where: { id: record.id },
      data: { attempts: newAttempts },
    });

    const remaining = record.maxAttempts - newAttempts;
    const err: any = new Error(
      `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
    );
    err.statusCode = 400;
    err.code = 'INVALID_OTP';
    err.remainingAttempts = remaining;
    throw err;
  }

  // Successfully verified! Invalidate OTP immediately to prevent reuse
  await prisma.phoneOtp.delete({ where: { id: record.id } }).catch(() => {});

  // Find existing user by normalized phone OR legacy national 10-digit number
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone },
        { phone: nationalNumber },
        { phone: `+91 ${nationalNumber}` },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  let isNewUser = false;
  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        phone,
        phoneVerified: true,
        isVerified: true,
      },
    });
  } else {
    isNewUser = true;
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = await hashPassword(randomPassword);

    user = await prisma.user.create({
      data: {
        phone,
        phoneVerified: true,
        isVerified: true,
        role: 'CUSTOMER',
        passwordHash,
      },
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };

  return {
    accessToken,
    refreshToken,
    user: safeUser,
    isNewUser,
  } as AuthResponse;
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
