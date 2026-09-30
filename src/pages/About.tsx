import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import lotusImg from '../assets/images/lotus-source.png';
const brandEmblem = '/nyutaelite-logo.png';

export const About: React.FC = () => {
  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      {/* Hero Banner */}
      <section className="bg-[#173F35] text-white py-16 lg:py-24 border-b border-[#12332B]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-xs font-bold tracking-widest text-[#D8A62A] uppercase">
            OUR HERITAGE & MISSION
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 mb-4">
            From the Ponds of Mithila to India's Leading Food Businesses.
          </h1>
          <p className="text-sm sm:text-base text-[#A5BDB5] leading-relaxed">
            NYUTAELITE Foods is dedicated to transforming makhana (fox nut) wholesale supply with transparent farm-gate procurement, strict grading, and seamless commercial logistics.
          </p>
        </div>
      </section>

      {/* Origin & Story */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-bold tracking-widest text-[#C89B3C] uppercase">
                AUTHENTIC BIHAR SOURCING
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1C2520] tracking-tight">
                Empowering Over 500+ Traditional Harvesting Families
              </h2>
              <p className="text-sm sm:text-base text-[#5E6C65] leading-relaxed">
                More than 85% of the world’s makhana is harvested in the freshwater wetlands of Bihar. For generations, local Mallah and farming communities have cultivated Euryale ferox with remarkable patience and skill.
              </p>
              <p className="text-sm sm:text-base text-[#5E6C65] leading-relaxed">
                By eliminating intermediate agents, NYUTAELITE provides direct fair-price compensation to local cultivators while supplying FMCG manufacturers and distributors with consistent, Grade A wholesale quality.
              </p>

              <div className="pt-2">
                <Link
                  to="/products/premium-makhana"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#173F35] text-white font-semibold text-sm hover:bg-[#112F28] transition-colors"
                >
                  <span>Explore Bulk Grades</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-[480px] aspect-square rounded-3xl overflow-hidden shadow-lg border border-[#E6DFD3]">
                <img
                  src={lotusImg}
                  alt="Lotus seed pod in Bihar pond"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Seal Showcase */}
      <section className="bg-white py-16 border-y border-[#E6DFD3]">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-8 bg-[#F7F2E8] p-8 rounded-3xl border border-[#E6DFD3]">
            <img
              src={brandEmblem}
              alt="NYUTAELITE Makhana Premium Quality Seal"
              className="w-36 h-36 rounded-full shadow-md shrink-0 object-cover"
            />
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs font-bold text-[#C89B3C] uppercase tracking-wider">
                CERTIFIED BRAND SEAL
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1C2520]">
                NYUTAELITE Premium Quality Seal
              </h3>
              <p className="text-xs sm:text-sm text-[#5E6C65] leading-relaxed">
                Every batch certified under the NYUTAELITE quality assurance seal guarantees 100% vegetarian, non-GMO, naturally puffed fox nuts with full trace-back records to Bihar harvest clusters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Business Policy Sections (Legal Anchors) */}
      <section className="py-16 max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div id="privacy" className="bg-white p-8 rounded-3xl border border-[#E6DFD3] space-y-3">
          <h3 className="text-xl font-bold text-[#1C2520]">Privacy Policy</h3>
          <p className="text-xs sm:text-sm text-[#5E6C65] leading-relaxed">
            NYUTAELITE Foods respects the privacy of all commercial customers. We collect business contact details, GST registration numbers, and warehouse shipping addresses strictly for invoicing, logistics compliance, and customer service. Data is never rented or sold to third-party advertisers.
          </p>
        </div>

        <div id="terms" className="bg-white p-8 rounded-3xl border border-[#E6DFD3] space-y-3">
          <h3 className="text-xl font-bold text-[#1C2520]">Terms & Conditions</h3>
          <p className="text-xs sm:text-sm text-[#5E6C65] leading-relaxed">
            All bulk transactions on the NYUTAELITE B2B wholesale platform are governed by commercial procurement contracts. Minimum Order Quantity (MOQ) is 10 KG. Prices quoted on our website are wholesale base prices subject to 5% GST (HSN 19041090).
          </p>
        </div>

        <div id="shipping" className="bg-white p-8 rounded-3xl border border-[#E6DFD3] space-y-3">
          <h3 className="text-xl font-bold text-[#1C2520]">Shipping Policy</h3>
          <p className="text-xs sm:text-sm text-[#5E6C65] leading-relaxed">
            Orders are dispatched within 24 to 48 hours of order and payment confirmation. We utilize surface and air express cargo networks for pan-India coverage. Consignments are packed in multi-wall vacuum packs inside 7-ply corrugated cartons.
          </p>
        </div>

        <div id="refund" className="bg-white p-8 rounded-3xl border border-[#E6DFD3] space-y-3">
          <h3 className="text-xl font-bold text-[#1C2520]">Refund & Quality Guarantee Policy</h3>
          <p className="text-xs sm:text-sm text-[#5E6C65] leading-relaxed">
            In the rare event of transit damage or quality deviations against the batch Certificate of Analysis (COA), claims reported within 48 hours of delivery will be investigated for immediate replacement or credit note adjustment.
          </p>
        </div>
      </section>
    </div>
  );
};
