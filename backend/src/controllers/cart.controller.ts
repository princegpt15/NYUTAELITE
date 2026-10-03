import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware.js';

const cartService = new CartService();

// Validation schemas
const addItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  mrp: z.number().optional(),
  image: z.string().url().optional(),
});

const updateQuantitySchema = z.object({
  quantity: z.number().int().positive(),
});

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const cart = await cartService.getCart(userId);
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

export const addItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const item = await cartService.addItem(userId, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const updateItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { productId } = req.params;
    const { quantity } = req.body;
    const item = await cartService.updateQuantity(userId, productId, quantity);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const removeItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { productId } = req.params;
    await cartService.removeItem(userId, productId);
    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    next(err);
  }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    await cartService.clearCart(userId);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
};

export const cartValidator = {
  addItem: validate(addItemSchema),
  updateQuantity: validate(updateQuantitySchema),
};
