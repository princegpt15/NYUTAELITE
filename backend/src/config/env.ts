import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT) || 5000,
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? '',
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ?? '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ?? '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  RAZORPAY_ACCOUNT_ID: process.env.RAZORPAY_ACCOUNT_ID ?? '',
  RAZORPAY_MERCHANT_ID: process.env.RAZORPAY_MERCHANT_ID ?? '',
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER ?? 'mock',
  EMAIL_FROM: process.env.EMAIL_FROM ?? 'NYUTA ELITE MAKHANA <orders@nutyaelite.com>',
  EMAIL_API_KEY: process.env.EMAIL_API_KEY ?? '',
  EMAIL_API_URL: process.env.EMAIL_API_URL ?? '',
  WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER ?? 'disabled',
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN ?? '',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID ?? '',
  APP_VERSION: process.env.NYUTA_ELITE_VERSION ?? '0.17.0',
};
