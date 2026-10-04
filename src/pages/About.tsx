import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import lotusImg from '../assets/images/lotus-source.png';
const brandEmblem = '/nyuta-elite-logo.png';

export const About: React.FC = () => {
  return (
    <div className="bg-[#FCFAF5] min-h-screen">
      {/* Hero Banner */}
      <section className="bg-[#123B2A] text-white py-16 lg:py-24 border-b border-[#092218]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 text-center max-w-3xl">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
            OUR HERITAGE &amp; MISSION
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-wide mt-2 mb-4">
            Freshly Harvested Makhana for Mindful Snacking.
          </h1>
          <p className="text-sm sm:text-base text-[#D5DED6] leading-relaxed">
            NYUTA ELITE MAKHANA is dedicated to bringing authentic, carefully selected Euryale ferox (fox nuts) directly from freshwater lotus ponds to your home pantry.
          </p>
        </div>
      </section>

      {/* Origin & Story */}
      <section className="py-16 sm:py-24 border-b border-[#E8DECB]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
                AUTHENTIC BIHAR HARVEST
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#092218] leading-tight">
                Cultivated by Traditional Harvesting Communities
              </h2>
              <p className="text-sm sm:text-base text-[#68756E] leading-relaxed">
                More than 85% of the world’s finest makhana is harvested in the pristine freshwater wetlands of Mithila, Bihar. For generations, local farming families have cultivated lotus plants with unmatched care and patience.
              </p>
              <p className="text-sm sm:text-base text-[#68756E] leading-relaxed">
                At NYUTA ELITE, we select only pure, unbleached, naturally air-popped fox nuts. Each pack is graded for uniform texture, size, and pop density before being sealed for ultimate crunch.
              </p>

              <div className="pt-3">
                <Link
                  to="/products/makhana"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218] transition-colors"
                >
                  <span>Explore Pantry Packs</span>
                  <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-[480px] aspect-square rounded-2xl overflow-hidden shadow-md border border-[#E8DECB]">
                <img
                  src={lotusImg}
                  alt="Lotus seed pod in Bihar freshwater pond"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quality Seal */}
      <section className="bg-white py-16 border-b border-[#E8DECB]">
        <div className="max-w-[960px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-8 bg-[#F7F1E5] p-8 rounded-2xl border border-[#E8DECB]">
            <img
              src={brandEmblem}
              alt="NYUTA ELITE Makhana Quality Seal"
              className="w-28 h-28 rounded-full shadow-sm shrink-0 object-cover border-2 border-[#C6A15B]"
            />
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-[11px] font-bold text-[#C6A15B] uppercase tracking-wider">
                CERTIFIED BRAND GUARANTEE
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#092218]">
                The NYUTA ELITE Freshness Standard
              </h3>
              <p className="text-xs sm:text-sm text-[#68756E] leading-relaxed">
                Every batch certified under the NYUTA ELITE seal guarantees 100% vegetarian, non-GMO, naturally puffed fox nuts with zero artificial colors or chemical bleaching.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Policies (Legal Anchors) */}
      <section className="py-16 max-w-[960px] mx-auto px-5 sm:px-8 space-y-8">
        <div id="privacy" className="bg-white p-8 rounded-2xl border border-[#E8DECB] space-y-3">
          <h3 className="font-serif text-2xl font-bold text-[#092218]">Privacy Policy</h3>
          <p className="text-xs sm:text-sm text-[#68756E] leading-relaxed">
            NYUTA ELITE MAKHANA respects the privacy of all customers. We collect delivery information, email, and phone contact details strictly for order fulfillment, logistics tracking, and customer support. Your data is never rented or shared with third parties.
          </p>
        </div>

        <div id="terms" className="bg-white p-8 rounded-2xl border border-[#E8DECB] space-y-3">
          <h3 className="font-serif text-2xl font-bold text-[#092218]">Terms of Service</h3>
          <p className="text-xs sm:text-sm text-[#68756E] leading-relaxed">
            All orders placed on the NYUTA ELITE website are processed and shipped across India. Product prices include applicable GST. Prices and availability are subject to change without prior notice.
          </p>
        </div>

        <div id="shipping" className="bg-white p-8 rounded-2xl border border-[#E8DECB] space-y-3">
          <h3 className="font-serif text-2xl font-bold text-[#092218]">Shipping Policy</h3>
          <p className="text-xs sm:text-sm text-[#68756E] leading-relaxed">
            Orders are packed and dispatched within 24 hours of payment. Standard delivery takes 3 to 5 business days for major metro cities and 4 to 7 business days for regional pin codes. Free express shipping applies on orders above ₹499.
          </p>
        </div>

        <div id="refund" className="bg-white p-8 rounded-2xl border border-[#E8DECB] space-y-3">
          <h3 className="font-serif text-2xl font-bold text-[#092218]">Returns &amp; Refund Policy</h3>
          <p className="text-xs sm:text-sm text-[#68756E] leading-relaxed">
            In the event of transit damage or unsealed packages, claims reported within 48 hours of delivery will be processed immediately for full replacement or refund.
          </p>
        </div>
      </section>
    </div>
  );
};
