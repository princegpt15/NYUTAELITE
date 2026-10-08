import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware.js';

import prisma from '../lib/prisma.js';

const cartService = new CartService();

// Validation schemas
const addItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().optional(),
  quantity: z.number().int().positive(),
  price: z.number().positive().optional(),
  mrp: z.number().optional(),
  image: z.string().optional(),
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
    let { productId, productName, quantity, price, mrp, image } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (product) {
      productName = product.name;
      price = product.price; // Server authoritative DB price
      mrp = product.compareAtPrice ?? product.price;
      if (!image && Array.isArray(product.images) && product.images.length > 0) {
        image = String(product.images[0]);
      }
    }

    const item = await cartService.addItem(userId, {
      productId,
      productName: productName || 'Makhana Pack',
      quantity,
      price: price || 0,
      mrp,
      image,
    });
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

export const moveToWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { productId } = req.params;
    const { wishlistService } = await import('../services/wishlist.service.js');
    await wishlistService.addItem(userId, productId);
    await cartService.removeItem(userId, productId);
    res.json({ success: true, message: 'Item moved to wishlist' });
  } catch (err) {
    next(err);
  }
};

export const cartValidator = {
  addItem: validate(addItemSchema),
  updateQuantity: validate(updateQuantitySchema),
};
