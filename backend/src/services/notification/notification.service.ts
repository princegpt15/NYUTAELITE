// backend/src/services/notification/notification.service.ts
import type {
  Notification,
  NotificationChannel,
  NotificationType,
} from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { extractOrderCouponMeta } from '../coupon.service.js';
import { renderNotificationTemplate } from './notification.templates.js';
import { executeWithRetry } from './notification.retry.js';
import { emailNotificationProvider } from './providers/email.provider.js';
import { whatsAppNotificationProvider } from './providers/whatsapp.provider.js';
import {
  logNotificationEvent,
  type NotificationProvider,
  type OrderNotificationContext,
  type TriggerNotificationOptions,
} from './notification.types.js';

const pendingDispatches = new Set<Promise<unknown>>();

export class NotificationService {
  private getProvider(channel: NotificationChannel): NotificationProvider {
    if (channel === 'WHATSAPP') {
      return whatsAppNotificationProvider;
    }
    return emailNotificationProvider;
  }

  /**
   * Build deterministic database idempotency key.
   * Default key: `${orderId}:${type}:${channel}` (or `${orderId}:${type}:${channel}:${suffix}` when suffix provided).
   */
  public buildIdempotencyKey(
    orderId: string,
    type: NotificationType,
    channel: NotificationChannel,
    suffix?: string
  ): string {
    const cleanSuffix = suffix ? `:${suffix.trim()}` : '';
    return `${orderId}:${type}:${channel}${cleanSuffix}`;
  }

  /**
   * Load authoritative Order, User, OrderItems, and Payment context from PostgreSQL.
   * Never trusts client-supplied recipient addresses or financial totals.
   */
  private async loadOrderContext(
    options: TriggerNotificationOptions
  ): Promise<OrderNotificationContext | null> {
    const order = await prisma.order.findUnique({
      where: { id: options.orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            providerPaymentId: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order || !order.user) {
      return null;
    }

    const { cleanShippingAddress, couponMeta } = extractOrderCouponMeta(order.shippingAddress);
    const addrObj =
      cleanShippingAddress && typeof cleanShippingAddress === 'object'
        ? (cleanShippingAddress as Record<string, any>)
        : null;

    const capturedPayment = order.payments.find(
      (p) => p.status === 'CAPTURED' && p.providerPaymentId && !p.providerPaymentId.startsWith('rfnd_')
    );
    const latestRefundPayment = order.payments.find(
      (p) => p.status === 'REFUNDED' && (!p.providerPaymentId || p.providerPaymentId.startsWith('rfnd_'))
    );

    const customerPhone =
      order.user.phone ||
      (addrObj?.phone ? String(addrObj.phone) : null) ||
      null;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.user.id,
      customerName: order.user.name || addrObj?.fullName || 'Valued Customer',
      customerEmail: order.user.email || '',
      customerPhone,
      orderDate: order.createdAt,
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippingStatus: order.shippingStatus,
      subtotal: order.subtotal,
      discountAmount: Number(order.discountAmount || 0),
      couponCode: couponMeta?.couponCode || null,
      shippingAmount: Number(order.shippingAmount || 0),
      taxAmount: Number(order.taxAmount || 0),
      totalAmount: order.totalAmount,
      currency: order.currency || 'INR',
      items: order.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        price: i.price,
        subtotal: i.subtotal,
      })),
      shippingAddress: addrObj,
      paymentReference:
        options.paymentReference || capturedPayment?.providerPaymentId || null,
      refundAmount:
        options.refundAmount ?? latestRefundPayment?.amount ?? null,
      refundReference:
        options.refundReference || latestRefundPayment?.providerPaymentId || null,
      refundReason: options.refundReason || null,
    };
  }

  /**
   * Trigger a notification on a single channel with database-enforced idempotency,
   * bounded retry handling, and strict failure isolation.
   */
  public async dispatchSingleChannel(
    ctx: OrderNotificationContext,
    type: NotificationType,
    channel: NotificationChannel,
    idempotencySuffix?: string,
    forceRetry = false
  ): Promise<Notification | null> {
    try {
      const provider = this.getProvider(channel);

      // If optional channel (e.g. WHATSAPP) is disabled, skip cleanly without polluting or failing
      if (channel === 'WHATSAPP' && !provider.isEnabled()) {
        return null;
      }

      // 0. State Guard: Verify valid, persisted state changes before dispatching
      if (type === 'PAYMENT_SUCCESS' && ctx.paymentStatus !== 'CAPTURED') {
        logNotificationEvent('notification.skipped', {
          orderId: ctx.orderId,
          userId: ctx.userId,
          type,
          channel,
          reason: `Invalid state: PAYMENT_SUCCESS requires CAPTURED paymentStatus (current: ${ctx.paymentStatus})`,
        });
        return null;
      }

      if (type === 'ORDER_SHIPPED' && ctx.shippingStatus !== 'SHIPPED' && ctx.status !== 'SHIPPED') {
        logNotificationEvent('notification.skipped', {
          orderId: ctx.orderId,
          userId: ctx.userId,
          type,
          channel,
          reason: `Invalid state: ORDER_SHIPPED requires SHIPPED status (current: order=${ctx.status}, shipping=${ctx.shippingStatus})`,
        });
        return null;
      }

      if (type === 'ORDER_DELIVERED' && ctx.shippingStatus !== 'DELIVERED' && ctx.status !== 'DELIVERED') {
        logNotificationEvent('notification.skipped', {
          orderId: ctx.orderId,
          userId: ctx.userId,
          type,
          channel,
          reason: `Invalid state: ORDER_DELIVERED requires DELIVERED status (current: order=${ctx.status}, shipping=${ctx.shippingStatus})`,
        });
        return null;
      }

      const recipient =
        channel === 'EMAIL' ? ctx.customerEmail : ctx.customerPhone || '';

      const idempotencyKey = this.buildIdempotencyKey(
        ctx.orderId,
        type,
        channel,
        idempotencySuffix
      );

      // 1. Check existing notification in PostgreSQL by unique idempotencyKey
      const existing = await prisma.notification.findUnique({
        where: { idempotencyKey },
      });

      if (existing) {
        // Strict Idempotent Guard: NEVER duplicate an already SENT notification
        if (existing.status === 'SENT') {
          logNotificationEvent('notification.skipped', {
            notificationId: existing.id,
            orderId: ctx.orderId,
            userId: ctx.userId,
            type,
            channel,
            status: existing.status,
            attempt: existing.attemptCount,
            recipient: existing.recipient,
            provider: existing.provider ?? provider.providerName,
            providerMessageId: existing.providerMessageId,
            reason: 'Idempotent duplicate event skipped: notification already successfully SENT',
          });
          return existing;
        }

        // Never intervene if another thread is currently SENDING
        if (existing.status === 'SENDING') {
          logNotificationEvent('notification.skipped', {
            notificationId: existing.id,
            orderId: ctx.orderId,
            userId: ctx.userId,
            type,
            channel,
            status: existing.status,
            attempt: existing.attemptCount,
            recipient: existing.recipient,
            provider: existing.provider ?? provider.providerName,
            providerMessageId: existing.providerMessageId,
            reason: 'Notification dispatch currently in progress (SENDING)',
          });
          return existing;
        }

        // If notification FAILED and retry budget exhausted without explicit forceRetry:
        if (existing.status === 'FAILED' && existing.attemptCount >= 3 && !forceRetry) {
          logNotificationEvent('notification.skipped', {
            notificationId: existing.id,
            orderId: ctx.orderId,
            userId: ctx.userId,
            type,
            channel,
            status: existing.status,
            attempt: existing.attemptCount,
            recipient: existing.recipient,
            provider: existing.provider ?? provider.providerName,
            providerMessageId: existing.providerMessageId,
            reason: 'Retry budget exhausted on FAILED notification. Use explicit retry to re-dispatch.',
          });
          return existing;
        }
      }

      const rendered = renderNotificationTemplate(type, ctx);

      // 2. Atomically create or fetch the Notification record in PostgreSQL
      let notificationRecord: Notification;
      if (existing) {
        if (forceRetry && existing.status === 'FAILED') {
          notificationRecord = await prisma.notification.update({
            where: { id: existing.id },
            data: {
              status: 'PENDING',
              attemptCount: 0,
              errorMessage: null,
            },
          });
        } else {
          notificationRecord = existing;
        }
      } else {
        try {
          notificationRecord = await prisma.notification.create({
            data: {
              idempotencyKey,
              userId: ctx.userId,
              orderId: ctx.orderId,
              type,
              channel,
              status: 'PENDING',
              recipient: recipient || 'missing-recipient',
              subject: channel === 'EMAIL' ? rendered.subject : null,
              provider: provider.providerName,
              attemptCount: 0,
            },
          });

          logNotificationEvent('notification.created', {
            notificationId: notificationRecord.id,
            orderId: ctx.orderId,
            userId: ctx.userId,
            type,
            channel,
            status: 'PENDING',
            attempt: 0,
            recipient,
            provider: provider.providerName,
          });
        } catch (createErr: any) {
          // Handle race condition where two concurrent calls hit unique constraint P2002 on idempotencyKey
          if (createErr?.code === 'P2002') {
            const concurrentRecord = await prisma.notification.findUnique({
              where: { idempotencyKey },
            });
            return concurrentRecord;
          }
          throw createErr;
        }
      }

      // 3. Execute provider delivery with bounded retries
      return await executeWithRetry({
        notification: notificationRecord,
        userId: ctx.userId,
        provider,
        request: {
          notificationId: notificationRecord.id,
          orderId: ctx.orderId,
          orderNumber: ctx.orderNumber,
          type,
          channel,
          recipient,
          subject: rendered.subject,
          html: channel === 'EMAIL' ? rendered.html : undefined,
          text: channel === 'WHATSAPP' ? rendered.whatsappText : rendered.text,
        },
      });
    } catch (err: any) {
      // Strict failure isolation: log error safely and never throw into caller's business logic
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          event: 'notification.isolation_caught',
          orderId: ctx.orderId,
          type,
          channel,
          error: err?.message ? String(err.message).slice(0, 200) : 'Unknown notification error',
        })
      );
      return null;
    }
  }

  /**
   * Trigger notifications for an order event across configured channels (EMAIL + WHATSAPP if enabled).
   * Guaranteed never to throw or break caller operations.
   */
  public async dispatchOrderEvent(
    options: TriggerNotificationOptions
  ): Promise<Notification[]> {
    try {
      const ctx = await this.loadOrderContext(options);
      if (!ctx) {
        return [];
      }

      const channels: NotificationChannel[] = options.channels ?? ['EMAIL', 'WHATSAPP'];
      const results: Notification[] = [];

      for (const channel of channels) {
        const record = await this.dispatchSingleChannel(
          ctx,
          options.type,
          channel,
          options.idempotencySuffix,
          options.forceRetry
        );
        if (record) {
          results.push(record);
        }
      }

      return results;
    } catch (err: any) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          event: 'notification.dispatch_error',
          orderId: options.orderId,
          type: options.type,
          error: err?.message ? String(err.message).slice(0, 200) : 'Unexpected error',
        })
      );
      return [];
    }
  }

  /**
   * Non-blocking asynchronous dispatch so checkout, payment verification, order status updates,
   * and refunds do not wait on external email/WhatsApp network calls.
   */
  public dispatchOrderEventAsync(options: TriggerNotificationOptions): void {
    const task = Promise.resolve()
      .then(() => this.dispatchOrderEvent(options))
      .catch(() => {})
      .finally(() => {
        pendingDispatches.delete(task);
      });
    pendingDispatches.add(task);
  }

  /**
   * Inspect authoritative PostgreSQL Order & Payment state after a payment verification or webhook
   * and trigger PAYMENT_SUCCESS + ORDER_CONFIRMED (when CAPTURED) or PAYMENT_FAILED (when FAILED).
   */
  public async reconcilePaymentNotificationsForOrder(orderId: string): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
        },
      });
      if (!order) return;

      if (order.paymentStatus === 'CAPTURED') {
        await this.dispatchOrderEvent({
          orderId: order.id,
          type: 'PAYMENT_SUCCESS',
        });
        if (order.status === 'CONFIRMED') {
          await this.dispatchOrderEvent({
            orderId: order.id,
            type: 'ORDER_CONFIRMED',
          });
        }
      } else if (order.paymentStatus === 'FAILED') {
        await this.dispatchOrderEvent({
          orderId: order.id,
          type: 'PAYMENT_FAILED',
        });
      }
    } catch {
      // Isolated: never throw
    }
  }

  /**
   * Explicitly retry a failed notification record.
   * Guarantees:
   * 1. Never resends if status === 'SENT' (strict duplicate delivery prevention).
   * 2. Skips if status === 'SENDING' (prevents concurrent duplicate sends).
   * 3. For FAILED notifications, resets attempt budget and executes delivery.
   */
  public async retryFailedNotification(notificationId: string): Promise<Notification | null> {
    try {
      const existing = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!existing) {
        return null;
      }

      if (existing.status === 'SENT') {
        logNotificationEvent('notification.skipped', {
          notificationId: existing.id,
          orderId: existing.orderId,
          userId: existing.userId,
          type: existing.type,
          channel: existing.channel,
          status: existing.status,
          attempt: existing.attemptCount,
          recipient: existing.recipient,
          reason: 'Cannot retry notification: already successfully SENT',
        });
        return existing;
      }

      if (existing.status === 'SENDING') {
        return existing;
      }

      const ctx = await this.loadOrderContext({
        orderId: existing.orderId,
        type: existing.type,
      });

      if (!ctx) {
        return null;
      }

      // Reset record attempt budget and status to PENDING
      const resetRecord = await prisma.notification.update({
        where: { id: existing.id },
        data: {
          status: 'PENDING',
          attemptCount: 0,
          errorMessage: null,
        },
      });

      const provider = this.getProvider(existing.channel);
      const rendered = renderNotificationTemplate(existing.type, ctx);

      return await executeWithRetry({
        notification: resetRecord,
        userId: ctx.userId,
        provider,
        request: {
          notificationId: resetRecord.id,
          orderId: ctx.orderId,
          orderNumber: ctx.orderNumber,
          type: existing.type,
          channel: existing.channel,
          recipient: existing.recipient,
          subject: existing.channel === 'EMAIL' ? rendered.subject : (undefined as any),
          html: existing.channel === 'EMAIL' ? rendered.html : undefined,
          text: existing.channel === 'WHATSAPP' ? rendered.whatsappText : rendered.text,
        },
      });
    } catch (err: any) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          event: 'notification.retry_error',
          notificationId,
          error: err?.message ? String(err.message).slice(0, 200) : 'Unexpected error retrying notification',
        })
      );
      return null;
    }
  }

  /**
   * Wait for all currently queued async dispatches to settle (useful in deterministic tests).
   */
  public async flushPendingDispatches(): Promise<void> {
    while (pendingDispatches.size > 0) {
      await Promise.allSettled(Array.from(pendingDispatches));
    }
  }
}

export const notificationService = new NotificationService();
