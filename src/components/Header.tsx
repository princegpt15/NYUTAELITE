import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, Search, User as UserIcon } from 'lucide-react';
import { cartService } from '../services/cart';
import { authService } from '../services/auth';
import { CartDrawer } from './CartDrawer';
import { SearchModal } from './SearchModal';
import { Toast } from './Toast';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateCart = () => {
      const items = cartService.getItems();
      setCartCount(items.reduce((acc, item) => acc + item.quantity, 0));
    };
    updateCart();
    const unsubscribe = cartService.subscribe(updateCart);
    return () => unsubscribe();
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Shop Makhana', path: '/#pantry' },
    { label: 'Premium', path: '/products/makhana?sku=premium-100g' },
    { label: 'Normal', path: '/products/makhana?sku=normal-100g' },
    { label: 'Why Makhana', path: '/#why-makhana' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    if (path.startsWith('/#')) {
      const targetId = path.replace('/#', '');
      if (location.pathname === '/') {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(`/${path}`);
      }
    } else {
      navigate(path);
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FCFAF5]/95 backdrop-blur-md shadow-md py-2.5 border-b border-[#E8DECB]'
            : 'bg-[#FCFAF5] py-4 border-b border-[#E8DECB]/60'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* BRAND LOGO */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/nyuta-elite-logo.png"
                alt="NYUTA ELITE MAKHANA Logo"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-[#C6A15B] object-cover shadow-xs transition-transform group-hover:scale-105"
              />
              <div className="flex flex-col">
                <span className="font-serif font-extrabold text-lg sm:text-xl text-[#123B2A] tracking-wider leading-none">
                  NYUTA ELITE
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#C6A15B] mt-0.5">
                  MAKHANA
                </span>
              </div>
            </Link>

            {/* DESKTOP NAVIGATION */}
            <nav className="hidden lg:flex items-center gap-7" aria-label="Main Navigation">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.path)}
                  className="text-xs font-bold uppercase tracking-[0.14em] text-[#1C1C1C] hover:text-[#123B2A] transition-colors relative py-1 cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-[#1C1C1C] hover:text-[#123B2A] rounded-full hover:bg-[#F7F1E5] transition-colors cursor-pointer"
                aria-label="Search Makhana"
                title="Search Makhana"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Account Link */}
              {currentUser ? (
                <Link
                  to="/orders"
                  className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#123B2A] bg-[#F7F1E5] px-3 py-1.5 rounded-full hover:bg-[#E8DECB] transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-[#C6A15B]" />
                  <span className="max-w-[100px] truncate">
                    {(currentUser.fullName || (currentUser as any).name || 'Account').split(' ')[0]}
                  </span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:inline-flex p-2 text-[#1C1C1C] hover:text-[#123B2A] rounded-full hover:bg-[#F7F1E5] transition-colors"
                  title="Account Sign In"
                  aria-label="Account Sign In"
                >
                  <UserIcon className="w-5 h-5" />
                </Link>
              )}

              {/* Cart Drawer Trigger */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-[#123B2A] hover:text-[#092218] rounded-full hover:bg-[#F7F1E5] transition-colors cursor-pointer"
                aria-label="View Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#123B2A] text-[#FCFAF5] text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-[#C6A15B]">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#1C1C1C] hover:text-[#123B2A] rounded-lg cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE DRAWER NAVIGATION */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E8DECB] bg-[#FCFAF5] px-5 pt-3 pb-6 shadow-xl animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.path)}
                  className="text-left px-3 py-2 text-sm font-bold uppercase tracking-wider text-[#1C1C1C] hover:bg-[#F7F1E5] rounded-md transition-colors"
                >
                  {link.label}
                </button>
              ))}

              <div className="pt-4 border-t border-[#E8DECB] flex flex-col gap-2.5">
                {currentUser ? (
                  <div className="flex items-center justify-between px-3 py-2 bg-[#F7F1E5] rounded-lg">
                    <span className="text-xs font-bold text-[#123B2A]">
                      Hi, {currentUser.fullName || (currentUser as any).name || 'User'}
                    </span>
                    <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="text-xs text-[#C6A15B] font-bold">
                      Orders
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center py-2.5 text-xs font-bold text-[#123B2A] border border-[#123B2A] rounded-md"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center py-2.5 text-xs font-bold text-white bg-[#123B2A] rounded-md"
                    >
                      Register
                    </Link>
                  </div>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleNavClick('/#pantry');
                  }}
                  className="w-full text-center py-3 text-xs font-bold uppercase tracking-widest text-[#092218] bg-[#C6A15B] rounded-md shadow-xs"
                >
                  SHOP MAKHANA
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Cart Slide-Over Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Instant Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onItemAdded={(item) => {
          setIsSearchOpen(false);
          setToastMessage(`Added ${item.weightGrams}g ${item.name} to cart.`);
          setIsCartOpen(true);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </>
  );
};
