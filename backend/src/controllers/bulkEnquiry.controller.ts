// backend/src/controllers/bulkEnquiry.controller.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { bulkEnquirySchema } from '../validators/bulkEnquiry.validator.js';

export async function createBulkEnquiry(req: Request, res: Response, next: NextFunction) {
  try {
    const parseResult = bulkEnquirySchema.safeParse(req.body);
    if (!parseResult.success) {
      const flatErrors = parseResult.error.issues.map((issue) => issue.message);
      return res.status(422).json({
        success: false,
        message: flatErrors.length > 0 ? flatErrors[0] : 'Validation error in submitted enquiry.',
        error: {
          code: 'VALIDATION_ERROR',
          details: parseResult.error.format(),
          issues: parseResult.error.issues,
        },
      });
    }

    const { name, businessName, phone, email, items, totalQuantity, productGrade, quantity, city, message } =
      parseResult.data;

    // Database-backed duplicate check: prevent rapid double-clicks (last 60 seconds from same phone)
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    const existing = await prisma.contactMessage.findFirst({
      where: {
        phone,
        createdAt: { gte: sixtySecondsAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      // Re-use existing ref ID for idempotent duplicate submissions
      const existingRefMatch = existing.subject.match(/\[(NE-BULK-[A-Z0-9-]+)\]/);
      const existingRef = existingRefMatch ? existingRefMatch[1] : `NE-BULK-${existing.id.slice(0, 8).toUpperCase()}`;
      return res.status(200).json({
        success: true,
        enquiryId: existingRef,
        message: 'Thank you for your enquiry! Our team will contact you with bulk pricing and availability.',
        duplicate: true,
      });
    }

    // Generate collision-safe reference ID with random suffix
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const refId = `NE-BULK-${Date.now().toString().slice(-6)}${randomSuffix}`;

    const effectiveEmail = email || `${phone}@bulk.nutyaelite.com`;

    const payloadDetails = {
      refId,
      name,
      businessName,
      phone,
      email,
      items: items.map((i) => ({
        grade: i.grade,
        quality: i.quality,
        quantityKg: i.quantity,
      })),
      totalQuantityKg: totalQuantity,
      productGrade,
      quantityKg: quantity,
      deliveryLocation: city,
      additionalRequirements: message,
      submittedAt: new Date().toISOString(),
    };

    const itemsSummary = items.map((i) => `${i.grade} [${i.quality}: ${i.quantity}kg]`).join(', ');

    await prisma.contactMessage.create({
      data: {
        name,
        email: effectiveEmail,
        phone,
        subject: `[${refId}] Bulk Order Enquiry - ${itemsSummary} (Total: ${totalQuantity} kg)`,
        message: JSON.stringify(payloadDetails, null, 2),
        status: 'RECEIVED',
      },
    });

    return res.status(201).json({
      success: true,
      enquiryId: refId,
      message: 'Thank you for your enquiry! Our team will contact you with bulk pricing and availability.',
      data: {
        refId,
        items,
        totalQuantityKg: totalQuantity,
        productGrade,
        quantityKg: totalQuantity,
        deliveryLocation: city,
      },
    });
  } catch (error) {
    return next(error);
  }
}
