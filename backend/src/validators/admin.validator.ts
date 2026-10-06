// backend/src/validators/admin.validator.ts
import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export const adminOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED']).optional(),
  shippingStatus: z.enum(['PENDING', 'SHIPPED', 'DELIVERED', 'RETURNED']).optional(),
  from: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  to: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export const updateOrderStatusSchema = z
  .object({
    orderStatus: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
    shippingStatus: z.enum(['PENDING', 'SHIPPED', 'DELIVERED', 'RETURNED']).optional(),
  })
  .strict({ message: 'Only orderStatus and shippingStatus can be updated. Arbitrary or payment fields are forbidden.' })
  .refine((data) => data.orderStatus !== undefined || data.shippingStatus !== undefined, {
    message: 'At least one of orderStatus or shippingStatus must be provided',
  });

export const adminProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .or(z.boolean())
    .optional(),
  lowStock: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .or(z.boolean())
    .optional(),
});

export const createProductSchema = z
  .object({
    name: z.string().trim().min(1, 'Product name is required').max(200),
    slug: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).optional().nullable(),
    category: z.string().trim().max(100).optional().nullable(),
    price: z.number({ invalid_type_error: 'Price must be a number' }).positive('Price must be greater than zero'),
    compareAtPrice: z.number({ invalid_type_error: 'compareAtPrice must be a number' }).positive('Compare at price must be greater than zero').optional().nullable(),
    stock: z.number({ invalid_type_error: 'Stock must be an integer' }).int().min(0, 'Stock cannot be negative').default(0),
    sku: z.string().trim().min(1, 'SKU is required').max(100),
    images: z.any().optional().nullable(),
    ingredients: z.any().optional().nullable(),
    weight: z.number({ invalid_type_error: 'Weight must be a number' }).positive('Weight must be positive').optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .strict();

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    slug: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).optional().nullable(),
    category: z.string().trim().max(100).optional().nullable(),
    price: z.number({ invalid_type_error: 'Price must be a number' }).positive('Price must be greater than zero').optional(),
    compareAtPrice: z.number({ invalid_type_error: 'compareAtPrice must be a number' }).positive('Compare at price must be greater than zero').optional().nullable(),
    stock: z.number({ invalid_type_error: 'Stock must be an integer' }).int().min(0, 'Stock cannot be negative').optional(),
    sku: z.string().trim().min(1).max(100).optional(),
    images: z.any().optional().nullable(),
    ingredients: z.any().optional().nullable(),
    weight: z.number({ invalid_type_error: 'Weight must be a number' }).positive('Weight must be positive').optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .strict({ message: 'Only editable product attributes are allowed. ID and system metadata are immutable.' });

export const adminCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export const adminPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED']).optional(),
  orderStatus: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
});
