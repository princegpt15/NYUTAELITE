// backend/src/routes/admin.routes.ts
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  orderIdParamSchema,
  adminOrdersQuerySchema,
  updateOrderStatusSchema,
  adminProductsQuerySchema,
  createProductSchema,
  updateProductSchema,
  adminCustomersQuerySchema,
  adminPaymentsQuerySchema,
  refundOrderSchema,
  couponIdParamSchema,
  adminCouponsQuerySchema,
  createCouponSchema,
  updateCouponSchema,
  notificationIdParamSchema,
  adminNotificationsQuerySchema,
  analyticsQuerySchema,
  analyticsProductsQuerySchema,
  analyticsPaginatedQuerySchema,
} from '../validators/admin.validator.js';
import {
  getDashboardStats,
  getOrders,
  getOrderById,
  updateOrderStatus,
  refundOrder,
  getProducts,
  createProduct,
  updateProduct,
  getCustomers,
  getCustomerById,
  getPayments,
  getPaymentById,
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  getNotifications,
  getNotificationById,
  getAnalyticsSummary,
  getAnalyticsRevenue,
  getAnalyticsOrders,
  getAnalyticsPayments,
  getAnalyticsRefunds,
  getAnalyticsProducts,
  getAnalyticsCustomers,
  getAnalyticsCoupons,
  getSystemHealth,
} from '../controllers/admin.controller.js';

const router = Router();

// Server-side strict authorization: Every admin endpoint requires valid JWT and role === 'ADMIN'
router.use(requireAuth);
router.use(requireAdmin);

// Dashboard Overview
router.get('/dashboard', getDashboardStats);
router.get('/dashboard/summary', getDashboardStats);
router.get('/system-health', getSystemHealth);

// Orders
router.get('/orders', validate(adminOrdersQuerySchema, 'query'), getOrders);
router.get('/orders/:id', validate(orderIdParamSchema, 'params'), getOrderById);
router.patch(
  '/orders/:id/status',
  validate(orderIdParamSchema, 'params'),
  validate(updateOrderStatusSchema, 'body'),
  updateOrderStatus
);
router.post(
  '/orders/:id/refund',
  validate(orderIdParamSchema, 'params'),
  validate(refundOrderSchema, 'body'),
  refundOrder
);

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

// Coupons & Discounts
router.get('/coupons', validate(adminCouponsQuerySchema, 'query'), getCoupons);
router.get('/coupons/:id', validate(couponIdParamSchema, 'params'), getCouponById);
router.post('/coupons', validate(createCouponSchema, 'body'), createCoupon);
router.patch(
  '/coupons/:id',
  validate(couponIdParamSchema, 'params'),
  validate(updateCouponSchema, 'body'),
  updateCoupon
);

// Notifications (Read-Only Admin Visibility)
router.get('/notifications', validate(adminNotificationsQuerySchema, 'query'), getNotifications);
router.get('/notifications/:id', validate(notificationIdParamSchema, 'params'), getNotificationById);

// Analytics & Business Intelligence (Strictly Read-Only)
router.get('/analytics/summary', validate(analyticsQuerySchema, 'query'), getAnalyticsSummary);
router.get('/analytics/revenue', validate(analyticsQuerySchema, 'query'), getAnalyticsRevenue);
router.get('/analytics/orders', validate(analyticsQuerySchema, 'query'), getAnalyticsOrders);
router.get('/analytics/payments', validate(analyticsQuerySchema, 'query'), getAnalyticsPayments);
router.get('/analytics/refunds', validate(analyticsQuerySchema, 'query'), getAnalyticsRefunds);
router.get('/analytics/products', validate(analyticsProductsQuerySchema, 'query'), getAnalyticsProducts);
router.get('/analytics/customers', validate(analyticsPaginatedQuerySchema, 'query'), getAnalyticsCustomers);
router.get('/analytics/coupons', validate(analyticsPaginatedQuerySchema, 'query'), getAnalyticsCoupons);

// Product Reviews Moderation (Admin)
router.get('/reviews', async (req, res, next) => {
  const { adminGetReviews } = await import('../controllers/retention.controller.js');
  return adminGetReviews(req, res, next);
});
router.put('/reviews/:id/status', async (req, res, next) => {
  const { adminModerateReview } = await import('../controllers/retention.controller.js');
  return adminModerateReview(req, res, next);
});
router.patch('/reviews/:id/status', async (req, res, next) => {
  const { adminModerateReview } = await import('../controllers/retention.controller.js');
  return adminModerateReview(req, res, next);
});
router.put('/reviews/:id', async (req, res, next) => {
  const { adminModerateReview } = await import('../controllers/retention.controller.js');
  return adminModerateReview(req, res, next);
});
router.patch('/reviews/:id', async (req, res, next) => {
  const { adminModerateReview } = await import('../controllers/retention.controller.js');
  return adminModerateReview(req, res, next);
});
router.delete('/reviews/:id', async (req, res, next) => {
  const { adminDeleteReview } = await import('../controllers/retention.controller.js');
  return adminDeleteReview(req, res, next);
});

// Retention Overview Summary
router.get('/retention/summary', async (req, res, next) => {
  const { adminGetRetentionSummary } = await import('../controllers/retention.controller.js');
  return adminGetRetentionSummary(req, res, next);
});

export default router;
