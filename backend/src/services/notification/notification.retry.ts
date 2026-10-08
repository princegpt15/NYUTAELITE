// backend/src/services/notification/notification.retry.ts
import type { Notification } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import {
  logNotificationEvent,
  type NotificationProvider,
  type ProviderSendRequest,
} from './notification.types.js';

export const MAX_NOTIFICATION_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute provider delivery with bounded retries (max 3 attempts) and PostgreSQL state persistence.
 * - Permanent failures (`retryable: false`) transition immediately to FAILED without further retries.
 * - Transient failures (`retryable: true`) retry up to MAX_NOTIFICATION_ATTEMPTS with exponential backoff,
 *   persisting each attempt in PostgreSQL before transitioning to final SENT or FAILED state.
 */
export async function executeWithRetry(params: {
  notification: Notification;
  userId: string;
  provider: NotificationProvider;
  request: ProviderSendRequest;
  baseDelayMs?: number;
}): Promise<Notification> {
  const { notification, userId, provider, request, baseDelayMs = 25 } = params;
  let currentRecord = notification;
  const startingAttempt = Math.max(0, currentRecord.attemptCount || 0);

  for (let attempt = startingAttempt + 1; attempt <= MAX_NOTIFICATION_ATTEMPTS; attempt++) {
    const attemptAt = new Date();

    // Mark SENDING and record attempt count in PostgreSQL
    currentRecord = await prisma.notification.update({
      where: { id: currentRecord.id },
      data: {
        status: 'SENDING',
        attemptCount: attempt,
        lastAttemptAt: attemptAt,
        provider: provider.providerName,
      },
    });

    const deliveryResult = await provider.send(request);

    if (deliveryResult.success) {
      const sentAt = new Date();
      currentRecord = await prisma.notification.update({
        where: { id: currentRecord.id },
        data: {
          status: 'SENT',
          provider: deliveryResult.provider,
          providerMessageId: deliveryResult.providerMessageId,
          errorMessage: null,
          sentAt,
          lastAttemptAt: sentAt,
        },
      });

      logNotificationEvent('notification.sent', {
        notificationId: currentRecord.id,
        orderId: currentRecord.orderId,
        userId,
        type: currentRecord.type,
        channel: currentRecord.channel,
        status: 'SENT',
        attempt,
        recipient: currentRecord.recipient,
        provider: deliveryResult.provider,
        providerMessageId: deliveryResult.providerMessageId,
      });

      return currentRecord;
    }

    const sanitizedError = [deliveryResult.errorCode, deliveryResult.message]
      .filter(Boolean)
      .join(': ')
      .slice(0, 500);

    const canRetryMore = deliveryResult.retryable && attempt < MAX_NOTIFICATION_ATTEMPTS;

    if (canRetryMore) {
      currentRecord = await prisma.notification.update({
        where: { id: currentRecord.id },
        data: {
          status: 'PENDING',
          provider: deliveryResult.provider,
          errorMessage: sanitizedError || 'Transient provider error (scheduled for retry)',
          lastAttemptAt: new Date(),
        },
      });

      logNotificationEvent('notification.retry', {
        notificationId: currentRecord.id,
        orderId: currentRecord.orderId,
        userId,
        type: currentRecord.type,
        channel: currentRecord.channel,
        status: 'PENDING',
        attempt,
        recipient: currentRecord.recipient,
        provider: deliveryResult.provider,
        reason: sanitizedError,
      });

      const backoffMs = baseDelayMs * Math.pow(2, attempt - 1);
      await sleep(backoffMs);
      continue;
    }

    // Final failure (either non-retryable permanent error or max attempts exhausted)
    currentRecord = await prisma.notification.update({
      where: { id: currentRecord.id },
      data: {
        status: 'FAILED',
        provider: deliveryResult.provider,
        errorMessage: sanitizedError || 'Notification delivery failed',
        lastAttemptAt: new Date(),
      },
    });

    logNotificationEvent('notification.failed', {
      notificationId: currentRecord.id,
      orderId: currentRecord.orderId,
      userId,
      type: currentRecord.type,
      channel: currentRecord.channel,
      status: 'FAILED',
      attempt,
      recipient: currentRecord.recipient,
      provider: deliveryResult.provider,
      reason: sanitizedError,
    });

    return currentRecord;
  }

  return currentRecord;
}
