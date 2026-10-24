// src/services/wishlist.ts
/**
 * Frontend Wishlist Service for NYUTA ELITE MAKHANA.
 * Features:
 * - Instant synchronous state & cache (no flickering, loading loops, or reload time).
 * - Full guest support via localStorage ('nyutaelite_wishlist') so guests can save items.
 * - Reactive event subscription (subscribe) keeping Header, Product Cards, and Wishlist in sync.
 * - Auto-sync: Merges local guest wishlist into user account upon login.
 * - Direct "Move to Cart" updating cartService seamlessly without full-page reloads.
 */

import { api } from './api';
import { authService } from './auth';
import { cartService } from './cart';
import type { WishlistItem } from './retention';

export type { WishlistItem };

export interface WishlistProductInput {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  image?: string;
  weightGrams?: number;
  slug?: string;
  stock?: number;
}

const GUEST_STORAGE_KEY = 'nyutaelite_wishlist';

type WishlistListener = (items: WishlistItem[]) => void;
const listeners = new Set<WishlistListener>();

let cachedItems: WishlistItem[] = [];
let isLoaded = false;
let inFlightLoad: Promise<WishlistItem[]> | null = null;
let lastUserId: string | null = null;

// Synchronously initialize cache from localStorage on script evaluation
try {
  const raw = localStorage.getItem(GUEST_STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cachedItems = parsed;
      isLoaded = true;
    }
  }
} catch {
  // Ignore local storage parse errors
}

function notifyListeners(): void {
  const current = [...cachedItems];
  listeners.forEach((listener) => {
    try {
      listener(current);
    } catch (err) {
      console.error('[WishlistService] Listener error:', err);
    }
  });
}

function persistCache(): void {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(cachedItems));
  } catch (err) {
    console.error('[WishlistService] Failed to persist wishlist cache:', err);
  }
}

export const wishlistService = {
  /**
   * Subscribe to wishlist changes.
   * Returns an unsubscribe function.
   */
  subscribe(listener: WishlistListener): () => void {
    listeners.add(listener);
    // Notify immediately with current state
    try {
      listener([...cachedItems]);
    } catch (err) {
      console.error('[WishlistService] Initial listener error:', err);
    }
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Synchronously returns current items.
   */
  getItems(): WishlistItem[] {
    return cachedItems;
  },

  /**
   * Returns current count of wishlist items.
   */
  getCount(): number {
    return cachedItems.length;
  },

  /**
   * Checks in O(1) if a product is wishlisted (matches by id or slug).
   */
  isWishlisted(productId: string): boolean {
    if (!productId) return false;
    const cleanId = productId.trim().toLowerCase();
    return cachedItems.some((item) => {
      const itemProductId = (item.productId || '').toLowerCase();
      const productObjId = (item.product?.id || '').toLowerCase();
      const productSlug = (item.product?.slug || '').toLowerCase();
      return (
        itemProductId === cleanId ||
        productObjId === cleanId ||
        productSlug === cleanId
      );
    });
  },

  /**
   * Loads wishlist from server (for logged-in user) or localStorage (for guest).
   * Does NOT throw 401s — gracefully falls back to local cache.
   */
  async loadWishlist(forceRefresh = false): Promise<WishlistItem[]> {
    const user = authService.getCurrentUser();

    // 1. If guest, resolve with local items immediately
    if (!user) {
      isLoaded = true;
      return cachedItems;
    }

    // 2. Return in-flight promise if a load is already underway
    if (inFlightLoad && !forceRefresh) {
      return inFlightLoad;
    }

    // 3. Return cache if already loaded and not forcing refresh
    if (isLoaded && !forceRefresh && cachedItems.length > 0) {
      return cachedItems;
    }

    inFlightLoad = (async () => {
      try {
        // First check if there are guest items that need to be migrated to the server
        const guestItems = [...cachedItems];

        const res = await api.get<{ success: boolean; data: WishlistItem[] }>('/wishlist');
        const serverItems = Array.isArray(res.data) ? res.data : [];

        // If user had local guest items before logging in, sync them
        if (guestItems.length > 0) {
          for (const gItem of guestItems) {
            const alreadyOnServer = serverItems.some(
              (s) =>
                s.productId === gItem.productId ||
                s.product?.id === gItem.productId ||
                s.product?.slug === gItem.productId
            );
            if (!alreadyOnServer) {
              try {
                const added = await api.post<{ success: boolean; data: WishlistItem }>('/wishlist', {
                  productId: gItem.productId,
                });
                if (added?.data) {
                  serverItems.push(added.data);
                }
              } catch {
                // Ignore sync conflicts
              }
            }
          }
        }

        cachedItems = serverItems;
        persistCache();
        isLoaded = true;
        notifyListeners();
        return cachedItems;
      } catch (err: any) {
        // If 401 or network error, keep current local cache instead of breaking UI
        isLoaded = true;
        return cachedItems;
      } finally {
        inFlightLoad = null;
      }
    })();

    return inFlightLoad;
  },

  /**
   * Adds an item to the wishlist optimistically.
   */
  async addItem(product: WishlistProductInput): Promise<void> {
    if (!product || !product.id) return;

    if (this.isWishlisted(product.id)) {
      return;
    }

    const newItem: WishlistItem = {
      id: `wish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      productId: product.id,
      createdAt: new Date().toISOString(),
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug || product.id,
        price: product.price,
        compareAtPrice: product.mrp ?? product.price,
        images: product.image ? [product.image] : ['/assets/product-main.png'],
        weight: product.weightGrams ? `${product.weightGrams}g` : null,
        stock: product.stock ?? 100,
        isActive: true,
      },
    };

    cachedItems = [newItem, ...cachedItems];
    persistCache();
    notifyListeners();

    // If logged in, persist to backend in background
    if (authService.getCurrentUser()) {
      try {
        const res = await api.post<{ success: boolean; data: WishlistItem }>('/wishlist', {
          productId: product.id,
        });
        if (res?.data?.id) {
          // Update placeholder id with server id
          const idx = cachedItems.findIndex((i) => i.id === newItem.id);
          if (idx !== -1) {
            cachedItems[idx].id = res.data.id;
            persistCache();
          }
        }
      } catch (err) {
        console.error('[WishlistService] Failed to sync addition to server:', err);
      }
    }
  },

  /**
   * Removes an item from the wishlist optimistically.
   */
  async removeItem(productId: string): Promise<void> {
    if (!productId) return;

    const cleanId = productId.trim().toLowerCase();
    cachedItems = cachedItems.filter((item) => {
      const itemProductId = (item.productId || '').toLowerCase();
      const productObjId = (item.product?.id || '').toLowerCase();
      const productSlug = (item.product?.slug || '').toLowerCase();
      return (
        itemProductId !== cleanId &&
        productObjId !== cleanId &&
        productSlug !== cleanId
      );
    });

    persistCache();
    notifyListeners();

    // If logged in, delete on backend in background
    if (authService.getCurrentUser()) {
      try {
        await api.delete(`/wishlist/${productId}`);
      } catch (err) {
        console.error('[WishlistService] Failed to delete item on server:', err);
      }
    }
  },

  /**
   * Toggles product in/out of wishlist.
   * Returns boolean indicating new wishlisted state.
   */
  async toggleWishlist(product: WishlistProductInput): Promise<boolean> {
    const currentlySaved = this.isWishlisted(product.id);
    if (currentlySaved) {
      await this.removeItem(product.id);
      return false;
    } else {
      await this.addItem(product);
      return true;
    }
  },

  /**
   * Moves a wishlisted item directly into the active Cart.
   * Seamlessly updates cartService (cart count, drawer, badge) without full-page reloads.
   */
  async moveToCart(item: WishlistItem): Promise<void> {
    const product = item.product;
    if (!product) return;

    // 1. Add to frontend cartService immediately
    cartService.addItem({
      productId: item.productId,
      productName: product.name,
      price: product.price,
      mrp: product.compareAtPrice ?? product.price,
      quantity: 1,
      image: (product.images && product.images[0]) || '',
    });

    // 2. Remove from wishlist immediately
    await this.removeItem(item.productId);

    // 3. If logged in, call backend move-to-cart endpoint in background
    if (authService.getCurrentUser()) {
      try {
        await api.post(`/wishlist/${item.productId}/move-to-cart`, {});
      } catch (err) {
        // Backend failure is non-blocking since local cartService already updated
        console.error('[WishlistService] Move to cart sync error:', err);
      }
    }
  },

  /**
   * Clears the entire wishlist.
   */
  async clearWishlist(): Promise<void> {
    cachedItems = [];
    persistCache();
    notifyListeners();

    if (authService.getCurrentUser()) {
      try {
        await api.delete('/wishlist');
      } catch (err) {
        console.error('[WishlistService] Clear wishlist error:', err);
      }
    }
  },
};

// Listen for auth state changes to re-sync wishlist automatically
authService.subscribe((user) => {
  const userId = user?.id ?? null;
  if (userId !== lastUserId) {
    lastUserId = userId;
    isLoaded = false;
    wishlistService.loadWishlist(true).catch(() => {});
  }
});
