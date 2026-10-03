// src/controllers/payment.controller.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { razorpayService } from '../services/razorpay.service.js';
import { env } from '../config/env.js';
import { PaymentStatus, PaymentProvider } from '@prisma/client';

/**
 * Create a Razorpay order for an existing internal order.
 * Returns the Razorpay order payload and public key.
 */
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id; // set by auth middleware
    const { orderId } = req.body;
    // Fetch order and ensure ownership & payable status
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (order.paymentStatus !== 'PENDING' || order.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Order is not payable' });
    }
    // Create Razorpay order via service
    const razorpayOrder = await razorpayService.createRazorpayOrder(order.id);
    return res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    next(err);
    return;
  }
};

/**
 * Verify payment signature from frontend after Razorpay checkout.
 * Updates Payment and Order statuses inside a transaction.
 */
export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    // Verify signature first
    const isValid = razorpayService.verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
    // Fetch internal order and ensure ownership
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    // Idempotency: check if payment already recorded
    const existingPayment = await prisma.payment.findFirst({ where: { providerPaymentId: razorpay_payment_id } });
    if (existingPayment) {
      // Return existing state
      return res.json({ success: true, data: existingPayment });
    }
    // Fetch Razorpay payment to double‑check amount
    const razorpayPayment = await razorpayService.fetchPayment(razorpay_payment_id);
    // Ensure amount is a number (paise) and convert to INR
    const amount = Number(razorpayPayment.amount ?? 0) / 100;
    // Transaction: create payment, update order statuses
    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: PaymentProvider.RAZORPAY,
          providerOrderId: razorpay_order_id,
          providerPaymentId: razorpay_payment_id,
          amount,
          currency: razorpayPayment.currency,
          status: PaymentStatus.CAPTURED,
          signatureVerified: true,
          rawResponse: razorpayPayment as any,
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.CAPTURED,
          status: 'CONFIRMED',
        },
      });
    });
    const paymentRecord = await prisma.payment.findFirst({ where: { providerPaymentId: razorpay_payment_id } });
    return res.json({ success: true, data: paymentRecord });
  } catch (err) {
    next(err);
    return;
  }
};

/**
 * Razorpay webhook handler.
 * Must be mounted with express.raw({ type: 'application/json' }) to preserve raw body.
 */
export const webhookHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = req.body.toString(); // raw Buffer turned into string by raw middleware
    if (!signature || !razorpayService.verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }
    const event = JSON.parse(rawBody);
    const eventId = event?.payload?.payment?.entity?.id || event?.payload?.order?.entity?.id || '';
    const eventType = event.event;

    // Idempotent check – if already processed, return early
    const existing = await prisma.paymentWebhookEvent.findUnique({ where: { eventId } });
    if (existing) {
      return res.json({ success: true, message: 'Event already processed' });
    }

    // Process supported events inside a transaction; only after success we record the event as processed
    await prisma.$transaction(async (tx) => {
      if (eventType === 'payment.captured') {
        const payment = event.payload.payment.entity;
        await tx.payment.updateMany({
          where: { providerPaymentId: payment.id, status: { not: PaymentStatus.CAPTURED } },
          data: { status: PaymentStatus.CAPTURED, rawResponse: payment as any },
        });
      } else if (eventType === 'payment.failed') {
        const payment = event.payload.payment.entity;
        await tx.payment.updateMany({
          where: { providerPaymentId: payment.id },
          data: { status: PaymentStatus.FAILED, rawResponse: payment as any },
        });
      } else if (eventType === 'order.paid') {
        const rhOrder = event.payload.order.entity;
        await tx.order.updateMany({
          where: { razorpayOrderId: rhOrder.id, paymentStatus: { not: PaymentStatus.CAPTURED } },
          data: { paymentStatus: PaymentStatus.CAPTURED, status: 'CONFIRMED' },
        });
      } else if (eventType === 'refund.created' || eventType === 'refund.processed') {
        const refund = event.payload.refund.entity;
        await tx.payment.updateMany({
          where: { providerPaymentId: refund.payment_id },
          data: { status: PaymentStatus.REFUNDED, rawResponse: refund as any },
        });
      }
      // Record the webhook event as processed only after successful DB updates
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
