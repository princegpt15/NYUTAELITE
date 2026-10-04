import React, { useEffect, useState } from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cartService } from '../services/cart';
import type { CartItem } from '../types';

export const MobileStickyCart: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>(cartService.getItems());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    return cartService.subscribe(setItems);
  }, []);

  // Hide on cart page or if cart is empty
  if (location.pathname === '/cart' || items.length === 0) return null;

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <aside
      aria-label="Sticky Cart Summary"
      className="lg:hidden fixed bottom-4 inset-x-4 z-40 animate-[toast-in_300ms_ease-out]"
    >
      <button
        onClick={() => navigate('/cart')}
        className="w-full bg-[#123B2A] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-[#C6A15B]/50 flex items-center justify-between cursor-pointer hover:bg-[#092218] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative p-2 bg-[#092218] rounded-lg">
            <ShoppingBag className="w-5 h-5 text-[#C6A15B]" />
            <span className="absolute -top-1 -right-1 bg-[#C6A15B] text-[#092218] text-[9px] font-extrabold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
              {totalQuantity}
            </span>
          </div>
          <div className="text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-[#C6A15B]">
              {totalQuantity} {totalQuantity === 1 ? 'pack' : 'packs'} in cart
            </p>
            <p className="text-sm font-extrabold text-white">₹{totalAmount}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white bg-[#C6A15B] text-[#092218] px-3.5 py-2 rounded-lg">
          <span>VIEW CART</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>
    </aside>
  );
};
