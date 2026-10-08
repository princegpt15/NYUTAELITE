import React from 'react';
import { Link } from 'react-router-dom';
import { resetAnalyticsConsent } from '../services/analytics';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#123B2A] text-[#FCFAF5] pt-16 pb-12 border-t border-[#092218]">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-[#092218]">
          {/* Brand Info */}
          <div className="lg:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/nyuta-elite-logo.png"
                alt="NYUTA ELITE Makhana"
                className="h-10 w-10 rounded-full border border-[#C6A15B] object-cover shadow-xs"
              />
              <span className="font-serif font-extrabold text-xl text-white tracking-wider">
                NYUTA ELITE
              </span>
            </Link>
            <p className="text-xs text-[#D5DED6] leading-relaxed max-w-sm">
              Carefully selected makhana for better everyday snacking. Hand-sorted, crisp, and freshly packed.
            </p>
          </div>

          {/* SHOP Column */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#C6A15B]">
              SHOP
            </h3>
            <ul className="space-y-2 text-xs text-[#D5DED6]">
              <li>
                <Link to="/products/makhana" className="hover:text-white transition-colors">
                  All Makhana
                </Link>
              </li>
              <li>
                <Link to="/products/makhana?sku=premium-100g" className="hover:text-white transition-colors">
                  Premium Quality
                </Link>
              </li>
              <li>
                <Link to="/products/makhana?sku=normal-100g" className="hover:text-white transition-colors">
                  Normal Quality
                </Link>
              </li>
            </ul>
          </div>

          {/* COMPANY Column */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#C6A15B]">
              COMPANY
            </h3>
            <ul className="space-y-2 text-xs text-[#D5DED6]">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* SUPPORT Column */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#C6A15B]">
              SUPPORT
            </h3>
            <ul className="space-y-2 text-xs text-[#D5DED6]">
              <li>
                <Link to="/about#shipping" className="hover:text-white transition-colors">
                  Shipping
                </Link>
              </li>
              <li>
                <Link to="/about#refund" className="hover:text-white transition-colors">
                  Returns &amp; Refunds
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* LEGAL Column */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#C6A15B]">
              LEGAL
            </h3>
            <ul className="space-y-2 text-xs text-[#D5DED6]">
              <li>
                <Link to="/about#privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/about#terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={resetAnalyticsConsent}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Analytics Preferences
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9BB0A3]">
          <p>© 2026 NYUTA ELITE MAKHANA. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Freshly Packed in India</span>
            <span>100% Natural Fox Nuts</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
