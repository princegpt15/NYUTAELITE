import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#173F35] text-white pt-16 pb-12 border-t border-[#12332B]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          {/* Brand Col */}
          <div className="lg:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/nyutaelite-logo.png"
                alt="NYUTAELITE Makhana"
                className="h-11 w-11 rounded-full border border-[#D7A93E] object-cover shadow-sm"
              />
              <span className="text-lg font-bold tracking-tight text-white">NYUTAELITE</span>
            </Link>
            <p className="text-xs sm:text-sm text-[#A5BDB5] leading-relaxed max-w-sm">
              Premium makhana and dry fruits, thoughtfully selected for fresh, satisfying everyday snacking.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-[#E6DFD3]/80">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-[#A5BDB5]">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/products/premium-makhana" className="hover:text-white transition-colors">
                  Shop Makhana
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-[#E6DFD3]/80">
              Customer Support
            </h3>
            <ul className="space-y-2 text-sm text-[#A5BDB5]">
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  Orders
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Business */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-[#E6DFD3]/80">
              Collections
            </h3>
            <ul className="space-y-2 text-sm text-[#A5BDB5]">
              <li>
                <Link to="/products/premium-makhana" className="hover:text-white transition-colors">
                  Makhana
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Dry Fruits
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Gifting & Bulk Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-[#E6DFD3]/80">
              Legal
            </h3>
            <ul className="space-y-2 text-sm text-[#A5BDB5]">
              <li>
                <Link to="/about#privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/about#terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/about#shipping" className="hover:text-white transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/about#refund" className="hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="pt-8 border-t border-[#235044] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8BA49C]">
          <p>© 2026 NYUTAELITE Foods. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>NYUTAELITE Dry Fruits & Makhana</span>
            <span>Freshly packed in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
