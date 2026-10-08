// src/routes/product.routes.ts
import { Router } from 'express';
import * as productCtrl from '../controllers/product.controller.js';

const router = Router();

router.get('/', ...productCtrl.getProducts);

// Recommendations (must be before /:id)
router.get('/recommendations', async (req, res, next) => {
  const { getRecommendations } = await import('../controllers/retention.controller.js');
  return getRecommendations(req, res, next);
});

// Product Reviews & Ratings
router.get('/:id/reviews', async (req, res, next) => {
  const { getProductReviews } = await import('../controllers/retention.controller.js');
  return getProductReviews(req, res, next);
});
router.get('/:id/rating-summary', async (req, res, next) => {
  const { getProductRatingSummary } = await import('../controllers/retention.controller.js');
  return getProductRatingSummary(req, res, next);
});
router.post('/:id/reviews', async (req, res, next) => {
  const { requireAuth } = await import('../middleware/auth.middleware.js');
  const { createReview } = await import('../controllers/retention.controller.js');
  return requireAuth(req, res, () => createReview(req, res, next));
});

// Back-In-Stock Alerts
router.post('/:id/back-in-stock', async (req, res, next) => {
  const { requireAuth } = await import('../middleware/auth.middleware.js');
  const { subscribeBackInStock } = await import('../controllers/retention.controller.js');
  return requireAuth(req, res, () => subscribeBackInStock(req, res, next));
});
router.delete('/:id/back-in-stock', async (req, res, next) => {
  const { requireAuth } = await import('../middleware/auth.middleware.js');
  const { unsubscribeBackInStock } = await import('../controllers/retention.controller.js');
  return requireAuth(req, res, () => unsubscribeBackInStock(req, res, next));
});
router.get('/:id/back-in-stock/status', async (req, res, next) => {
  const { requireAuth } = await import('../middleware/auth.middleware.js');
  const { getBackInStockStatus } = await import('../controllers/retention.controller.js');
  return requireAuth(req, res, () => getBackInStockStatus(req, res, next));
});

router.get('/:id', productCtrl.getProductById);

export default router;
