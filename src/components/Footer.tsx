import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Globe } from 'lucide-react';
import { resetAnalyticsConsent } from '../services/analytics';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#123B2A] text-[#FCFAF5] pt-16 pb-28 lg:pb-12 border-t border-[#092218]">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Main Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-6 xl:gap-8 pb-12 border-b border-[#092218]">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/nyuta-elite-logo.webp"
                alt="NYUTA ELITE Makhana"
                className="h-10 w-10 rounded-full border border-[#C6A15B] object-cover shadow-xs"
              />
              <span className="font-serif font-extrabold text-xl text-white tracking-wider">
                NYUTA ELITE
              </span>
            </Link>
            <p className="text-xs font-medium text-[#D5DED6] leading-relaxed">
              Carefully selected makhana for better everyday snacking. Hand-sorted, crisp, and freshly packed.
            </p>
          </div>

          {/* SHOP Column */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#C6A15B]">
              SHOP
            </h3>
            <ul className="space-y-2 text-xs font-medium text-[#D5DED6]">
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
              <li>
                <Link to="/learn/how-to-choose-good-quality-makhana" className="hover:text-white transition-colors">
                  Quality Buyer's Guide
                </Link>
              </li>
              <li>
                <Link to="/learn/makhana-benefits-health" className="hover:text-white transition-colors">
                  Makhana Health Benefits
                </Link>
              </li>
            </ul>
          </div>

          {/* COMPANY Column */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#C6A15B]">
              COMPANY
            </h3>
            <ul className="space-y-2 text-xs font-medium text-[#D5DED6]">
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
            <ul className="space-y-2 text-xs font-medium text-[#D5DED6]">
              <li>
                <Link to="/about#shipping" className="hover:text-white transition-colors">
                  Shipping Policy
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
            <ul className="space-y-2 text-xs font-medium text-[#D5DED6]">
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
                <Link to="/about#fssai" className="hover:text-white transition-colors">
                  FSSAI: 20426021000494
                </Link>
              </li>
              <li>
                <Link to="/about#grievance" className="hover:text-white transition-colors">
                  Grievance Redressal
                </Link>
              </li>
              <li>
                <Link to="/about#checklist" className="hover:text-[#C6A15B] transition-colors text-[11px] text-[#C6A15B]/90 font-medium">
                  Owner Policy Checklist
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

          {/* CONTACT INFO Column */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#C6A15B]">
              CONTACT INFO
            </h3>
            <ul className="space-y-2.5 text-xs font-medium text-[#D5DED6]">
              <li>
                <a
                  href="tel:+918102875852"
                  className="inline-flex items-center gap-2 hover:text-[#C6A15B] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
                  <span>+91 81028 75852</span>
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C6A15B] shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1 min-w-0">
                  <a
                    href="mailto:info@nyutaelite.com"
                    className="hover:text-[#C6A15B] transition-colors"
                  >
                    info@nyutaelite.com
                  </a>
                  <a
                    href="mailto:enterprisesp0r@gmail.com"
                    className="hover:text-[#C6A15B] transition-colors text-[11px] xl:text-xs"
                    title="enterprisesp0r@gmail.com"
                  >
                    enterprisesp0r@gmail.com
                  </a>
                </div>
              </li>
              <li>
                <a
                  href="https://nyutaelite.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-[#C6A15B] transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
                  <span>https://nyutaelite.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-xs font-medium text-[#9BB0A3]">
          <p>© 2026 NYUTA ELITE MAKHANA. All rights reserved.</p>

          <p className="text-xs text-[#9BB0A3]">
            Website crafted by{' '}
            <a
              href="https://www.linkedin.com/in/princegpt15/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C6A15B] hover:text-white underline underline-offset-2 transition-colors font-semibold"
            >
              Prince Kumar
            </a>
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-5 text-[11px] sm:text-xs">
            <span className="text-[#C6A15B] font-semibold">FSSAI: 20426021000494</span>
            <span className="hidden sm:inline">·</span>
            <span>Freshly Packed in India</span>
            <span className="hidden sm:inline">·</span>
            <span>100% Natural Fox Nuts</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
