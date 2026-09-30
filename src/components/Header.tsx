import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, User as UserIcon } from 'lucide-react';
import { cartService } from '../services/cart';
import { authService } from '../services/auth';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const location = useLocation();

  useEffect(() => {
    const updateCart = () => {
      const items = cartService.getItems();
      setCartCount(items.reduce((acc, item) => acc + item.quantity, 0));
    };
    updateCart();
    const unsubscribe = cartService.subscribe(updateCart);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Shop Makhana', path: '/products/premium-makhana' },
    { label: 'Dry Fruits', path: '/#collections' },
    { label: 'Our Story', path: '/about' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E6DFD3] transition-shadow">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[68px]">
          {/* LEFT: Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <img
              src="/nyutaelite-logo.png"
              alt="NYUTAELITE Makhana"
              className="h-11 w-11 rounded-full border border-[#D7A93E] object-cover shadow-sm transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="text-[15px] font-bold tracking-tight text-[#1C2520] sm:text-lg">
                NYUTAELITE
              </span>
            </div>
          </Link>

          {/* CENTER: Desktop Navigation (hidden below lg) */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`text-[14px] font-medium transition-colors relative py-1 ${
                    active
                      ? 'text-[#00C950]'
                      : 'text-[#1C2520] hover:text-[#00C950]'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00C950] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2 text-[#1C2520] hover:text-[#00C950] transition-colors rounded-full hover:bg-neutral-50"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#00C950] text-white text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : `${cartCount}kg`}
                </span>
              )}
            </Link>

            {/* Desktop Auth & CTA Buttons */}
            <div className="hidden sm:flex items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/orders"
                    className="flex items-center gap-1.5 text-xs font-medium text-[#1C2520] hover:text-[#00C950] px-2.5 py-1.5 rounded-md hover:bg-neutral-50"
                  >
                    <UserIcon className="w-4 h-4 text-[#00C950]" />
                    <span className="max-w-[120px] truncate">{currentUser.fullName.split(' ')[0]}</span>
                  </Link>
                  <button
                    onClick={() => {
                      authService.logout();
                      setCurrentUser(null);
                    }}
                    className="text-xs text-[#5E6C65] hover:text-red-600 px-2 py-1"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-[14px] font-medium text-[#1C2520] hover:text-[#00C950] px-2 py-1 transition-colors"
                >
                  Login
                </Link>
              )}

              {!currentUser && (
                <Link
                  to="/register"
                  className="hidden md:inline-flex items-center justify-center text-[13px] font-medium text-[#00C950] border border-[#00C950] hover:bg-[#00C950]/10 px-4 py-2 rounded-lg transition-colors"
                >
                  Create Account
                </Link>
              )}

              <Link
                to="/products/premium-makhana"
                className="inline-flex items-center justify-center text-[13px] font-semibold text-white bg-[#00C950] hover:bg-[#00b347] px-4 py-2 rounded-lg shadow-sm transition-all"
              >
                Shop Now
              </Link>
            </div>

            {/* Mobile / Tablet Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#1C2520] hover:text-[#00C950] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C950]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE / TABLET DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E6DFD3] bg-white px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-[#00C950]/10 text-[#00C950]'
                    : 'text-[#1C2520] hover:bg-neutral-50'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 border-t border-[#E6DFD3] flex flex-col gap-2.5">
              {currentUser ? (
                <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 rounded-lg">
                  <span className="text-sm font-medium text-[#1C2520]">
                    Signed in as {currentUser.fullName}
                  </span>
                  <button
                    onClick={() => {
                      authService.logout();
                      setCurrentUser(null);
                    }}
                    className="text-xs text-red-600 font-semibold"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-sm font-medium text-[#1C2520] hover:bg-neutral-50 rounded-lg border border-[#E6DFD3]"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-sm font-medium text-[#00C950] border border-[#00C950] rounded-lg hover:bg-[#00C950]/10"
                  >
                    Create Account
                  </Link>
                </>
              )}
              <Link
                to="/products/premium-makhana"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 text-sm font-semibold text-white bg-[#00C950] hover:bg-[#00b347] rounded-lg shadow-sm"
              >
                Shop Makhana
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
