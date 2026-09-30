import type { CartItem } from '../types';
import { getPricePerKg } from '../data/product';

const CART_STORAGE_KEY = 'nyutaelite_cart';

type CartListener = (items: CartItem[]) => void;
const listeners: Set<CartListener> = new Set();

function notify(items: CartItem[]) {
  listeners.forEach((listener) => listener(items));
}

export const cartService = {
  getItems(): CartItem[] {
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addItem(item: {
    productId: string;
    productName: string;
    quantity: number;
    image: string;
    grade: string;
  }): CartItem[] {
    const items = this.getItems();
    const existingIndex = items.findIndex((i) => i.productId === item.productId);

    const targetQty = existingIndex > -1 ? items[existingIndex].quantity + item.quantity : item.quantity;
    const pricePerKg = getPricePerKg(targetQty);
    const subtotal = targetQty * pricePerKg;

    if (existingIndex > -1) {
      items[existingIndex].quantity = targetQty;
      items[existingIndex].pricePerKg = pricePerKg;
      items[existingIndex].subtotal = subtotal;
    } else {
      items.push({
        productId: item.productId,
        productName: item.productName,
        quantity: targetQty,
        pricePerKg,
        subtotal,
        image: item.image,
        grade: item.grade,
      });
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    notify(items);
    return items;
  },

  updateQuantity(productId: string, quantity: number): CartItem[] {
    let items = this.getItems();
    if (quantity <= 0) {
      items = items.filter((i) => i.productId !== productId);
    } else {
      const pricePerKg = getPricePerKg(quantity);
      items = items.map((i) =>
        i.productId === productId
          ? {
              ...i,
              quantity,
              pricePerKg,
              subtotal: quantity * pricePerKg,
            }
          : i
      );
    }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    notify(items);
    return items;
  },

  removeItem(productId: string): CartItem[] {
    const items = this.getItems().filter((i) => i.productId !== productId);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    notify(items);
    return items;
  },

  clearCart(): void {
    localStorage.removeItem(CART_STORAGE_KEY);
    notify([]);
  },

  getTotals() {
    const items = this.getItems();
    const totalKg = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    // 5% GST on Fox nuts / agricultural processed staples in India (HSN 1904)
    const gst = Math.round(subtotal * 0.05);
    // Free freight above 50 KG, else ₹450 flat bulk logistic surcharge
    const shipping = totalKg >= 50 || totalKg === 0 ? 0 : 450;
    const total = subtotal + gst + shipping;

    return {
      totalKg,
      subtotal,
      gst,
      shipping,
      total,
      itemCount: items.length,
    };
  },

  subscribe(callback: CartListener): () => void {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
};
