// backend/src/controllers/order.controller.ts
import { Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.js';
import { ga4IdempotencyService } from '../services/ga4Idempotency.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

const orderService = new OrderService();

/** Create a new order from the authenticated user's cart */
export async function createOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { addressId, address, couponCode } = req.body;
    const order = await orderService.createOrder(userId, { addressId, address, couponCode });
    res.status(201).json({ success: true, message: 'Order created', data: order });
  } catch (err) {
    next(err);
  }
}

/** Get all orders for the authenticated user */
export async function getUserOrders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const orders = await orderService.getUserOrders(userId);
    res.json({ success: true, message: 'Orders fetched', data: orders });
  } catch (err) {
    next(err);
  }
}

/** Get a specific order by its ID for the authenticated user */
export async function getUserOrderById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const orderId = req.params.id;
    const order = await orderService.getUserOrderById(userId, orderId);
    res.json({ success: true, message: 'Order fetched', data: order });
  } catch (err) {
    next(err);
  }
}

/** Cancel an order if it is in a cancellable state */
export async function cancelOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const orderId = req.params.id;
    const cancelled = await orderService.cancelOrder(userId, orderId);
    res.json({ success: true, message: 'Order cancelled', data: cancelled });
  } catch (err) {
    next(err);
  }
}

/** Authoritatively verify and claim GA4 purchase analytics event eligibility */
export async function claimOrderPurchaseAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const actor = { id: req.user!.id, role: req.user!.role };
    const orderId = req.params.id;
    const result = await ga4IdempotencyService.claimPurchaseEvent(orderId, actor);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/** Authoritatively verify and claim GA4 refund analytics event eligibility */
export async function claimOrderRefundAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const actor = { id: req.user!.id, role: req.user!.role };
    const orderId = req.params.id;
    const refundId = typeof req.body?.refundId === 'string' ? req.body.refundId : null;
    const result = await ga4IdempotencyService.claimRefundEvent(orderId, { refundId }, actor);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
