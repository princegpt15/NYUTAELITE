// backend/src/routes/retention.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getWishlist,
  getWishlistCount,
  addWishlistItem,
  removeWishlistItem,
  clearWishlist,
  moveWishlistToCart,
  reorder,
  createReview,
  getProductReviews,
  getProductRatingSummary,
  getMyReviews,
  updateMyReview,
  deleteMyReview,
  subscribeBackInStock,
  unsubscribeBackInStock,
  getBackInStockStatus,
  getMyBackInStock,
  getLoyaltyAccount,
  getLoyaltyTransactions,
  calculateLoyaltyRedemption,
  getReferralInfo,
  applyReferralCode,
  getRecommendations,
  getAccountSummary,
} from '../controllers/retention.controller.js';

const router = Router();

// ================= ACCOUNT SUMMARY =================
router.get('/account/summary', requireAuth, getAccountSummary);

// ================= WISHLIST & SAVE-FOR-LATER =================
router.get('/wishlist', requireAuth, getWishlist);
router.get('/wishlist/count', requireAuth, getWishlistCount);
router.post('/wishlist', requireAuth, addWishlistItem);
router.post('/wishlist/items', requireAuth, addWishlistItem);
router.delete('/wishlist/:productId', requireAuth, removeWishlistItem);
router.delete('/wishlist/items/:productId', requireAuth, removeWishlistItem);
router.delete('/wishlist', requireAuth, clearWishlist);
router.post('/wishlist/:productId/move-to-cart', requireAuth, moveWishlistToCart);
router.post('/wishlist/items/:productId/move-to-cart', requireAuth, moveWishlistToCart);

// ================= BUY AGAIN / REORDER =================
router.post('/orders/:id/reorder', requireAuth, reorder);

// ================= PRODUCT REVIEWS & RATINGS =================
// Public
router.get('/products/:id/reviews', getProductReviews);
router.get('/products/:id/rating-summary', getProductRatingSummary);
// Customer Authenticated
router.post('/products/:id/reviews', requireAuth, createReview);
router.post('/reviews', requireAuth, createReview);
router.get('/reviews/me', requireAuth, getMyReviews);
router.get('/reviews/mine', requireAuth, getMyReviews);
router.put('/reviews/:id', requireAuth, updateMyReview);
router.patch('/reviews/:id', requireAuth, updateMyReview);
router.delete('/reviews/:id', requireAuth, deleteMyReview);

// ================= BACK-IN-STOCK =================
router.post('/products/:id/back-in-stock', requireAuth, subscribeBackInStock);
router.delete('/products/:id/back-in-stock', requireAuth, unsubscribeBackInStock);
router.get('/products/:id/back-in-stock/status', requireAuth, getBackInStockStatus);
router.get('/back-in-stock/me', requireAuth, getMyBackInStock);
router.get('/back-in-stock/mine', requireAuth, getMyBackInStock);

// ================= LOYALTY =================
router.get('/loyalty/account', requireAuth, getLoyaltyAccount);
router.get('/loyalty/me', requireAuth, getLoyaltyAccount);
router.get('/loyalty/transactions', requireAuth, getLoyaltyTransactions);
router.post('/loyalty/calculate-redemption', requireAuth, calculateLoyaltyRedemption);

// ================= REFERRAL =================
router.get('/referral/info', requireAuth, getReferralInfo);
router.get('/referral/me', requireAuth, getReferralInfo);
router.post('/referral/apply', requireAuth, applyReferralCode);

// ================= RECOMMENDATIONS =================
router.get('/products/recommendations', getRecommendations);

export default router;
