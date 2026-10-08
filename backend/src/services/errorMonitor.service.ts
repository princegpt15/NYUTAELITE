// backend/src/services/errorMonitor.service.ts
import { logger } from '../utils/logger.js';

export interface IErrorMonitor {
  captureException(error: Error | any, context?: Record<string, any>): string;
  captureMessage(message: string, level?: 'info' | 'warn' | 'error', context?: Record<string, any>): string;
  setContext(key: string, data: Record<string, any>): void;
}

class ErrorMonitorService implements IErrorMonitor {
  private enabled: boolean;
  private provider: 'disabled' | 'console' | 'custom';
  private globalContext: Record<string, any> = {};

  constructor() {
    this.enabled = process.env.ERROR_MONITORING_ENABLED === 'true';
    this.provider = (process.env.ERROR_MONITOR_PROVIDER as any) || (this.enabled ? 'console' : 'disabled');
  }

  setContext(key: string, data: Record<string, any>): void {
    this.globalContext[key] = { ...(this.globalContext[key] || {}), ...data };
  }

  captureException(error: Error | any, context: Record<string, any> = {}): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const mergedContext = {
      errorId,
      ...this.globalContext,
      ...context,
      name: error?.name || 'Error',
      message: error?.message || String(error),
      code: error?.code,
    };

    if (this.provider === 'disabled') {
      return errorId;
    }

    logger.error(`[ErrorMonitor] Captured Exception: ${error?.message || error}`, {
      ...mergedContext,
      stack: error?.stack,
    });

    return errorId;
  }

  captureMessage(message: string, level: 'info' | 'warn' | 'error' = 'info', context: Record<string, any> = {}): string {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const mergedContext = {
      messageId,
      ...this.globalContext,
      ...context,
    };

    if (this.provider === 'disabled') {
      return messageId;
    }

    if (level === 'error') {
      logger.error(`[ErrorMonitor] ${message}`, mergedContext);
    } else if (level === 'warn') {
      logger.warn(`[ErrorMonitor] ${message}`, mergedContext);
    } else {
      logger.info(`[ErrorMonitor] ${message}`, mergedContext);
    }

    return messageId;
  }
}

export const errorMonitor = new ErrorMonitorService();
