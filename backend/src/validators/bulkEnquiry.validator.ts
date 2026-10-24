// backend/src/validators/bulkEnquiry.validator.ts
import { z } from 'zod';

export const PERMITTED_GRADES = [
  '4 Sutta Makhana',
  '5 Sutta Makhana',
  '5.5 Sutta Makhana',
  '6 Sutta Makhana',
] as const;

export const QUALITY_OPTIONS = ['Hand Picked', 'Normal'] as const;
export type QualityOption = (typeof QUALITY_OPTIONS)[number];

export const MAX_ENQUIRY_QUANTITY_KG = 100000; // 100 metric tons

const gradeMapping: Record<string, (typeof PERMITTED_GRADES)[number]> = {
  '4 sutta': '4 Sutta Makhana',
  '4 sutta makhana': '4 Sutta Makhana',
  '5 sutta': '5 Sutta Makhana',
  '5 sutta makhana': '5 Sutta Makhana',
  '5.5 sutta': '5.5 Sutta Makhana',
  '5.5 sutta makhana': '5.5 Sutta Makhana',
  '6 sutta': '6 Sutta Makhana',
  '6 sutta makhana': '6 Sutta Makhana',
};

const qualityMapping: Record<string, QualityOption> = {
  'hand picked': 'Hand Picked',
  'handpicked': 'Hand Picked',
  'hand-picked': 'Hand Picked',
  'normal': 'Normal',
  'standard': 'Normal',
};

export const bulkEnquiryItemSchema = z.object({
  grade: z
    .string({ required_error: 'Please select a makhana grade.' })
    .trim()
    .superRefine((val, ctx) => {
      const lower = val.toLowerCase();
      if (!gradeMapping[lower]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Invalid makhana grade. Permitted grades: 4 Sutta Makhana, 5 Sutta Makhana, 5.5 Sutta Makhana, 6 Sutta Makhana.',
        });
      }
    })
    .transform((val) => gradeMapping[val.toLowerCase()]),

  quality: z
    .string()
    .trim()
    .optional()
    .transform((val) => {
      if (!val) return 'Normal' as QualityOption;
      const lower = val.toLowerCase();
      return qualityMapping[lower] || ('Normal' as QualityOption);
    }),

  quantity: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val.trim()) : Number(val)),
    z
      .number({ invalid_type_error: 'Please specify a valid quantity in kilograms.' })
      .refine((val) => Number.isFinite(val), 'Quantity must be a finite number.')
      .refine((val) => val > 0, 'Please specify a valid positive quantity in kilograms.')
      .refine(
        (val) => val <= MAX_ENQUIRY_QUANTITY_KG,
        `Quantity exceeds maximum allowable bulk enquiry limit (${MAX_ENQUIRY_QUANTITY_KG.toLocaleString()} kg). For institutional exports exceeding 100 tons, please contact our wholesale trade desk directly.`
      )
  ),
});

export type BulkEnquiryItem = z.infer<typeof bulkEnquiryItemSchema>;

export const bulkEnquirySchema = z
  .object({
    name: z
      .string({ required_error: 'Please provide your full name.' })
      .trim()
      .min(2, 'Please provide your full name (at least 2 characters).')
      .max(100, 'Full name cannot exceed 100 characters.')
      .refine((val) => !/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(val), {
        message: 'Full name contains invalid control characters.',
      }),

    businessName: z
      .string()
      .trim()
      .max(150, 'Business name cannot exceed 150 characters.')
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform((val) => (val && typeof val === 'string' && val.trim() ? val.trim() : null)),

    phone: z
      .string({ required_error: 'Please provide a valid 10-digit phone number.' })
      .trim()
      .transform((val) => val.replace(/[\s\-+()]/g, ''))
      .refine((val) => /^\d{10,15}$/.test(val), {
        message: 'Please provide a valid 10-digit phone number.',
      }),

    email: z
      .string()
      .trim()
      .max(254, 'Email address cannot exceed 254 characters.')
      .optional()
      .nullable()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        },
        { message: 'Please provide a valid email address.' }
      )
      .transform((val) => (val && typeof val === 'string' && val.trim() ? val.trim() : null)),

    // Multi-item support:
    items: z.array(bulkEnquiryItemSchema).optional(),

    // Single-item fallback (backward compatibility):
    productGrade: z
      .string()
      .trim()
      .optional()
      .superRefine((val, ctx) => {
        if (!val) return;
        const lower = val.toLowerCase();
        if (!gradeMapping[lower]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'Invalid makhana grade. Permitted grades: 4 Sutta Makhana, 5 Sutta Makhana, 5.5 Sutta Makhana, 6 Sutta Makhana.',
          });
        }
      })
      .transform((val) => (val ? gradeMapping[val.toLowerCase()] : undefined)),

    quality: z
      .string()
      .trim()
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const lower = val.toLowerCase();
        return qualityMapping[lower] || 'Normal';
      }),

    quantity: z.preprocess(
      (val) => (val !== undefined && val !== null && val !== '' ? Number(val) : undefined),
      z
        .number({ invalid_type_error: 'Please specify a valid quantity in kilograms.' })
        .refine((val) => Number.isFinite(val), 'Quantity must be a finite number.')
        .refine((val) => val > 0, 'Please specify a valid positive quantity in kilograms.')
        .refine(
          (val) => val <= MAX_ENQUIRY_QUANTITY_KG,
          `Quantity exceeds maximum allowable bulk enquiry limit (${MAX_ENQUIRY_QUANTITY_KG.toLocaleString()} kg).`
        )
        .optional()
    ),

    city: z
      .string({ required_error: 'Please provide your destination city and state.' })
      .trim()
      .min(2, 'Please provide your destination city and state.')
      .max(200, 'Destination city and state cannot exceed 200 characters.'),

    message: z
      .string()
      .trim()
      .max(2000, 'Additional requirements cannot exceed 2,000 characters.')
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform((val) => (val && typeof val === 'string' && val.trim() ? val.trim() : null)),
  })
  .superRefine((data, ctx) => {
    const hasItems = Array.isArray(data.items) && data.items.length > 0;
    const hasSingle = Boolean(data.productGrade && data.quantity);
    if (!hasItems && !hasSingle) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please provide at least one makhana grade and quality selection with a valid quantity.',
        path: ['items'],
      });
    }
  })
  .transform((data) => {
    let resolvedItems: Array<{ grade: (typeof PERMITTED_GRADES)[number]; quality: QualityOption; quantity: number }> =
      [];

    if (Array.isArray(data.items) && data.items.length > 0) {
      resolvedItems = data.items;
    } else if (data.productGrade && data.quantity) {
      resolvedItems = [
        {
          grade: data.productGrade,
          quality: data.quality || 'Normal',
          quantity: data.quantity,
        },
      ];
    }

    const totalQuantity = resolvedItems.reduce((sum, item) => sum + item.quantity, 0);
    const formattedGradeString = resolvedItems
      .map((item) => `${item.grade} (${item.quality}: ${item.quantity} kg)`)
      .join(', ');

    return {
      ...data,
      items: resolvedItems,
      totalQuantity,
      productGrade: formattedGradeString,
      quantity: totalQuantity,
    };
  });

export type BulkEnquiryInput = z.infer<typeof bulkEnquirySchema>;
