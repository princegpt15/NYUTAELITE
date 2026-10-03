// src/routes/product.routes.ts
import { Router } from 'express';
import * as productCtrl from '../controllers/product.controller.js';

const router = Router();

router.get('/', ...productCtrl.getProducts);
router.get('/:id', productCtrl.getProductById);

export default router;
