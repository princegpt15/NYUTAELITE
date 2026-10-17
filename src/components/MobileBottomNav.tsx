import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, PlayCircle, LayoutGrid, User, ShoppingBag } from 'lucide-react';
import { cartService } from '../services/cart';
import { authService } from '../services/auth';

interface MobileBottomNavProps {
  onOpenCart?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenCart }) => {
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const updateCount = () => {
      const items = cartService.getItems();
      setCartCount(items.reduce((acc, item) => acc + item.quantity, 0));
    };
    updateCount();
    const unsubscribe = cartService.subscribe(updateCount);
    return () => unsubscribe();
  }, []);

  // Hide on all Admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    {
      to: '/',
      label: 'Home',
      icon: Home,
      exact: true,
      ariaLabel: 'Go to Home',
    },
    {
      to: '/play',
      label: 'Play',
      icon: PlayCircle,
      exact: false,
      ariaLabel: 'Watch Nyuta snack stories and education on Play',
    },
    {
      to: '/categories',
      label: 'Categories',
      icon: LayoutGrid,
      exact: false,
      ariaLabel: 'Browse Makhana Categories',
    },
    {
      to: currentUser ? '/account' : '/login?redirect=/account',
      label: 'Account',
      icon: User,
      exact: false,
      ariaLabel: currentUser ? 'Open My Account' : 'Sign in to Account',
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FCFAF5]/95 backdrop-blur-md border-t border-[#E8DECB] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to.split('?')[0]);

          return (
            <NavLink
              key={item.label}
              to={item.to}
              aria-label={item.ariaLabel}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 transition-colors relative cursor-pointer ${
                isActive
                  ? 'text-[#123B2A]'
                  : 'text-[#68756E] hover:text-[#123B2A]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-[#123B2A] stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[#C6A15B]" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight font-medium ${
                  isActive ? 'text-[#123B2A] font-extrabold' : 'text-[#68756E]'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}

        {/* Cart Button */}
        {onOpenCart ? (
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Shopping Cart with ${cartCount} items`}
            className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 transition-colors relative cursor-pointer ${
              location.pathname === '/cart'
                ? 'text-[#123B2A]'
                : 'text-[#68756E] hover:text-[#123B2A]'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <ShoppingBag
                className={`w-5 h-5 ${
                  location.pathname === '/cart'
                    ? 'scale-110 text-[#123B2A] stroke-[2.4]'
                    : 'stroke-[1.8]'
                }`}
              />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-2.5 bg-[#C6A15B] text-[#092218] text-[9px] font-black h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-xs border border-[#FCFAF5]"
                  aria-hidden="true"
                >
                  {cartCount}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-1 tracking-tight font-medium ${
                location.pathname === '/cart'
                  ? 'text-[#123B2A] font-extrabold'
                  : 'text-[#68756E]'
              }`}
            >
              Cart
            </span>
          </button>
        ) : (
          <NavLink
            to="/cart"
            aria-label={`Shopping Cart with ${cartCount} items`}
            className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 transition-colors relative cursor-pointer ${
              location.pathname === '/cart'
                ? 'text-[#123B2A]'
                : 'text-[#68756E] hover:text-[#123B2A]'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <ShoppingBag
                className={`w-5 h-5 ${
                  location.pathname === '/cart'
                    ? 'scale-110 text-[#123B2A] stroke-[2.4]'
                    : 'stroke-[1.8]'
                }`}
              />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-2.5 bg-[#C6A15B] text-[#092218] text-[9px] font-black h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-xs border border-[#FCFAF5]"
                  aria-hidden="true"
                >
                  {cartCount}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-1 tracking-tight font-medium ${
                location.pathname === '/cart'
                  ? 'text-[#123B2A] font-extrabold'
                  : 'text-[#68756E]'
              }`}
            >
              Cart
            </span>
          </NavLink>
        )}
      </div>
    </nav>
  );
};
