// src/services/products.ts
import { api } from './api';
import type { PantryProduct } from '../types';
import productImage from '../assets/images/product-main.png';

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
 */
export const fetchProducts = async (): Promise<PantryProduct[]> => {
  // The generic type mirrors the expected response shape.
  const response = await api.get<{
    success: boolean;
    message: string;
    data: { products: BackendProduct[]; pagination: any };
  }>('/products');

  const backendProducts = response.data.products;

  // Map each backend product to the frontend type.
  const mapped: PantryProduct[] = backendProducts.map((p) => {
    // Determine image URL: if `images` is an array with at least one string, use the first.
    let imageUrl: string = productImage;
    if (Array.isArray(p.images) && typeof p.images[0] === 'string') {
      imageUrl = p.images[0];
    } else if (typeof p.images === 'string') {
      // Some implementations store a single URL directly.
      imageUrl = p.images;
    }

    // Derive quality – fallback to 'Normal' if not provided.
    const quality = (p.category as PantryProduct['quality']) ?? 'Normal';

    // Weight in grams – fallback to 0 if undefined.
    const weightGrams = p.weight ?? 0;

    // MRP (compare at price) – fallback to price if not set.
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
};
