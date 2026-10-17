// backend/src/routes/bulkEnquiry.routes.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createBulkEnquiry } from '../controllers/bulkEnquiry.controller.js';

const router = Router();

// Apply dedicated rate limiter for public bulk enquiry submissions
const bulkEnquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === 'production' ? 10 : 200, // 10 enquiries per 15 min in prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many enquiry requests submitted from this IP. Please wait a few minutes or contact us directly on WhatsApp.',
    error: { code: 'RATE_LIMITED' },
  },
});

router.post('/', bulkEnquiryLimiter, createBulkEnquiry);

export default router;
