import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  cartValidator,
} from '../controllers/cart.controller.js';

const router = Router();

// All cart routes require authentication
router.get('/', requireAuth, getCart);
router.post('/items', requireAuth, cartValidator.addItem, addItem);
router.patch('/items/:productId', requireAuth, cartValidator.updateQuantity, updateItem);
router.delete('/items/:productId', requireAuth, removeItem);
router.delete('/', requireAuth, clearCart);

export default router;
