import { format } from 'date-fns';
import crypto from 'crypto';

/**
 * Generates a human‑readable unique order number.
 * Example: NYUTA-20231002-AB12CD
 * Uses current date and a short random hex string.
 */
export function generateOrderNumber(): string {
  const datePart = format(new Date(), 'yyyyMMdd');
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `NYUTA-${datePart}-${randomPart}`;
}
