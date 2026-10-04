import React, { useEffect, useState } from 'react';
import { X, Minus, Plus, Trash2, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService } from '../services/cart';
import type { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<CartItem[]>(cartService.getItems());
  const navigate = useNavigate();

  useEffect(() => {
    return cartService.subscribe(setItems);
  }, []);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeShippingThreshold = 499;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 40;
  const total = subtotal + shippingFee;

  const handleProceedToCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-md bg-[#FCFAF5] shadow-2xl border-l border-[#E8DECB] flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 bg-[#123B2A] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#C6A15B]" />
              <h2 className="text-lg font-bold font-serif">Your Makhana Pantry</h2>
              <span className="bg-[#C6A15B] text-[#092218] text-xs font-bold px-2 py-0.5 rounded-full">
                {items.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Bar */}
          {items.length > 0 && (
            <div className="bg-[#F7F1E5] px-6 py-3 border-b border-[#E8DECB] text-xs">
              {remainingForFreeShipping > 0 ? (
                <p className="text-[#1C1C1C] font-medium">
                  Add <span className="font-bold text-[#123B2A]">₹{remainingForFreeShipping}</span> more for <span className="font-bold text-[#123B2A]">FREE Shipping</span>!
                </p>
              ) : (
                <p className="text-[#123B2A] font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C6A15B]" /> You unlocked FREE Express Delivery!
                </p>
              )}
              <div className="w-full bg-[#E8DECB] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#123B2A] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 divide-y divide-[#E8DECB]/60">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                <ShoppingBag className="w-12 h-12 text-[#68756E]/40 mb-3" />
                <h3 className="text-lg font-bold text-[#1C1C1C]">Your cart is empty</h3>
                <p className="text-xs text-[#68756E] mt-1 max-w-xs">
                  Discover our Premium and Normal Makhana packs crafted for better everyday snacking.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 bg-[#123B2A] text-white text-xs font-bold px-5 py-3 rounded-lg hover:bg-[#092218] transition-colors"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="pt-4 first:pt-0 flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-16 h-16 bg-[#F7F1E5] rounded-md object-contain p-2 border border-[#E8DECB] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-[#123B2A] text-[#FCFAF5] px-1.5 py-0.5 rounded">
                        {item.quality}
                      </span>
                      <span className="text-xs font-bold text-[#123B2A]">{item.weightGrams}g</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#1C1C1C] truncate mt-0.5">{item.productName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-extrabold text-[#123B2A]">₹{item.price}</span>
                      <span className="text-xs text-[#68756E] line-through">₹{item.mrp}</span>
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center border border-[#E8DECB] rounded bg-white">
                      <button
                        onClick={() => cartService.updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1.5 text-[#123B2A] hover:bg-[#F7F1E5] transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-[#1C1C1C]">{item.quantity}</span>
                      <button
                        onClick={() => cartService.updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1.5 text-[#123B2A] hover:bg-[#F7F1E5] transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => cartService.removeItem(item.productId)}
                      className="text-xs text-[#68756E] hover:text-red-600 transition-colors p-1"
                      aria-label="Remove product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          {items.length > 0 && (
            <div className="p-6 bg-white border-t border-[#E8DECB] space-y-3">
              <div className="space-y-1.5 text-xs text-[#68756E]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#1C1C1C]">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="font-bold text-[#1C1C1C]">
                    {shippingFee === 0 ? <span className="text-[#123B2A]">FREE</span> : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-[#1C1C1C] pt-2 border-t border-[#E8DECB]">
                  <span>Total</span>
                  <span className="text-[#123B2A] text-base">₹{total}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/cart"
                  onClick={onClose}
                  className="inline-flex items-center justify-center border border-[#123B2A] text-[#123B2A] text-xs font-bold py-3 rounded-lg hover:bg-[#F7F1E5] transition-colors"
                >
                  View Cart
                </Link>
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="inline-flex items-center justify-center gap-1.5 bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold py-3 rounded-lg transition-colors shadow-sm"
                >
                  Checkout <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
