// backend/src/routes/admin.routes.ts
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  adminOrdersQuerySchema,
  updateOrderStatusSchema,
  adminProductsQuerySchema,
  createProductSchema,
  updateProductSchema,
  adminCustomersQuerySchema,
  adminPaymentsQuerySchema,
} from '../validators/admin.validator.js';
import {
  getDashboardStats,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getProducts,
  createProduct,
  updateProduct,
  getCustomers,
  getCustomerById,
  getPayments,
  getPaymentById,
} from '../controllers/admin.controller.js';

const router = Router();

// Server-side strict authorization: Every admin endpoint requires valid JWT and role === 'ADMIN'
router.use(requireAuth);
router.use(requireAdmin);

// Dashboard Overview
router.get('/dashboard', getDashboardStats);

// Orders
router.get('/orders', validate(adminOrdersQuerySchema, 'query'), getOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema, 'body'), updateOrderStatus);

// Products & Inventory
router.get('/products', validate(adminProductsQuerySchema, 'query'), getProducts);
router.post('/products', validate(createProductSchema, 'body'), createProduct);
router.patch('/products/:id', validate(updateProductSchema, 'body'), updateProduct);

// Customers
router.get('/customers', validate(adminCustomersQuerySchema, 'query'), getCustomers);
router.get('/customers/:id', getCustomerById);

// Payments (Read-Only)
router.get('/payments', validate(adminPaymentsQuerySchema, 'query'), getPayments);
router.get('/payments/:id', getPaymentById);

export default router;
