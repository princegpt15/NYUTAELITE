// backend/src/middleware/paymentObservability.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { metricsService } from '../services/metrics.service.js';

/**
 * Non-intrusive payment and webhook observability middleware.
 * Attaches structured logging and operational metrics around payment workflows
 * without modifying payment calculations, signature verification, or business rules.
 */
export function paymentObservabilityMiddleware(req: Request, res: Response, next: NextFunction) {
  const path = req.path;
  const requestId = req.requestId;

  // Intercept Webhook Arrival
  if (path === '/webhook') {
    const eventType = req.body?.event;
    const eventId = req.body?.event_id || req.body?.id;
    metricsService.recordWebhookEvent('received');
    logger.info('[WEBHOOK_RECEIVED]', {
      eventType,
      eventId,
      requestId,
    });
  }

  // Intercept Refund Initiation
  if (path === '/refund' && req.method === 'POST') {
    const orderId = req.body?.orderId;
    logger.info('[REFUND_INITIATED]', {
      orderId,
      requestId,
    });
  }

  // Intercept Response Completion
  res.on('finish', () => {
    const statusCode = res.statusCode;

    // 1. Payment Order Creation
    if (path === '/create-order' && req.method === 'POST') {
      const orderId = req.body?.orderId;
      if (statusCode >= 200 && statusCode < 300) {
        metricsService.recordPaymentEvent('created');
        logger.info('[PAYMENT_ORDER_CREATED]', {
          orderId,
          statusCode,
          requestId,
        });
      } else {
        logger.warn('[PAYMENT_ORDER_CREATION_FAILED]', {
          orderId,
          statusCode,
          requestId,
        });
      }
    }

    // 2. Payment Verification
    if (path === '/verify' && req.method === 'POST') {
      const orderId = req.body?.orderId;
      const razorpayPaymentId = req.body?.razorpay_payment_id;
      if (statusCode >= 200 && statusCode < 300) {
        metricsService.recordPaymentEvent('captured');
        logger.info('[PAYMENT_VERIFICATION_SUCCESS]', {
          orderId,
          razorpayPaymentId,
          statusCode,
          requestId,
        });
      } else {
        metricsService.recordPaymentEvent('failed');
        logger.warn('[PAYMENT_VERIFICATION_FAILURE]', {
          orderId,
          razorpayPaymentId,
          statusCode,
          reason: 'Verification rejected or invalid signature',
          requestId,
        });
      }
    }

    // 3. Webhook Processing Lifecycle
    if (path === '/webhook' && req.method === 'POST') {
      const eventType = req.body?.event;
      const eventId = req.body?.event_id || req.body?.id;

      if (statusCode === 400) {
        metricsService.recordWebhookEvent('verificationFailed');
        logger.warn('[WEBHOOK_VERIFICATION_FAILED]', {
          requestId,
          statusCode,
        });
      } else if (statusCode >= 200 && statusCode < 300) {
        metricsService.recordWebhookEvent('processed');
        logger.info('[WEBHOOK_PROCESSED]', {
          eventType,
          eventId,
          statusCode,
          requestId,
        });
      } else if (statusCode >= 500) {
        metricsService.recordWebhookEvent('processingFailed');
        logger.error('[WEBHOOK_PROCESSING_FAILED]', {
          eventType,
          eventId,
          statusCode,
          requestId,
        });
      }
    }

    // 4. Refund Completion
    if (path === '/refund' && req.method === 'POST') {
      const orderId = req.body?.orderId;
      if (statusCode >= 200 && statusCode < 300) {
        metricsService.recordPaymentEvent('refunded');
        logger.info('[REFUND_SUCCESS]', {
          orderId,
          statusCode,
          requestId,
        });
      } else {
        logger.warn('[REFUND_FAILED]', {
          orderId,
          statusCode,
          requestId,
        });
      }
    }
  });

  next();
}
