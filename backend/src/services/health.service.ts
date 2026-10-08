// backend/src/services/health.service.ts
import prisma from '../lib/prisma.js';
import { env } from '../config/env.js';
import { metricsService } from './metrics.service.js';
import { logger } from '../utils/logger.js';

export interface DatabaseHealthResult {
  status: 'healthy' | 'unhealthy';
  latencyMs: number | null;
  lastCheckedAt: string;
  error?: string;
}

export interface SystemHealthData {
  success: boolean;
  timestamp: string;
  overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  application: {
    service: string;
    version: string;
    environment: string;
    status: 'healthy';
    uptimeSeconds: number;
    nodeVersion: string;
    pid: number;
    memoryUsageMb: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
    };
  };
  database: {
    status: 'healthy' | 'warning' | 'critical';
    provider: 'postgresql';
    latencyMs: number | null;
    lastCheckedAt: string;
    connectionPool: 'active';
  };
  api: {
    status: 'healthy' | 'warning' | 'critical';
    totalRequests: number;
    statusCodes: Record<string, number>;
    serverErrorCount: number;
    errorRatePercent: number;
    slowRequestsCount: number;
    p50LatencyMs: number | null;
    p95LatencyMs: number | null;
    lastError: {
      timestamp: string;
      message: string;
      code?: string;
      requestId?: string;
    } | null;
  };
  orders: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    total: number;
  };
  payments: {
    pending: number;
    captured: number;
    failed: number;
    refunded: number;
    total: number;
    gateway: {
      provider: 'razorpay';
      webhooksProcessed: number;
      webhookFailures: number;
    };
  };
  notifications: {
    status: 'healthy' | 'warning' | 'critical';
    total: number;
    pending: number;
    sending: number;
    sent: number;
    failed: number;
    retrying: number;
    failureRatePercent: number;
    lastFailure: {
      timestamp: string;
      recipientMasked: string;
      reason: string;
    } | null;
    providers: {
      email: string;
      whatsapp: string;
    };
  };
}

class HealthService {
  private lastDbCheck: DatabaseHealthResult = {
    status: 'healthy',
    latencyMs: null,
    lastCheckedAt: new Date().toISOString(),
  };

  /**
   * Check database connectivity via lightweight query with latency measurement.
   * Safe timeout implemented via Promise.race. Never leaks connection strings.
   */
  async checkDatabaseHealth(timeoutMs = 5000): Promise<DatabaseHealthResult> {
    const startTime = performance.now();
    try {
      const queryPromise = prisma.$queryRaw`SELECT 1`;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DATABASE_TIMEOUT')), timeoutMs)
      );

      await Promise.race([queryPromise, timeoutPromise]);
      const latencyMs = Math.round(performance.now() - startTime);

      this.lastDbCheck = {
        status: 'healthy',
        latencyMs,
        lastCheckedAt: new Date().toISOString(),
      };
      return this.lastDbCheck;
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      const isTimeout = err?.message === 'DATABASE_TIMEOUT';
      const safeError = isTimeout ? 'Database health check timed out' : 'Database connection unavailable';

      logger.error('[HealthService] Database health check failed', {
        latencyMs,
        error: err?.message,
      });

      this.lastDbCheck = {
        status: 'unhealthy',
        latencyMs,
        lastCheckedAt: new Date().toISOString(),
        error: safeError,
      };
      return this.lastDbCheck;
    }
  }

  /**
   * Process liveness check. Does NOT touch the database.
   */
  getLiveness() {
    return {
      success: true,
      status: 'ok',
      service: 'nyuta-elite-api',
      version: env.APP_VERSION,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Process readiness check. Verifies database connectivity and essential configuration.
   */
  async getReadiness() {
    const dbHealth = await this.checkDatabaseHealth();
    const isConfigValid = Boolean(env.DATABASE_URL && env.JWT_SECRET);

    if (dbHealth.status !== 'healthy' || !isConfigValid) {
      return {
        isReady: false,
        statusCode: 503,
        payload: {
          success: false,
          status: 'unhealthy',
          checks: {
            database: dbHealth.status === 'healthy' ? 'ok' : 'error',
            configuration: isConfigValid ? 'ok' : 'error',
          },
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      isReady: true,
      statusCode: 200,
      payload: {
        success: true,
        status: 'ready',
        checks: {
          database: 'ok',
          configuration: 'ok',
          latencyMs: dbHealth.latencyMs,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Comprehensive operational system health report for authenticated admins.
   * Pulls real counts from PostgreSQL and in-memory telemetry without fabricating numbers.
   */
  async getSystemHealth(): Promise<SystemHealthData> {
    const dbHealth = await this.checkDatabaseHealth();
    const apiStats = metricsService.getApiStats();
    const paymentMetrics = metricsService.getPaymentStats();
    const mem = process.memoryUsage();

    // Query real order status aggregates
    const orderCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    const orderMap: Record<string, number> = {};
    orderCounts.forEach((c) => {
      orderMap[c.status] = c._count.id;
    });

    const ordersSummary = {
      pending: orderMap['PENDING'] || 0,
      confirmed: orderMap['CONFIRMED'] || 0,
      processing: orderMap['PROCESSING'] || 0,
      shipped: orderMap['SHIPPED'] || 0,
      delivered: orderMap['DELIVERED'] || 0,
      cancelled: orderMap['CANCELLED'] || 0,
      total: Object.values(orderMap).reduce((a, b) => a + b, 0),
    };

    // Query real payment status aggregates
    const paymentCounts = await prisma.payment.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    const paymentMap: Record<string, number> = {};
    paymentCounts.forEach((c) => {
      paymentMap[c.status] = c._count.id;
    });

    const paymentsSummary = {
      pending: paymentMap['PENDING'] || 0,
      captured: paymentMap['CAPTURED'] || 0,
      failed: paymentMap['FAILED'] || 0,
      refunded: paymentMap['REFUNDED'] || 0,
      total: Object.values(paymentMap).reduce((a, b) => a + b, 0),
      gateway: {
        provider: 'razorpay' as const,
        webhooksProcessed: paymentMetrics.webhooks.processed,
        webhookFailures: paymentMetrics.webhooks.verificationFailed + paymentMetrics.webhooks.processingFailed,
      },
    };

    // Query real notification status aggregates
    const notifCounts = await prisma.notification.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    const notifMap: Record<string, number> = {};
    notifCounts.forEach((c) => {
      notifMap[c.status] = c._count.id;
    });

    const retryingCount = await prisma.notification.count({
      where: {
        OR: [
          { status: 'SENDING' },
          { status: 'PENDING', attemptCount: { gt: 0 } },
        ],
      },
    });

    const totalNotifs = Object.values(notifMap).reduce((a, b) => a + b, 0);
    const failedNotifs = notifMap['FAILED'] || 0;
    const notifFailureRate = totalNotifs > 0 ? Number(((failedNotifs / totalNotifs) * 100).toFixed(2)) : 0;

    const lastFailedRecord = await prisma.notification.findFirst({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        recipient: true,
        errorMessage: true,
      },
    });

    let notifStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (notifFailureRate > 10) {
      notifStatus = 'critical';
    } else if (notifFailureRate > 2 || retryingCount > 5) {
      notifStatus = 'warning';
    }

    let dbStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (dbHealth.status !== 'healthy') {
      dbStatus = 'critical';
    } else if (dbHealth.latencyMs && dbHealth.latencyMs > 500) {
      dbStatus = 'warning';
    }

    // Determine overall system health status
    let overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (dbStatus === 'critical' || apiStats.status === 'critical' || notifStatus === 'critical') {
      overallStatus = 'CRITICAL';
    } else if (dbStatus === 'warning' || apiStats.status === 'warning' || notifStatus === 'warning') {
      overallStatus = 'WARNING';
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      overallStatus,
      application: {
        service: 'nyuta-elite-api',
        version: env.APP_VERSION,
        environment: env.NODE_ENV,
        status: 'healthy',
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        pid: process.pid,
        memoryUsageMb: {
          rss: Math.round(mem.rss / (1024 * 1024)),
          heapUsed: Math.round(mem.heapUsed / (1024 * 1024)),
          heapTotal: Math.round(mem.heapTotal / (1024 * 1024)),
        },
      },
      database: {
        status: dbStatus,
        provider: 'postgresql',
        latencyMs: dbHealth.latencyMs,
        lastCheckedAt: dbHealth.lastCheckedAt,
        connectionPool: 'active',
      },
      api: {
        status: apiStats.status,
        totalRequests: apiStats.totalRequests,
        statusCodes: apiStats.statusCodes,
        serverErrorCount: apiStats.serverErrorCount,
        errorRatePercent: apiStats.errorRatePercent,
        slowRequestsCount: apiStats.slowRequestsCount,
        p50LatencyMs: apiStats.p50LatencyMs,
        p95LatencyMs: apiStats.p95LatencyMs,
        lastError: apiStats.lastError,
      },
      orders: ordersSummary,
      payments: paymentsSummary,
      notifications: {
        status: notifStatus,
        total: totalNotifs,
        pending: notifMap['PENDING'] || 0,
        sending: notifMap['SENDING'] || 0,
        sent: notifMap['SENT'] || 0,
        failed: failedNotifs,
        retrying: retryingCount,
        failureRatePercent: notifFailureRate,
        lastFailure: lastFailedRecord
          ? {
              timestamp: lastFailedRecord.createdAt.toISOString(),
              recipientMasked: lastFailedRecord.recipient.replace(/(?<=^.{2}).(?=.*@)/g, '*'),
              reason: lastFailedRecord.errorMessage || 'Unknown delivery failure',
            }
          : null,
        providers: {
          email: env.EMAIL_PROVIDER,
          whatsapp: env.WHATSAPP_PROVIDER,
        },
      },
    };
  }
}

export const healthService = new HealthService();
