// backend/src/services/metrics.service.ts

interface RequestLatencyRecord {
  timestamp: number;
  durationMs: number;
}

interface LastErrorSummary {
  timestamp: string;
  requestId?: string;
  message: string;
  code?: string;
  statusCode?: number;
}

class MetricsService {
  private startTime = Date.now();
  private totalRequests = 0;
  private statusCodes: Record<string, number> = {
    '2xx': 0,
    '3xx': 0,
    '4xx': 0,
    '5xx': 0,
  };
  private slowRequestsCount = 0;
  private rollingLatencies: RequestLatencyRecord[] = [];
  private readonly MAX_LATENCY_SAMPLES = 500;

  // Payment operational counters
  private payments = {
    ordersCreated: 0,
    paymentsCaptured: 0,
    paymentsFailed: 0,
    refundsProcessed: 0,
  };

  // Webhook operational counters
  private webhooks = {
    received: 0,
    verified: 0,
    verificationFailed: 0,
    duplicates: 0,
    processed: 0,
    processingFailed: 0,
  };

  private lastError: LastErrorSummary | null = null;

  recordRequest(statusCode: number, durationMs: number): void {
    this.totalRequests++;

    if (statusCode >= 200 && statusCode < 300) {
      this.statusCodes['2xx'] = (this.statusCodes['2xx'] || 0) + 1;
    } else if (statusCode >= 300 && statusCode < 400) {
      this.statusCodes['3xx'] = (this.statusCodes['3xx'] || 0) + 1;
    } else if (statusCode >= 400 && statusCode < 500) {
      this.statusCodes['4xx'] = (this.statusCodes['4xx'] || 0) + 1;
    } else if (statusCode >= 500) {
      this.statusCodes['5xx'] = (this.statusCodes['5xx'] || 0) + 1;
    }

    if (durationMs > 1000) {
      this.slowRequestsCount++;
    }

    // Rolling latency tracking
    this.rollingLatencies.push({ timestamp: Date.now(), durationMs });
    if (this.rollingLatencies.length > this.MAX_LATENCY_SAMPLES) {
      this.rollingLatencies.shift();
    }
  }

  recordError(summary: LastErrorSummary): void {
    this.lastError = summary;
  }

  recordPaymentEvent(event: 'created' | 'captured' | 'failed' | 'refunded'): void {
    switch (event) {
      case 'created':
        this.payments.ordersCreated++;
        break;
      case 'captured':
        this.payments.paymentsCaptured++;
        break;
      case 'failed':
        this.payments.paymentsFailed++;
        break;
      case 'refunded':
        this.payments.refundsProcessed++;
        break;
    }
  }

  recordWebhookEvent(event: 'received' | 'verified' | 'verificationFailed' | 'duplicate' | 'processed' | 'processingFailed'): void {
    switch (event) {
      case 'received':
        this.webhooks.received++;
        break;
      case 'verified':
        this.webhooks.verified++;
        break;
      case 'verificationFailed':
        this.webhooks.verificationFailed++;
        break;
      case 'duplicate':
        this.webhooks.duplicates++;
        break;
      case 'processed':
        this.webhooks.processed++;
        break;
      case 'processingFailed':
        this.webhooks.processingFailed++;
        break;
    }
  }

  getApiStats() {
    const errorCount = (this.statusCodes['4xx'] || 0) + (this.statusCodes['5xx'] || 0);
    const serverErrorCount = this.statusCodes['5xx'] || 0;
    const errorRatePercent =
      this.totalRequests > 0 ? Number(((serverErrorCount / this.totalRequests) * 100).toFixed(2)) : 0;

    const sorted = [...this.rollingLatencies.map((r) => r.durationMs)].sort((a, b) => a - b);
    const p50 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.5)] : null;
    const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : null;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (errorRatePercent > 5 || (p95 && p95 > 2000)) {
      status = 'critical';
    } else if (errorRatePercent > 1 || (p95 && p95 > 1000) || this.slowRequestsCount > 10) {
      status = 'warning';
    }

    return {
      status,
      totalRequests: this.totalRequests,
      statusCodes: { ...this.statusCodes },
      errorCount,
      serverErrorCount,
      errorRatePercent,
      slowRequestsCount: this.slowRequestsCount,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      sampleSize: sorted.length,
      lastError: this.lastError,
    };
  }

  getPaymentStats() {
    return {
      ...this.payments,
      webhooks: { ...this.webhooks },
    };
  }

  getUptimeSeconds(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

export const metricsService = new MetricsService();
