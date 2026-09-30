import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import featuredImg from '../assets/images/product-featured.png';

export const ProductCard: React.FC = () => {
  const badges = ['Grade A', 'Lab Tested', 'GST Invoice Ready'];

  return (
    <div className="bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-8 lg:p-12 shadow-sm transition-all hover:shadow-md">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left: Product Image */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden bg-[#F7F2E8] border border-[#E6DFD3]/80 group">
            <img
              src={featuredImg}
              alt="NYUTAELITE Premium Makhana Grade A in wooden bowl"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute top-3 left-3 bg-[#173F35] text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Grade A Jumbo
            </div>
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="lg:col-span-7 flex flex-col items-start space-y-5">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#C89B3C] uppercase">
              EXPORT QUALITY
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#1C2520] mt-1.5 mb-3">
              NYUTAELITE Premium Makhana — Grade A
            </h3>
            <p className="text-sm sm:text-base text-[#5E6C65] leading-relaxed">
              Hand-picked, air-popped fox nuts with a light, crisp texture and natural white colour. Sourced directly from certified farmers in Bihar and processed to exceed business-grade wholesale specifications.
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            {badges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00C950]/10 text-[#173F35] text-xs font-semibold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00C950]" />
                {badge}
              </span>
            ))}
          </div>

          {/* Pricing Highlight */}
          <div className="pt-2">
            <p className="text-xs font-medium text-[#5E6C65]">Starting at</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#173F35]">
                ₹450
              </span>
              <span className="text-sm font-semibold text-[#5E6C65]">
                /kg for bulk orders
              </span>
            </div>
          </div>

          {/* Action Button */}
          <Link
            to="/products/premium-makhana"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#173F35] hover:bg-[#112F28] text-white font-semibold text-sm transition-all shadow-sm hover:gap-3"
          >
            <span>View Product</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
