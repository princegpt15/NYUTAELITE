// src/services/products.ts
import { api } from './api';
import type { PantryProduct } from '../types';
import productImage from '../assets/images/product-main.png';
import { PANTRY_PRODUCTS } from '../data/product';

// Define the shape of the backend product as returned by the API
interface BackendProduct {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null; // Used to map to quality (e.g., 'Premium' or 'Normal')
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  sku?: string | null;
  slug?: string | null;
  images?: any; // Prisma stores Json; could be string[], object, or null
  weight?: number | null; // grams
  isActive: boolean;
}

/**
 * Fetches the product list from the backend and maps it to the frontend `PantryProduct` type.
 *
 * The backend returns data in the shape `{ success, message, data: { products, pagination } }`.
 * We extract the `products` array and translate each field accordingly.
 * If the API is unreachable (e.g., offline or local dev without backend), falls back safely to PANTRY_PRODUCTS.
 */
export const fetchProducts = async (params?: {
  category?: string;
  search?: string;
}): Promise<PantryProduct[]> => {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  const path = qs ? `/products?${qs}` : '/products';

  try {
    // The generic type mirrors the expected response shape.
    const response = await api.get<{
      success: boolean;
      message: string;
      data: { products: BackendProduct[]; pagination: any };
    }>(path);

    const backendProducts = response.data?.products;
    if (!backendProducts || !Array.isArray(backendProducts) || backendProducts.length === 0) {
      return getFilteredFallback(params);
    }

    // Map each backend product to the frontend type.
    const mapped: PantryProduct[] = backendProducts.map((p) => {
      const localMatch = PANTRY_PRODUCTS.find(
        (lp) =>
          lp.slug === p.slug ||
          lp.id === p.slug ||
          lp.sku === p.sku ||
          (lp.quality.toLowerCase() === (p.category || '').toLowerCase() && lp.weightGrams === p.weight)
      );

      let imageUrl: string = localMatch?.image || productImage;
      if (Array.isArray(p.images) && typeof p.images[0] === 'string' && p.images[0].trim() !== '') {
        imageUrl = p.images[0];
      } else if (typeof p.images === 'string' && p.images.trim() !== '') {
        imageUrl = p.images;
      }

      let quality: PantryProduct['quality'] = 'Normal';
      if (
        p.category === 'Premium' ||
        p.name.toLowerCase().includes('premium') ||
        p.sku?.toUpperCase().includes('PREM') ||
        p.slug?.toLowerCase().includes('premium')
      ) {
        quality = 'Premium';
      } else if (
        p.category === 'Normal' ||
        p.name.toLowerCase().includes('normal') ||
        p.sku?.toUpperCase().includes('NORM') ||
        p.slug?.toLowerCase().includes('normal')
      ) {
        quality = 'Normal';
      }

      let weightGrams = p.weight ?? 0;
      if (!weightGrams) {
        if (p.slug?.includes('100') || p.sku?.includes('100')) weightGrams = 100;
        else if (p.slug?.includes('200') || p.sku?.includes('200')) weightGrams = 200;
        else if (p.slug?.includes('250') || p.sku?.includes('250')) weightGrams = 250;
      }

      if (quality === 'Premium' && (imageUrl === productImage || !imageUrl || imageUrl.includes('product-main'))) {
        imageUrl = `/images/products/premium-makhana-${weightGrams}g.png`;
      } else if (quality === 'Normal' && (imageUrl === productImage || !imageUrl || imageUrl.includes('product-main') || (Array.isArray(p.images) && p.images.length === 0))) {
        imageUrl = `/images/products/normal-makhana-${weightGrams}g.png`;
      }

      const mrp = p.compareAtPrice ?? p.price;

      return {
        id: p.id,
        name: p.name,
        quality,
        weightGrams: weightGrams as PantryProduct['weightGrams'],
        price: p.price,
        mrp,
        image: imageUrl,
        stock: p.stock,
        sku: (p.sku ?? '') as string,
        slug: p.slug ?? undefined,
        description: (p.description ?? '') as string,
        active: p.isActive,
      };
    });

    return mapped;
  } catch {
    return getFilteredFallback(params);
  }
};

function getFilteredFallback(params?: { category?: string; search?: string }): PantryProduct[] {
  let list = PANTRY_PRODUCTS;
  if (params?.category) {
    const cat = params.category.toLowerCase();
    list = list.filter((p) => p.quality.toLowerCase() === cat);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }
  return list;
}
