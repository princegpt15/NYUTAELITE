// backend/src/utils/logger.ts
import { env } from '../config/env.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogRecord {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  requestId?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  [key: string]: any;
}

// Patterns of sensitive keys to redact from logs
const SENSITIVE_KEY_REGEX =
  /(password|token|secret|authorization|signature|card|cvv|keysecret|webhooksecret|accesstoken|refreshtoken|cookie|apikey)/i;

/**
 * Recursively sanitize log metadata to prevent leaking secrets, credentials, or PII.
 */
export function sanitizeLogData(data: any, depth = 0): any {
  if (depth > 6 || data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Redact JWT patterns
    if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(data)) {
      return '[REDACTED_JWT]';
    }
    // Don't redact standard safe strings: URL paths, ISO timestamps, or UUIDs
    if (
      data.startsWith('/') ||
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(data) ||
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)
    ) {
      return data;
    }

    // Redact Razorpay key secret, webhook secret, or high-entropy credentials
    if (
      data.startsWith('rzp_') ||
      data.startsWith('whsec_') ||
      data.startsWith('secret_') ||
      (data.length >= 24 && /^[a-zA-Z0-9+/=]{24,}$/.test(data))
    ) {
      return '[REDACTED_SECRET]';
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, depth + 1));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeLogData(value, depth + 1);
      }
    }
    return sanitized;
  }

  return data;
}

class Logger {
  private serviceName = 'nyuta-elite-api';

  private output(record: LogRecord) {
    const isProduction = env.NODE_ENV === 'production';

    // In production, suppress noisy debug logs
    if (isProduction && record.level === 'debug') {
      return;
    }

    const jsonString = JSON.stringify(record);

    if (record.level === 'error') {
      process.stderr.write(`${jsonString}\n`);
    } else {
      process.stdout.write(`${jsonString}\n`);
    }
  }

  debug(message: string, meta: Record<string, any> = {}) {
    this.log('debug', message, meta);
  }

  info(message: string, meta: Record<string, any> = {}) {
    this.log('info', message, meta);
  }

  warn(message: string, meta: Record<string, any> = {}) {
    this.log('warn', message, meta);
  }

  error(message: string, meta: Record<string, any> = {}) {
    this.log('error', message, meta);
  }

  log(level: LogLevel, message: string, meta: Record<string, any> = {}) {
    const sanitizedMeta = sanitizeLogData(meta);

    const record: LogRecord = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...sanitizedMeta,
    };

    this.output(record);
  }
}

export const logger = new Logger();
