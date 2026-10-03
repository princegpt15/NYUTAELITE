// src/services/razorpay.service.ts
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../lib/prisma.js'
import { env } from '../config/env.js'
// Removed unused imports

/**
 * Razorpay integration service.
 * All secrets are read from environment variables only.
 */
class RazorpayService {
  private client: Razorpay;

  constructor() {
    this.client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }

  /**
   * Create a Razorpay order for an internal NYUTA order.
   * Returns the Razorpay order payload.
   */
  async createRazorpayOrder(internalOrderId: string) {
    const order = await prisma.order.findUnique({ where: { id: internalOrderId } });
    if (!order) {
      throw new Error('Order not found');
    }
    if (order.paymentStatus !== 'PENDING') {
      throw new Error('Order is not payable');
    }
    // Convert INR to paise (integer)
    const amountPaise = Math.round(order.totalAmount * 100);
    const razorpayOrder = await this.client.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: order.id,
      notes: {
        nyuta_order_number: order.orderNumber,
      },
    });
    // Save razorpay order id on internal order
    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });
    return razorpayOrder;
  }

  /** Verify the signature sent from the frontend after payment. */
  verifyPaymentSignature(params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;
    const generated = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    return generated === razorpay_signature;
  }

  /** Verify webhook signature using the webhook secret. */
  verifyWebhookSignature(body: string, headerSignature: string) {
    const generated = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');
    return generated === headerSignature;
  }

  /** Fetch a Razorpay payment by its id. */
  async fetchPayment(paymentId: string) {
    return this.client.payments.fetch(paymentId);
  }

  /** Create a refund for a captured payment. */
  async createRefund(paymentId: string, amount?: number) {
    const payload: any = { payment_id: paymentId };
    if (amount) payload.amount = amount;
    return this.client.payments.refund(paymentId, payload);
  }
}

export const razorpayService = new RazorpayService();
