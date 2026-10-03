// src/routes/order.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createOrderSchema } from '../validators/order.validator.js';
import { createOrder, getUserOrders, getUserOrderById, cancelOrder } from '../controllers/order.controller.js';

const router = Router();

// Create a new order
router.post('/', requireAuth, validate(createOrderSchema), createOrder);

// Get all orders for the authenticated user
router.get('/', requireAuth, getUserOrders);

// Get a specific order by ID
router.get('/:id', requireAuth, getUserOrderById);

// Cancel an order
router.post('/:id/cancel', requireAuth, cancelOrder);

export default router;
