// src/services/cart.ts
import type { CartItem } from '../types';
import { api } from './api';
import { authService } from './auth';
import { trackAddToCart, trackRemoveFromCart } from './analytics';
import productImage from '../assets/images/product-main.png';

// Guest cart uses localStorage key
const CART_STORAGE_KEY = 'nyutaelite_cart';

type CartListener = (items: CartItem[]) => void;
const listeners = new Set<CartListener>();

// In-memory cache for authenticated users
let cachedItems: CartItem[] = [];
let authCartLoaded = false;
let lastAuthUserId: string | null = null;
// Promise to avoid duplicate initialization requests
let initPromise: Promise<void> | null = null;

function notify(items: CartItem[]) {
  listeners.forEach((cb) => cb(items));
}

function mapServerCartItem(item: any): CartItem {
  return {
    productId: item.productId,
    productName: item.productName,
    quality: item.quality ?? 'Normal',
    weightGrams: item.weightGrams ?? 100,
    price: Number(item.price),
    mrp: item.mrp != null ? Number(item.mrp) : Number(item.price),
    quantity: Number(item.quantity),
    image: item.image || productImage,
  };
}

/** Guest helpers */
function getGuestItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY) ?? '[]';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveGuestItems(items: CartItem[]): CartItem[] {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  notify(items);
  return items;
}

/** Authenticated helpers */
async function loadAuthenticatedCart(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const resp = await api.get<{ success: true; data: any }>('/cart');
      const rawData = resp?.data;
      const rawItems = Array.isArray(rawData)
        ? rawData
        : rawData && Array.isArray(rawData.items)
        ? rawData.items
        : [];
      cachedItems = rawItems.map(mapServerCartItem);
      authCartLoaded = true;
      notify(cachedItems);
    } catch (e) {
      console.error('Failed to load authenticated cart:', e);
    } finally {
      initPromise = null;
    }
  })();
  return initPromise;
}

function ensureAuthCartInitialized(): void {
  const currentUser = authService.getCurrentUser();
  const currentUserId = currentUser?.id ?? null;

  if (currentUserId !== lastAuthUserId) {
    lastAuthUserId = currentUserId;
    authCartLoaded = false;
    cachedItems = [];
  }

  if (currentUser && !authCartLoaded) {
    loadAuthenticatedCart().catch((e) => console.error(e));
  }
}

export const cartService = {
  /** Returns the current cart items synchronously. */
  getItems(): CartItem[] {
    const user = authService.getCurrentUser();
    if (user) {
      ensureAuthCartInitialized();
      return cachedItems;
    }
    // If not authenticated, reset auth tracking state so next login reloads cleanly
    if (lastAuthUserId !== null) {
      lastAuthUserId = null;
      authCartLoaded = false;
      cachedItems = [];
    }
    return getGuestItems();
  },

  /** Adds an item to the cart. Returns the new cache synchronously. */
  addItem(item: {
    productId: string;
    productName: string;
    quality?: CartItem['quality'];
    weightGrams?: number;
    price: number;
    mrp?: number;
    quantity: number;
    image?: string;
  }): CartItem[] {
    const trackedCartItem: CartItem = {
      productId: item.productId,
      productName: item.productName,
      quality: item.quality ?? ('Normal' as any),
      weightGrams: item.weightGrams ?? 100,
      price: item.price,
      mrp: item.mrp ?? item.price,
      quantity: item.quantity,
      image: item.image ?? '',
    };

    if (authService.getCurrentUser()) {
      // Optimistic local update
      const existing = cachedItems.find((i) => i.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.price = item.price;
        existing.mrp = item.mrp ?? existing.mrp;
      } else {
        cachedItems.push({ ...trackedCartItem });
      }
      notify(cachedItems);

      // Backend request — emit GA4 add_to_cart only after API confirms success
      (async () => {
        try {
          const payload: any = {
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            mrp: item.mrp,
          };
          if (item.image && (item.image.startsWith('http://') || item.image.startsWith('https://'))) {
            payload.image = item.image;
          }
          const resp = await api.post<{ success: true; data: any }>('/cart/items', payload);
          if (resp?.data) {
            const mapped = mapServerCartItem(resp.data);
            const idx = cachedItems.findIndex((i) => i.productId === mapped.productId);
            if (idx >= 0) {
              cachedItems[idx] = {
                ...cachedItems[idx],
                ...mapped,
                quality: item.quality ?? cachedItems[idx].quality,
                weightGrams: item.weightGrams ?? cachedItems[idx].weightGrams,
              };
            } else {
              cachedItems.push({
                ...mapped,
                quality: item.quality ?? 'Normal',
                weightGrams: item.weightGrams ?? 100,
              });
            }
            notify(cachedItems);
          }
          trackAddToCart(trackedCartItem, item.quantity);
        } catch (e) {
          console.error('addItem API error:', e);
          loadAuthenticatedCart().catch(() => {});
        }
      })();
      return cachedItems;
    }

    // Guest behaviour
    const items = getGuestItems();
    const existing = items.find((i) => i.productId === item.productId);
    if (existing) {
      existing.quantity += item.quantity;
      existing.price = item.price;
      existing.mrp = item.mrp ?? existing.mrp;
    } else {
      items.push({ ...trackedCartItem });
    }
    const saved = saveGuestItems(items);
    trackAddToCart(trackedCartItem, item.quantity);
    return saved;
  },

  /** Updates quantity of a product. */
  updateQuantity(productId: string, quantity: number): CartItem[] {
    if (authService.getCurrentUser()) {
      const idx = cachedItems.findIndex((i) => i.productId === productId);
      const snapshotItem = idx >= 0 ? { ...cachedItems[idx] } : null;
      const prevQty = snapshotItem ? snapshotItem.quantity : 0;

      if (idx >= 0) {
        if (quantity > 0) {
          cachedItems[idx].quantity = quantity;
        } else {
          cachedItems.splice(idx, 1);
        }
        notify(cachedItems);
      }

      // Backend request
      (async () => {
        try {
          if (quantity > 0) {
            await api.patch<{ success: true; data: any }>(`/cart/items/${productId}`, { quantity });
          } else {
            await api.delete<{ success: true }>(`/cart/items/${productId}`);
          }
          if (snapshotItem) {
            if (quantity > prevQty) {
              trackAddToCart(snapshotItem, quantity - prevQty);
            } else if (quantity < prevQty) {
              trackRemoveFromCart(snapshotItem, prevQty - Math.max(0, quantity));
            }
          }
        } catch (e) {
          console.error('updateQuantity API error:', e);
          loadAuthenticatedCart().catch(() => {});
        }
      })();

      return cachedItems;
    }

    // Guest path
    const currentGuest = getGuestItems();
    const snapshotGuest = currentGuest.find((i) => i.productId === productId) || null;
    const prevGuestQty = snapshotGuest ? snapshotGuest.quantity : 0;

    const items = currentGuest.flatMap((item) => {
      if (item.productId !== productId) return [item];
      return quantity > 0 ? [{ ...item, quantity }] : [];
    });
    const saved = saveGuestItems(items);
    if (snapshotGuest) {
      if (quantity > prevGuestQty) {
        trackAddToCart(snapshotGuest, quantity - prevGuestQty);
      } else if (quantity < prevGuestQty) {
        trackRemoveFromCart(snapshotGuest, prevGuestQty - Math.max(0, quantity));
      }
    }
    return saved;
  },

  /** Removes a product from the cart. */
  removeItem(productId: string): CartItem[] {
    if (authService.getCurrentUser()) {
      const removedItem = cachedItems.find((i) => i.productId === productId) || null;
      const newCache = cachedItems.filter((i) => i.productId !== productId);
      cachedItems = newCache;
      notify(cachedItems);
      (async () => {
        try {
          await api.delete<{ success: true }>(`/cart/items/${productId}`);
          if (removedItem) {
            trackRemoveFromCart(removedItem, removedItem.quantity);
          }
        } catch (e) {
          console.error('removeItem API error:', e);
          loadAuthenticatedCart().catch(() => {});
        }
      })();
      return cachedItems;
    }

    // Guest path
    const currentGuest = getGuestItems();
    const removedGuestItem = currentGuest.find((i) => i.productId === productId) || null;
    const items = currentGuest.filter((i) => i.productId !== productId);
    const saved = saveGuestItems(items);
    if (removedGuestItem) {
      trackRemoveFromCart(removedGuestItem, removedGuestItem.quantity);
    }
    return saved;
  },

  /** Clears the entire cart. */
  clearCart(): void {
    if (authService.getCurrentUser()) {
      cachedItems = [];
      notify([]);
      (async () => {
        try {
          await api.delete<{ success: true }>('/cart');
        } catch (e) {
          console.error('clearCart API error:', e);
        }
      })();
      return;
    }
    // Guest path – clear localStorage and notify
    localStorage.removeItem(CART_STORAGE_KEY);
    notify([]);
  },

  /** Subscribe to cart changes. Returns an unsubscribe function. */
  subscribe(callback: CartListener): () => void {
    listeners.add(callback);
    // Immediately invoke with current state
    const current = authService.getCurrentUser() ? cachedItems : getGuestItems();
    callback(current);
    if (authService.getCurrentUser()) {
      ensureAuthCartInitialized();
    }
    return () => {
      listeners.delete(callback);
    };
  },
};
