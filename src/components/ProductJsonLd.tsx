import React from 'react';
import type { PantryProduct } from '../types';

/**
 * Product structured data is managed centrally by `applySeoToDocument`
 * in `src/utils/seo.ts` to ensure consistent lifecycle and prevent duplicate JSON-LD tags.
 */
export const ProductJsonLd: React.FC<{ product?: PantryProduct }> = () => null;
