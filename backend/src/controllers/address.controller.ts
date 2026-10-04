// backend/src/controllers/address.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import prisma from '../lib/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export async function getUserAddresses(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, message: 'Addresses fetched', data: addresses });
  } catch (err) {
    next(err);
  }
}

export async function createAddress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, landmark, isDefault } = req.body;
    
    if (isDefault) {
      // Unset previous default
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        fullName,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country: country || 'India',
        landmark,
        isDefault: isDefault ?? false,
      },
    });

    res.status(201).json({ success: true, message: 'Address created', data: address });
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const addressId = req.params.id;

    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) {
      throw new NotFoundError('Address not found or unauthorized');
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    res.json({ success: true, message: 'Address deleted' });
  } catch (err) {
    next(err);
  }
}
