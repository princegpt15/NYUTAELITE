// backend/src/routes/address.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { addressSchema } from '../validators/order.validator.js';
import {
  getUserAddresses,
  createAddress,
  deleteAddress,
} from '../controllers/address.controller.js';

const router = Router();

router.get('/', requireAuth, getUserAddresses);
router.post('/', requireAuth, validate(addressSchema), createAddress);
router.delete('/:id', requireAuth, deleteAddress);

export default router;
