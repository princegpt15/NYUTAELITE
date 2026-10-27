import React from 'react';
import { buildProductJsonLd } from '../utils/seo';
import type { PantryProduct } from '../types';

/**
 * React component that injects Product JSON‑LD structured data into the page.
 * It uses `buildProductJsonLd` to generate a schema.org Product object from the
 * authoritative product data and renders it as a <script type="application/ld+json">
 * tag. This ensures the markup is crawlable without affecting client‑side UI.
 */
export const ProductJsonLd: React.FC<{ product: PantryProduct }> = ({ product }) => {
  const jsonLd = buildProductJsonLd(product);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};
