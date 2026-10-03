// src/controllers/product.controller.ts
import { Request, Response } from 'express';
import { ProductService } from '../services/product.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { z } from 'zod';

// instantiate service
const productService = new ProductService();

// Validation for query parameters (page, limit, category, search)
const querySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Number(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? Number(v) : 12)),
  category: z.string().optional(),
  search: z.string().optional(),
});

export const getProducts = [
  validate(querySchema, 'query'),
  async (req: Request, res: Response) => {
    const { page, limit, category, search } = req.query as any;
    const result = await productService.listProducts({ page, limit, category, search });
    return res.status(200).json({ success: true, message: 'Products fetched', data: result });
  },
];

export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await productService.getProductById(id);
  return res.status(200).json({ success: true, message: 'Product fetched', data: product });
};
