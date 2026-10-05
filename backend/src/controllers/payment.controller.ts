// src/controllers/payment.controller.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { razorpayService } from '../services/razorpay.service.js';
import { env } from '../config/env.js';
import { PaymentStatus, PaymentProvider, OrderStatus } from '@prisma/client';

/**
 * Create a Razorpay order for an existing internal order.
 * Returns the Razorpay order payload and public key.
 */
export const createOrder = async (req: Request, res: Response, _next?: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { orderId } = req.body;

    // Fetch order and ensure ownership & payable status
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (order.paymentStatus === PaymentStatus.CAPTURED) {
      return res.status(400).json({ success: false, message: 'Order is already paid' });
    }

    if (order.status === OrderStatus.CANCELLED) {
      return res.status(400).json({ success: false, message: 'Order has been cancelled' });
    }

    // Ensure order amount meets Razorpay minimum (>= 100 paise)
    const amountPaise = Math.round(order.totalAmount * 100);
    if (amountPaise < 100) {
      return res.status(400).json({ success: false, message: 'Order amount must be at least 100 paise' });
    }
    // Create Razorpay order via service (authoritative totalAmount from DB)
    const razorpayOrder = await razorpayService.createRazorpayOrder(order.id);


    // Create or update initial pending payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        provider: PaymentProvider.RAZORPAY,
        providerOrderId: razorpayOrder.id,
        amount: order.totalAmount,
        currency: razorpayOrder.currency || 'INR',
        status: PaymentStatus.PENDING,
        signatureVerified: false,
      },
    });

    return res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err: any) {
    const errorMsg = err?.error?.description || err?.message || 'Payment gateway initialization failed';
    return res.status(502).json({
      success: false,
      message: `Payment gateway error: ${errorMsg}`,
      error: { code: 'GATEWAY_ERROR' },
    });
  }
};

/**
 * Verify payment signature from frontend after Razorpay checkout.
 * Updates Payment and Order statuses, decrements product stock, and clears user cart in a transaction.
 */
export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify cryptographic signature first
    const isValid = razorpayService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    // Diagnostic log (does not expose secrets)
    console.debug('Payment signature verification result:', isValid);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Fetch internal order and ensure ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Idempotency: check if payment already captured
    const existingPayment = await prisma.payment.findFirst({
      where: { providerPaymentId: razorpay_payment_id, status: PaymentStatus.CAPTURED },
    });

    if (existingPayment) {
      return res.json({ success: true, data: existingPayment });
    }

    // Execute payment recording, order update, stock decrement, and cart clearing inside a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Record / update payment
      await tx.payment.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          provider: PaymentProvider.RAZORPAY,
          providerOrderId: razorpay_order_id,
          providerPaymentId: razorpay_payment_id,
          amount: order.totalAmount,
          currency: order.currency || 'INR',
          status: PaymentStatus.CAPTURED,
          signatureVerified: true,
          rawResponse: { razorpay_order_id, razorpay_payment_id, razorpay_signature },
        },
      });

      // 2. Update order status to CONFIRMED and paymentStatus to CAPTURED
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.CAPTURED,
          status: OrderStatus.CONFIRMED,
        },
      });

      // 3. Decrement stock for ordered items
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 4. Clear user's active cart items
      await tx.cartItem.deleteMany({
        where: {
          cart: {
            userId: order.userId,
          },
        },
      });
    });

    const paymentRecord = await prisma.payment.findFirst({
      where: { providerPaymentId: razorpay_payment_id },
    });

    return res.json({ success: true, data: paymentRecord });
  } catch (err) {
    next(err);
    return;
  }
};

/**
 * Razorpay webhook handler.
 * Verifies raw webhook signature using RAZORPAY_WEBHOOK_SECRET and processes events idempotently.
 */
export const webhookHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const rawBody = (req as any).rawBody
      ? (req as any).rawBody.toString('utf8')
      : Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body);

    if (!signature || !razorpayService.verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? req.body : JSON.parse(rawBody);
    const eventType = event.event;
    const eventId =
      event?.event_id ||
      event?.id ||
      (event?.payload?.payment?.entity?.id ? `${eventType}_${event.payload.payment.entity.id}` : '') ||
      (event?.payload?.order?.entity?.id ? `${eventType}_${event.payload.order.entity.id}` : '') ||
      `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Idempotent check – if already processed, return early
    const existing = await prisma.paymentWebhookEvent.findUnique({ where: { eventId } });
    if (existing) {
      return res.json({ success: true, message: 'Event already processed' });
    }

    // Process supported events inside a transaction
    await prisma.$transaction(async (tx) => {
      if (eventType === 'payment.captured') {
        const payment = event.payload.payment.entity;
        const razorpayOrderId = payment.order_id;

        // Find associated internal order
        const order = razorpayOrderId
          ? await tx.order.findFirst({ where: { razorpayOrderId }, include: { items: true } })
          : null;

        if (order) {
          // Check if already marked captured
          if (order.paymentStatus !== PaymentStatus.CAPTURED) {
            await tx.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: PaymentStatus.CAPTURED,
                status: OrderStatus.CONFIRMED,
              },
            });

            // Decrement stock
            for (const item of order.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: {
                    decrement: item.quantity,
                  },
                },
              });
            }

            // Clear cart
            await tx.cartItem.deleteMany({
              where: {
                cart: {
                  userId: order.userId,
                },
              },
            });
          }

          // Record or update payment record
          const existingPayment = await tx.payment.findFirst({
            where: { providerPaymentId: payment.id },
          });

          if (existingPayment) {
            await tx.payment.update({
              where: { id: existingPayment.id },
              data: {
                status: PaymentStatus.CAPTURED,
                signatureVerified: true,
                rawResponse: payment as any,
              },
            });
          } else {
            await tx.payment.create({
              data: {
                orderId: order.id,
                userId: order.userId,
                provider: PaymentProvider.RAZORPAY,
                providerOrderId: payment.order_id,
                providerPaymentId: payment.id,
                amount: Number(payment.amount ?? 0) / 100,
                currency: payment.currency || 'INR',
                status: PaymentStatus.CAPTURED,
                signatureVerified: true,
                rawResponse: payment as any,
              },
            });
          }
        }
      } else if (eventType === 'payment.failed') {
        const payment = event.payload.payment.entity;
        const razorpayOrderId = payment.order_id;
        const order = razorpayOrderId
          ? await tx.order.findFirst({ where: { razorpayOrderId } })
          : null;

        if (order) {
          await tx.order.update({
            where: { id: order.id },
            data: { paymentStatus: PaymentStatus.FAILED },
          });

          await tx.payment.create({
            data: {
              orderId: order.id,
              userId: order.userId,
              provider: PaymentProvider.RAZORPAY,
              providerOrderId: payment.order_id,
              providerPaymentId: payment.id,
              amount: Number(payment.amount ?? 0) / 100,
              currency: payment.currency || 'INR',
              status: PaymentStatus.FAILED,
              signatureVerified: false,
              rawResponse: payment as any,
            },
          });
        }
      } else if (eventType === 'order.paid') {
        const rhOrder = event.payload.order.entity;
        const order = await tx.order.findFirst({
          where: { razorpayOrderId: rhOrder.id },
          include: { items: true },
        });

        if (order && order.paymentStatus !== PaymentStatus.CAPTURED) {
          await tx.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: PaymentStatus.CAPTURED,
              status: OrderStatus.CONFIRMED,
            },
          });

          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          }

          await tx.cartItem.deleteMany({
            where: {
              cart: {
                userId: order.userId,
              },
            },
          });
        }
      } else if (eventType === 'refund.created' || eventType === 'refund.processed') {
        const refund = event.payload.refund.entity;
        await tx.payment.updateMany({
          where: { providerPaymentId: refund.payment_id },
          data: { status: PaymentStatus.REFUNDED, rawResponse: refund as any },
        });
      }

      // Record webhook event as processed
      await tx.paymentWebhookEvent.create({
        data: { eventId, eventType, processed: true, processedAt: new Date() },
      });
    });

    return res.json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    next(err);
    return;
  }
};

/**
 * Refund a captured payment. Admin only.
 */
export const refund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Admin guard already applied in route
    const { orderId } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payments: true } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const payment = order.payments.find((p) => p.status === PaymentStatus.CAPTURED);
    if (!payment) {
      return res.status(400).json({ success: false, message: 'No captured payment to refund' });
    }
    // Idempotency: check if already refunded
    const alreadyRefunded = await prisma.payment.findFirst({ where: { providerPaymentId: payment.providerPaymentId, status: PaymentStatus.REFUNDED } });
    if (alreadyRefunded) {
      return res.status(400).json({ success: false, message: 'Payment already refunded' });
    }
    const razorpayRefund = await razorpayService.createRefund(payment.providerPaymentId!);
    // Record refund as a new payment entry linked to the same order
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: PaymentProvider.RAZORPAY,
        providerOrderId: payment.providerOrderId,
        providerPaymentId: razorpayRefund.id,
        amount: (razorpayRefund.amount ?? 0) / 100,
        currency: razorpayRefund.currency,
        status: PaymentStatus.REFUNDED,
        signatureVerified: true,
        rawResponse: razorpayRefund as any,
      },
    });
    // Update order status if needed
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });
    return res.json({ success: true, data: razorpayRefund });
  } catch (err) {
    next(err);
    return;
  }
};
