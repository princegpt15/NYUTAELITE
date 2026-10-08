import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { validateCouponSchema } from '../validators/order.validator.js';
import { validateCouponForCart } from '../controllers/coupon.controller.js';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  moveToWishlist,
  cartValidator,
} from '../controllers/cart.controller.js';

const router = Router();

// All cart routes require authentication
router.get('/', requireAuth, getCart);
router.post('/items', requireAuth, cartValidator.addItem, addItem);
router.patch('/items/:productId', requireAuth, cartValidator.updateQuantity, updateItem);
router.delete('/items/:productId', requireAuth, removeItem);
router.delete('/', requireAuth, clearCart);
router.post('/items/:productId/move-to-wishlist', requireAuth, moveToWishlist);

// Validate coupon against authenticated user's cart
router.post('/coupon', requireAuth, validate(validateCouponSchema, 'body'), validateCouponForCart);

export default router;
