// src/pages/Cart.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Minus, Plus, ShieldCheck, Trash2, ArrowLeft, ArrowRight, ShoppingBag, Truck, Sparkles } from 'lucide-react';
import { cartService } from '../services/cart';
import { trackViewCart } from '../services/analytics';
import { growthApi } from '../services/growth';
import type { CartItem } from '../types';

export const Cart: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>(cartService.getItems());
  const [searchParams] = useSearchParams();
  const recoveryToken = searchParams.get('recovery');
  const [recoveryFeedback, setRecoveryFeedback] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => cartService.subscribe(setItems), []);

  useEffect(() => {
    if (recoveryToken) {
      growthApi.restoreRecoveredCart(recoveryToken).then((res) => {
        if (res.notice) {
          setRecoveryFeedback(res.notice);
        } else {
          setRecoveryFeedback('Welcome back! Your cart items have been restored and verified with live stock and catalog prices.');
        }
      }).catch(() => {});
    }
  }, [recoveryToken]);

  useEffect(() => {
    if (items.length > 0) {
      trackViewCart(items, 'page');
    }
  }, [items]);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalMrp = items.reduce((acc, item) => acc + item.mrp * item.quantity, 0);
  const savings = Math.max(0, totalMrp - subtotal);
  const freeShippingThreshold = 499;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 40;
  const grandTotal = subtotal + shippingFee;

  if (!items.length) {
    return (
      <div className="min-h-[calc(100vh-68px)] bg-[#FCFAF5] px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-[#E8DECB] shadow-xs space-y-4">
          <ShoppingBag className="w-12 h-12 text-[#68756E]/40 mx-auto" />
          <h1 className="font-serif text-3xl font-bold text-[#1C1C1C]">Your Cart is Empty</h1>
          <p className="text-xs text-[#68756E]">
            You have not added any makhana packs to your cart yet.
          </p>
          <Link
            to="/#pantry"
            className="inline-flex items-center gap-2 bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-lg hover:bg-[#092218] transition-colors"
          >
            Browse Makhana Packs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#FCFAF5] py-10 sm:py-14">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <Link
          to="/#pantry"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123B2A] hover:text-[#092218] mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Continue Shopping
        </Link>

        {recoveryFeedback && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>{recoveryFeedback}</span>
            </div>
            <button
              onClick={() => setRecoveryFeedback(null)}
              className="text-amber-700 font-bold ml-2 hover:underline text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* Left: Cart Items */}
          <section className="lg:col-span-7 space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C6A15B]">
                YOUR SELECTION
              </span>
              <h1 className="font-serif text-3xl font-bold text-[#092218]">Shopping Cart</h1>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <article
                  key={item.productId}
                  className="flex items-center gap-4 bg-white p-4 rounded-xl border border-[#E8DECB] shadow-xs"
                >
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="h-16 w-16 bg-[#F7F1E5] rounded-lg object-contain p-2 shrink-0 border border-[#E8DECB]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-[#123B2A] text-white px-1.5 py-0.5 rounded">
                        {item.quality}
                      </span>
                      <span className="text-xs font-bold text-[#123B2A]">{item.weightGrams}g</span>
                    </div>
                    <h2 className="font-bold text-[#1C1C1C] text-sm sm:text-base truncate mt-0.5">
                      {item.productName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-extrabold text-[#123B2A]">₹{item.price}</span>
                      <span className="text-xs text-[#68756E] line-through">₹{item.mrp}</span>
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center border border-[#E8DECB] rounded-lg bg-white">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => cartService.updateQuantity(item.productId, item.quantity - 1)}
                      className="p-2 text-[#123B2A] hover:bg-[#F7F1E5] transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-extrabold">{item.quantity}</span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => cartService.updateQuantity(item.productId, item.quantity + 1)}
                      className="p-2 text-[#123B2A] hover:bg-[#F7F1E5] transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    aria-label="Remove item"
                    onClick={() => cartService.removeItem(item.productId)}
                    className="p-2 text-[#68756E] hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </article>
              ))}
            </div>

            {/* Savings Notice */}
            {savings > 0 && (
              <div className="bg-[#F7F1E5] p-3.5 rounded-xl border border-[#C6A15B]/40 text-xs font-bold text-[#123B2A] flex items-center justify-between">
                <span>Total Pantry Savings:</span>
                <span className="text-sm font-extrabold">₹{savings}</span>
              </div>
            )}
          </section>

          {/* Right: Cart Summary & Proceed to Checkout */}
          <aside className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DECB] shadow-sm space-y-5">
            <h2 className="font-serif text-2xl font-bold text-[#092218] pb-3 border-b border-[#E8DECB]">
              Cart Summary
            </h2>

            {/* Free Shipping Bar */}
            <div className="bg-[#F7F1E5] p-4 rounded-xl border border-[#E8DECB] text-xs">
              {remainingForFreeShipping > 0 ? (
                <p className="text-[#1C1C1C] font-medium">
                  Add <span className="font-bold text-[#123B2A]">₹{remainingForFreeShipping}</span> more for <span className="font-bold text-[#123B2A]">FREE Express Shipping</span>!
                </p>
              ) : (
                <p className="text-[#123B2A] font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C6A15B]" /> You unlocked FREE Express Delivery!
                </p>
              )}
              <div className="w-full bg-[#E8DECB] h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-[#123B2A] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                />
              </div>
            </div>

            {/* Order Calculation Breakdown */}
            <div className="pt-2 space-y-2 text-xs text-[#68756E]">
              <div className="flex justify-between">
                <span>Subtotal ({items.reduce((a, b) => a + b.quantity, 0)} items)</span>
                <span className="font-bold text-[#1C1C1C]">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Express Pan-India Delivery</span>
                <span className="font-bold text-[#1C1C1C]">
                  {shippingFee === 0 ? <span className="text-[#123B2A]">FREE</span> : `₹${shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-[#1C1C1C] pt-3 border-t border-[#E8DECB]">
                <span>Estimated Total</span>
                <span className="text-[#123B2A] text-lg">₹{grandTotal}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 bg-[#123B2A] hover:bg-[#092218] text-xs font-extrabold uppercase tracking-widest text-white rounded-lg transition-colors cursor-pointer shadow-md"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4 text-[#C6A15B]" />
            </button>

            {/* Value Badges */}
            <div className="grid grid-cols-2 gap-2 pt-3 text-[11px] text-[#68756E] border-t border-[#E8DECB]">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#123B2A]" />
                <span>Pan-India Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#123B2A]" />
                <span>100% Authentic Bihar</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
