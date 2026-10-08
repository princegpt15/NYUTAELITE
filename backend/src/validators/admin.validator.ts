// backend/src/validators/admin.validator.ts
import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export const orderIdParamSchema = z.object({
  id: z.string().uuid('Invalid order ID format'),
});

export const adminOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
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

export const refundOrderSchema = z
  .object({
    amount: z
      .number({ invalid_type_error: 'Refund amount must be a valid number' })
      .finite('Refund amount must be finite')
      .positive('Refund amount must be greater than zero')
      .refine((val) => Math.abs(Math.round(val * 100) - val * 100) < 1e-6, {
        message: 'Refund amount can have at most 2 decimal places (paise precision)',
      })
      .optional(),
    reason: z.string().trim().min(1).max(500, 'Refund reason cannot exceed 500 characters').optional(),
  })
  .strict({
    message:
      'Only optional amount and reason are permitted. Financial and payment fields (userId, paymentId, paymentStatus, orderStatus, capturedAmount, providerPaymentId) are strictly server-controlled.',
  });

export const couponIdParamSchema = z.object({
  id: z.string().uuid('Invalid coupon ID format'),
});

export const adminCouponsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
  search: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .or(z.boolean())
    .optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  validity: z.enum(['ALL', 'VALID', 'EXPIRED', 'SCHEDULED']).optional(),
});

const dateStringSchema = z
  .string()
  .trim()
  .refine((val) => !Number.isNaN(new Date(val).getTime()), {
    message: 'Invalid date format',
  });

export const createCouponSchema = z
  .object({
    code: z
      .string({ required_error: 'Coupon code is required' })
      .trim()
      .min(2, 'Coupon code must be at least 2 characters')
      .max(32, 'Coupon code cannot exceed 32 characters')
      .transform((val) => val.toUpperCase())
      .refine((val) => /^[A-Z0-9_-]{2,32}$/.test(val), {
        message: 'Coupon code can only contain uppercase letters, numbers, hyphens, and underscores',
      }),
    description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
    discountType: z.enum(['PERCENTAGE', 'FIXED'], {
      required_error: 'Discount type (PERCENTAGE or FIXED) is required',
      invalid_type_error: 'Discount type must be PERCENTAGE or FIXED',
    }),
    discountValue: z
      .number({ required_error: 'Discount value is required', invalid_type_error: 'Discount value must be a number' })
      .finite('Discount value must be finite')
      .positive('Discount value must be greater than zero'),
    minimumOrderAmount: z
      .number({ invalid_type_error: 'Minimum order amount must be a number' })
      .finite('Minimum order amount must be finite')
      .min(0, 'Minimum order amount cannot be negative')
      .optional()
      .nullable(),
    maximumDiscount: z
      .number({ invalid_type_error: 'Maximum discount must be a number' })
      .finite('Maximum discount must be finite')
      .positive('Maximum discount must be greater than zero')
      .optional()
      .nullable(),
    maximumDiscountAmount: z
      .number({ invalid_type_error: 'Maximum discount amount must be a number' })
      .finite('Maximum discount amount must be finite')
      .positive('Maximum discount amount must be greater than zero')
      .optional()
      .nullable(),
    startsAt: dateStringSchema.optional().nullable(),
    expiresAt: dateStringSchema.optional().nullable(),
    usageLimit: z
      .number({ invalid_type_error: 'Usage limit must be an integer' })
      .int('Usage limit must be an integer')
      .min(1, 'Usage limit must be at least 1')
      .optional()
      .nullable(),
    perCustomerLimit: z
      .number({ invalid_type_error: 'Per-customer limit must be an integer' })
      .int('Per-customer limit must be an integer')
      .min(1, 'Per-customer limit must be at least 1')
      .optional()
      .nullable(),
    isActive: z.boolean().default(true),
  })
  .strict({ message: 'Unrecognized or system-controlled coupon fields are forbidden.' })
  .superRefine((data, ctx) => {
    if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Percentage discount cannot exceed 100%',
      });
    }
    if (data.startsAt && data.expiresAt) {
      const startMs = new Date(data.startsAt).getTime();
      const endMs = new Date(data.expiresAt).getTime();
      if (startMs >= endMs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['expiresAt'],
          message: 'Expiry date must be later than start date',
        });
      }
    }
  });

export const updateCouponSchema = z
  .object({
    description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
    discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    discountValue: z
      .number({ invalid_type_error: 'Discount value must be a number' })
      .finite('Discount value must be finite')
      .positive('Discount value must be greater than zero')
      .optional(),
    minimumOrderAmount: z
      .number({ invalid_type_error: 'Minimum order amount must be a number' })
      .finite('Minimum order amount must be finite')
      .min(0, 'Minimum order amount cannot be negative')
      .optional()
      .nullable(),
    maximumDiscount: z
      .number({ invalid_type_error: 'Maximum discount must be a number' })
      .finite('Maximum discount must be finite')
      .positive('Maximum discount must be greater than zero')
      .optional()
      .nullable(),
    maximumDiscountAmount: z
      .number({ invalid_type_error: 'Maximum discount amount must be a number' })
      .finite('Maximum discount amount must be finite')
      .positive('Maximum discount amount must be greater than zero')
      .optional()
      .nullable(),
    startsAt: dateStringSchema.optional().nullable(),
    expiresAt: dateStringSchema.optional().nullable(),
    usageLimit: z
      .number({ invalid_type_error: 'Usage limit must be an integer' })
      .int('Usage limit must be an integer')
      .min(1, 'Usage limit must be at least 1')
      .optional()
      .nullable(),
    perCustomerLimit: z
      .number({ invalid_type_error: 'Per-customer limit must be an integer' })
      .int('Per-customer limit must be at least 1')
      .optional()
      .nullable(),
    isActive: z.boolean().optional(),
  })
  .strict({
    message:
      'Only allowed coupon fields can be updated. Coupon code, ID, and usedCount are immutable.',
  })
  .superRefine((data, ctx) => {
    if (data.discountType === 'PERCENTAGE' && data.discountValue !== undefined && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Percentage discount cannot exceed 100%',
      });
    }
    if (data.startsAt && data.expiresAt) {
      const startMs = new Date(data.startsAt).getTime();
      const endMs = new Date(data.expiresAt).getTime();
      if (startMs >= endMs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['expiresAt'],
          message: 'Expiry date must be later than start date',
        });
      }
    }
  });

export const notificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid notification ID format'),
});

export const adminNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be >= 1').max(10000).default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be >= 1').max(100, 'Limit cannot exceed 100').default(20),
  status: z.enum(['PENDING', 'SENDING', 'SENT', 'FAILED']).optional(),
  channel: z.enum(['EMAIL', 'WHATSAPP']).optional(),
  type: z
    .enum([
      'ORDER_CONFIRMED',
      'ORDER_PROCESSING',
      'ORDER_SHIPPED',
      'ORDER_DELIVERED',
      'ORDER_CANCELLED',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILED',
      'REFUND_INITIATED',
      'REFUND_COMPLETED',
    ])
    .optional(),
  orderId: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100, 'Search query cannot exceed 100 characters').optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
});

const analyticsRangeEnum = z.enum([
  'today',
  'yesterday',
  'last_7_days',
  '7d',
  'last_30_days',
  '30d',
  'this_month',
  'previous_month',
  'this_year',
  'custom',
]);

const analyticsGranularityEnum = z.enum(['auto', 'daily', 'weekly', 'monthly']);

export const analyticsQuerySchema = z
  .object({
    range: analyticsRangeEnum.optional(),
    startDate: z.string().trim().max(64).optional(),
    endDate: z.string().trim().max(64).optional(),
    granularity: analyticsGranularityEnum.optional(),
  })
  .strict({ message: 'Unknown query parameters are not permitted on analytics endpoints.' });

export const analyticsProductsQuerySchema = z
  .object({
    range: analyticsRangeEnum.optional(),
    startDate: z.string().trim().max(64).optional(),
    endDate: z.string().trim().max(64).optional(),
    granularity: analyticsGranularityEnum.optional(),
    page: z.coerce.number().int().min(1, 'Page must be >= 1').max(10000).default(1),
    limit: z.coerce.number().int().min(1, 'Limit must be >= 1').max(100, 'Limit cannot exceed 100').default(20),
    category: z.string().trim().max(100).optional(),
    search: z.string().trim().max(100).optional(),
    sortBy: z.enum(['revenue', 'unitsSold', 'orders', 'stock']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    performance: z.enum(['all', 'top', 'low']).optional(),
  })
  .strict({ message: 'Unknown query parameters are not permitted on product analytics.' });

export const analyticsPaginatedQuerySchema = z
  .object({
    range: analyticsRangeEnum.optional(),
    startDate: z.string().trim().max(64).optional(),
    endDate: z.string().trim().max(64).optional(),
    granularity: analyticsGranularityEnum.optional(),
    page: z.coerce.number().int().min(1, 'Page must be >= 1').max(10000).default(1),
    limit: z.coerce.number().int().min(1, 'Limit must be >= 1').max(100, 'Limit cannot exceed 100').default(20),
    search: z.string().trim().max(100).optional(),
  })
  .strict({ message: 'Unknown query parameters are not permitted on analytics endpoints.' });
