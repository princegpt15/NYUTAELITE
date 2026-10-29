// src/pages/About.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Truck,
  RotateCcw,
  FileText,
  Award,
  AlertCircle,
  CheckSquare,
  Lock,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

const brandEmblem = '/nyuta-elite-logo.webp';

export const About: React.FC = () => {
  return (
    <div className="bg-[#FCFAF5] min-h-screen">
      {/* 1. Hero Banner */}
      <section className="bg-[#123B2A] text-white py-16 lg:py-24 border-b border-[#092218]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 text-center max-w-3xl">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
            OUR HERITAGE &amp; MISSION
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-wide mt-2 mb-4">
            Freshly Harvested Makhana for Mindful Snacking.
          </h1>
          <p className="text-sm sm:text-base text-[#D5DED6] leading-relaxed">
            NYUTA ELITE MAKHANA (also known as NYUTAELITE) is dedicated to bringing authentic, carefully selected Euryale ferox (fox nuts) directly from freshwater lotus ponds to your home pantry.
          </p>
        </div>
      </section>

      {/* 2. Origin & Story */}
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
              <div className="relative w-full max-w-[480px] aspect-square rounded-2xl overflow-hidden shadow-md border border-[#E8DECB] bg-[#F7F1E5]">
                <img
                  src="/images/process/01-harvest-pond.webp"
                  alt="Traditional Euryale ferox lotus harvest wetland in Mithila, Bihar"
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                  width={480}
                  height={480}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Quality Seal */}
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

      {/* 4. Customer Policies & Regulatory Standards Hub */}
      <section className="py-16 sm:py-20 border-b border-[#E8DECB]">
        <div className="max-w-[1040px] mx-auto px-5 sm:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
              TRANSPARENCY &amp; CUSTOMER TRUST
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#092218] mt-1 mb-3">
              Store Policies &amp; Compliance Standards
            </h2>
            <p className="text-xs sm:text-sm text-[#68756E] leading-relaxed">
              Clear, customer-friendly policies governing shipping, returns, privacy, terms of sale, and food-grade standards for NYUTA ELITE MAKHANA.
            </p>
          </div>

          {/* Quick Jump Navigation Bar */}
          <div className="sticky top-20 z-20 bg-[#FCFAF5]/95 backdrop-blur-sm p-2 sm:p-3 rounded-2xl border border-[#E8DECB] shadow-xs mb-10">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
              <a
                href="#shipping"
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#123B2A] hover:text-white border border-[#E8DECB] text-[#123B2A] whitespace-nowrap transition-colors flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Shipping Policy</span>
              </a>
              <a
                href="#refund"
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#123B2A] hover:text-white border border-[#E8DECB] text-[#123B2A] whitespace-nowrap transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Returns &amp; Refunds</span>
              </a>
              <a
                href="#privacy"
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#123B2A] hover:text-white border border-[#E8DECB] text-[#123B2A] whitespace-nowrap transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Privacy Policy</span>
              </a>
              <a
                href="#terms"
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#123B2A] hover:text-white border border-[#E8DECB] text-[#123B2A] whitespace-nowrap transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Terms of Service</span>
              </a>
              <a
                href="#fssai"
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#123B2A] hover:text-white border border-[#E8DECB] text-[#123B2A] whitespace-nowrap transition-colors flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>FSSAI &amp; Quality Info</span>
              </a>
              <a
                href="#grievance"
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#123B2A] hover:text-white border border-[#E8DECB] text-[#123B2A] whitespace-nowrap transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Grievance Desk</span>
              </a>
              <a
                href="#checklist"
                className="px-3 py-1.5 rounded-xl bg-[#F7F1E5] hover:bg-[#C6A15B] hover:text-white border border-[#C6A15B]/40 text-[#123B2A] whitespace-nowrap transition-colors flex items-center gap-1.5 ml-auto font-bold"
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Owner Checklist</span>
              </a>
            </div>
          </div>

          <div className="space-y-12">
            {/* POLICY 1: Shipping and Delivery Policy */}
            <article
              id="shipping"
              className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8DECB] shadow-xs space-y-6 scroll-mt-32"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E8DECB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#123B2A] text-[#C6A15B] flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#092218]">
                      Shipping and Delivery Policy
                    </h3>
                    <p className="text-xs text-[#68756E] mt-0.5">
                      Last Updated: October 2026 · Standard Pan-India Courier Fulfillment
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F7F1E5] text-[#123B2A] border border-[#E8DECB] self-start sm:self-auto">
                  Standard Delivery
                </span>
              </div>

              {/* Confirmed Delivery Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6A15B] block">
                    Order Processing
                  </span>
                  <p className="font-serif text-xl font-bold text-[#092218]">1–2 Business Days</p>
                  <p className="text-[11px] text-[#68756E]">
                    Quality check, packing, and courier handoff at our Bihar hub (Mon–Sat, excl. national holidays).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6A15B] block">
                    Courier Transit
                  </span>
                  <p className="font-serif text-xl font-bold text-[#092218]">5–7 Business Days</p>
                  <p className="text-[11px] text-[#68756E]">
                    Estimated courier transit time after courier dispatch to serviceable PIN codes across India.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6A15B] block">
                    Overall Timeline
                  </span>
                  <p className="font-serif text-xl font-bold text-[#092218]">~6–9 Business Days</p>
                  <p className="text-[11px] text-[#68756E]">
                    Expected overall duration from order placement to doorstep delivery across standard serviceable zones.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6A15B] block">
                    Transit Clarification
                  </span>
                  <p className="font-serif text-xl font-bold text-[#092218]">Estimates Only</p>
                  <p className="text-[11px] text-[#68756E]">
                    Timelines are estimated carrier schedules, not guaranteed commitments. Excludes external logistics delays.
                  </p>
                </div>
              </div>

              {/* Subsections */}
              <div className="space-y-4 text-xs sm:text-sm text-[#4A5550] leading-relaxed">
                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    1. Order Processing &amp; Courier Handoff
                  </h4>
                  <p>
                    All retail makhana orders placed on <strong className="text-[#092218]">NYUTA ELITE MAKHANA</strong> are carefully inspected, hand-packed in airtight food-grade pouches, and handed over to our contracted national courier partners within <strong>1–2 business days</strong> following order confirmation (Monday through Saturday, excluding national and gazetted holidays).
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    2. Courier Transit Schedules &amp; Expected Overall Timeline
                  </h4>
                  <p>
                    Following carrier pickup, estimated courier transit to serviceable PIN codes across India is typically <strong>5–7 business days</strong>. Consequently, the <strong>expected overall timeline from order placement to doorstep delivery is approximately 6–9 business days</strong> for standard destinations.
                  </p>
                  <p className="mt-1">
                    <strong>Estimates vs. Guarantees:</strong> Please note that all delivery schedules are provided as <strong>reasonable estimates, not absolute guarantees</strong>. External transit interruptions, regional holidays, high-volume festive periods, or severe weather conditions in transit corridors may occasionally extend delivery times beyond our control.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    3. Serviceable Areas &amp; Geographic Reach
                  </h4>
                  <p>
                    We currently ship to most residential, retail, and commercial PIN codes throughout India. Delivery timelines may be extended for remote interior zones, Northeast states, hilly sectors, or island territories. Any remote PIN codes requiring special carrier surcharges or experiencing temporary logistics embargoes remain flagged for ongoing owner review.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    4. Shipping Fees &amp; Free Shipping Rule
                  </h4>
                  <p>
                    On our retail storefront, standard delivery is <strong className="text-[#092218]">FREE for orders of ₹499 and above</strong>. For orders below ₹499, a flat shipping charge of <strong>₹40</strong> is applied at checkout. Applicable delivery charges are always itemized transparently in your shopping cart before you confirm payment. Commercial bulk consignments (wholesale bags above 25 kg) are subject to separate freight quotations based on gross weight and destination.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    5. Consignment Tracking
                  </h4>
                  <p>
                    Once your consignment has been scanned and picked up by our logistics partner, an automated dispatch notification with your tracking number (AWB) and courier tracking link will be sent to your registered email address and/or mobile number. You can also view active order status anytime under your{' '}
                    <Link to="/orders" className="text-[#123B2A] font-bold underline hover:text-[#092218]">
                      Orders Dashboard
                    </Link>
                    .
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    6. Undeliverable Shipments &amp; Address Accuracy
                  </h4>
                  <p>
                    Customers are responsible for providing complete shipping addresses including door/flat number, street name, landmark, and an active 10-digit phone number. If a parcel is returned to origin (RTO) due to incomplete address details or recipient unavailability after 3 attempted courier deliveries, our customer care team will contact you to coordinate re-dispatch.
                  </p>
                </div>
              </div>

              {/* Unresolved Owner Decision Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>OWNER CONFIRMATION REQUIRED — Shipping Operational Parameters</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-900/90 pl-1">
                  <li>
                    <strong>Delivery Window Confirmation:</strong> Current implementation reflects owner's intended breakdown (1–2 business days processing + 5–7 business days transit, expected ~6–9 business days total). Formal ratification required.
                  </li>
                  <li>
                    <strong>Excluded PIN Codes &amp; Surcharges:</strong> Formal list of any non-serviceable PIN codes (e.g. island territories, specific border or high-altitude regions) or remote-area surcharges.
                  </li>
                  <li>
                    <strong>Bulk Consignment Freight Rules:</strong> Formal ratification of freight carrier rate tables for wholesale sacks above 25 kg.
                  </li>
                </ul>
              </div>

              {/* Contact Footer */}
              <div className="pt-2 text-xs text-[#68756E] border-t border-[#E8DECB] flex flex-wrap items-center justify-between gap-3">
                <span>Shipping inquiries: <a href="mailto:info@nyutaelite.com" className="font-semibold text-[#123B2A] underline">info@nyutaelite.com</a></span>
                <span>Helpline: <a href="tel:+918102875852" className="font-semibold text-[#123B2A] underline">+91 81028 75852</a></span>
              </div>
            </article>

            {/* POLICY 2: Return, Replacement, Cancellation & Refund Policy */}
            <article
              id="refund"
              className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8DECB] shadow-xs space-y-6 scroll-mt-32"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E8DECB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#123B2A] text-[#C6A15B] flex items-center justify-center shrink-0">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#092218]">
                      Return, Replacement, Cancellation &amp; Refund Policy
                    </h3>
                    <p className="text-xs text-[#68756E] mt-0.5">
                      Last Updated: October 2026 · Governed by Consumer Protection (E-Commerce) Rules, 2020
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F7F1E5] text-[#123B2A] border border-[#E8DECB] self-start sm:self-auto">
                  Food Safety &amp; Fair Redressal
                </span>
              </div>

              {/* Confirmed Return Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6A15B] block">
                    Requested Reporting Window
                  </span>
                  <p className="font-serif text-xl font-bold text-[#092218]">Within 48 Hours</p>
                  <p className="text-[11px] text-[#68756E]">
                    Report transit damage, broken seals, or order discrepancies within 48h of delivery for immediate carrier investigation.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6A15B] block">
                    Replacement Policy
                  </span>
                  <p className="font-serif text-xl font-bold text-[#092218]">Zero-Cost Reship</p>
                  <p className="text-[11px] text-[#68756E]">
                    Verified damaged, defective, or incorrect packs receive express replacement shipment at no extra charge.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6A15B] block">
                    Refund Reversal
                  </span>
                  <p className="font-serif text-xl font-bold text-[#092218]">Razorpay Gateway</p>
                  <p className="text-[11px] text-[#68756E]">
                    Approved refunds credited back to original payment method (Card/UPI/Net Banking) within 5–7 business days.
                  </p>
                </div>
              </div>

              {/* Food Hygiene & Statutory Safeguard Notice */}
              <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] text-xs sm:text-sm text-[#4A5550] leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#092218]">
                  <ShieldCheck className="w-4 h-4 text-[#C6A15B] shrink-0" />
                  <span>🌿 Food Hygiene, Perishability &amp; Statutory Consumer Safeguard:</span>
                </div>
                <p>
                  Makhana is an edible, naturally air-popped food product sealed in airtight pouches. To maintain strict food safety, freshness, and sanitary hygiene for all patrons, <strong>opened, unsealed, or consumed packets cannot be accepted for return or restocked</strong>.
                </p>
                <p>
                  However, in full compliance with the <strong>Consumer Protection Act, 2019</strong> and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, we guarantee prompt case review and <strong>replacement or refund</strong> whenever an order arrives damaged, defective, unsealed, spoiled, or incorrect.
                </p>
                <p className="text-[11px] text-[#68756E] border-t border-[#E8DECB]/70 pt-1.5">
                  <strong>Statutory Rights Safeguard:</strong> The requested 48-hour reporting timeframe is intended to enable rapid courier claim filing and batch containment; it does <strong>not</strong> operate as an unlawful waiver of any non-waivable statutory rights, consumer warranties, or remedies provided by applicable law.
                </p>
              </div>

              {/* Subsections */}
              <div className="space-y-4 text-xs sm:text-sm text-[#4A5550] leading-relaxed">
                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    1. When Are You Eligible for a Replacement or Refund?
                  </h4>
                  <p className="mb-2">You are eligible for an immediate replacement pack or full refund in any of these scenarios upon claim verification:</p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Transit Damage:</strong> The outer shipping parcel or inner makhana pouch was crushed, torn, punctured, or had its seal compromised during courier transit.</li>
                    <li><strong>Broken or Compromised Freshness Seals:</strong> Pouches delivered unsealed, partially open, or tampered with before arrival.</li>
                    <li><strong>Defective Quality or Spoilage:</strong> Any abnormal discoloration, rancidity, dampness, or foreign material inconsistent with our pure natural quality standard.</li>
                    <li><strong>Incorrect Variant or Missing Items:</strong> The grade (e.g. Normal instead of Premium), weight (e.g. 100g instead of 250g), or item quantity delivered does not match your confirmed order.</li>
                    <li><strong>Expired Product:</strong> Any pack delivered past its marked Best Before date.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    2. How &amp; Where to Report Issues (48-Hour Advisory)
                  </h4>
                  <p>
                    Please notify our customer care team within <strong>48 hours of delivery</strong> with your order details and evidence:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                    <div className="p-3 rounded-xl bg-[#FAF7EF] border border-[#E8DECB]">
                      <span className="font-bold text-[#123B2A] block text-xs">Primary Support Email</span>
                      <a href="mailto:info@nyutaelite.com" className="text-xs font-semibold underline text-[#123B2A] hover:text-[#C6A15B]">
                        info@nyutaelite.com
                      </a>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF7EF] border border-[#E8DECB]">
                      <span className="font-bold text-[#123B2A] block text-xs">Customer Helpline &amp; WhatsApp</span>
                      <a href="tel:+918102875852" className="text-xs font-semibold underline text-[#123B2A] hover:text-[#C6A15B]">
                        +91 81028 75852
                      </a>
                    </div>
                  </div>
                  <p>
                    You may also copy <a href="mailto:enterprisesp0r@gmail.com" className="font-semibold underline">enterprisesp0r@gmail.com</a> for escalations or postal communication to our registered office: <em>Krishna Vihar Lock No. 11, Bahiro Ara, Arrah Sadar, Bhojpur, Bihar 802301</em>.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    3. Reasonable Evidence Requirements
                  </h4>
                  <p>
                    To enable prompt courier claim processing and prevent fraudulent activity, please provide:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>Your <strong>Order Number</strong> (e.g. NYM-XXXXX) and the date of courier delivery.</li>
                    <li>Clear photographs or a continuous unboxing video showing the outer shipping box, shipping label, and the affected pouch.</li>
                    <li>A clear close-up photograph of the printed batch number, packaging date, and the compromised seal or defect.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    4. Claim Review, Eligibility Determination &amp; Settlement
                  </h4>
                  <p>
                    Each claim is evaluated on its merits by our support team within <strong>1–2 business days</strong> of receiving photographic evidence. Refunds or replacements are not issued blindly without review; eligibility is confirmed against delivery logs and verified damage origin:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Approved Replacements:</strong> A fresh replacement parcel is dispatched at zero cost via expedited courier with an updated tracking link.</li>
                    <li><strong>Approved Refunds:</strong> Processed directly via Razorpay back to your original payment method (Credit/Debit Card, UPI, or Net Banking). Bank gateway credits typically reflect in your account within <strong>5–7 business days</strong> depending on your issuing bank.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    5. Cancellation Procedures
                  </h4>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Pre-Dispatch Cancellation:</strong> If you wish to cancel an order, notify us immediately via email or phone. Orders cancelled prior to courier pickup receive a 100% full refund including paid shipping charges.</li>
                    <li><strong>In-Transit Cancellation / Doorstep Refusal:</strong> Once a parcel is handed over to the courier and in transit, it cannot be intercepted. If you refuse delivery at your doorstep, return logistics handling and shipping fee deductions are subject to confirmed business policy (flagged for owner confirmation).</li>
                  </ul>
                </div>
              </div>

              {/* Unresolved Owner Decision Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>OWNER CONFIRMATION REQUIRED — Return &amp; Cancellation Rules</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-900/90 pl-1">
                  <li>
                    <strong>Reporting Window Ratification:</strong> Current policy reflects the owner's chosen 48-hour reporting guideline with non-waivable statutory consumer remedies preserved. Formal policy ratification required.
                  </li>
                  <li>
                    <strong>Doorstep Delivery Refusal Fee:</strong> Confirmation whether customer doorstep refusals of non-damaged parcels incur two-way courier return shipping cost deductions.
                  </li>
                </ul>
              </div>
            </article>

            {/* POLICY 3: Privacy Policy */}
            <article
              id="privacy"
              className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8DECB] shadow-xs space-y-6 scroll-mt-32"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E8DECB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#123B2A] text-[#C6A15B] flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#092218]">
                      Privacy Policy
                    </h3>
                    <p className="text-xs text-[#68756E] mt-0.5">
                      Last Updated: October 2026 · IT Act, 2000 &amp; DPDP Act, 2023 Principles
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F7F1E5] text-[#123B2A] border border-[#E8DECB] self-start sm:self-auto">
                  Strict Data Protection
                </span>
              </div>

              {/* Verified Privacy Architecture Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6A15B] block">
                    Zero Card/UPI Storage
                  </span>
                  <p className="font-serif text-xl font-bold text-[#092218]">100% Razorpay</p>
                  <p className="text-[11px] text-[#68756E]">
                    Card numbers, CVVs, and UPI PINs are entered directly into Razorpay PCI-DSS Level 1 frame.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6A15B] block">
                    Analytics Consent
                  </span>
                  <p className="font-serif text-xl font-bold text-[#092218]">Opt-In Required</p>
                  <p className="text-[11px] text-[#68756E]">
                    Google Analytics cookies remain strictly disabled until explicit visitor approval.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6A15B] block">
                    Data Monetization
                  </span>
                  <p className="font-serif text-xl font-bold text-[#092218]">Never Sold</p>
                  <p className="text-[11px] text-[#68756E]">
                    We never sell, rent, or trade customer contact details to third-party data brokers.
                  </p>
                </div>
              </div>

              {/* Subsections */}
              <div className="space-y-4 text-xs sm:text-sm text-[#4A5550] leading-relaxed">
                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    1. Information We Collect (Verified by Codebase Audit)
                  </h4>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Account &amp; Identity:</strong> Full name, email address, phone number, encrypted password hash (bcrypt), and optional Google OAuth ID.</li>
                    <li><strong>Order &amp; Delivery:</strong> Recipient name, complete shipping address (door number, street, landmark, city, state, postal code), phone number, and order item snapshots.</li>
                    <li><strong>B2B Wholesale Enquiries:</strong> Business name, contact person, estimated volume, and destination state.</li>
                    <li><strong>Local Session Tokens:</strong> Secure authentication tokens stored in browser local storage to maintain your login session and cart contents.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    2. Razorpay Payment Processing (Zero Financial Credential Storage)
                  </h4>
                  <p>
                    All electronic payments on our storefront are securely handled by <strong>Razorpay Software Private Limited</strong>. When you check out, your payment credentials (credit/debit card number, expiry, CVV, Net Banking credentials, or UPI PIN) are securely transmitted directly to Razorpay over end-to-end TLS encryption.
                  </p>
                  <p className="mt-1">
                    <strong>NYUTA ELITE MAKHANA never captures, accesses, or stores your raw card numbers, CVV codes, or bank passwords on our servers.</strong> We only store transaction references (Razorpay Order ID, Payment ID, amount in INR, and cryptographic signature verification) to acknowledge payment and support refunds.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    3. Cookies &amp; Optional Storefront Analytics
                  </h4>
                  <p>
                    We deploy essential technical cookies necessary for session persistence, authentication, and shopping cart operations. In addition, our website incorporates privacy-conscious Google Analytics 4 (GA4) telemetry.
                  </p>
                  <p className="mt-1">
                    In compliance with ethical digital privacy standards, <strong>analytics tracking is kept strictly dormant until you click "Allow Analytics"</strong> on our consent banner. Personal delivery addresses, telephone numbers, and financial tokens are never forwarded to analytics. You can adjust your preference anytime via the <span className="font-semibold text-[#123B2A]">Analytics Preferences</span> link in our footer.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    4. Data Sharing &amp; Operational Disclosures
                  </h4>
                  <p>
                    We share customer data strictly with operational partners essential to processing your order:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Logistics Carriers:</strong> Recipient name, address, and telephone number for parcel transportation and delivery confirmation.</li>
                    <li><strong>Payment Aggregator:</strong> Transaction details shared with Razorpay for fraud screening and payment settlement.</li>
                    <li><strong>Statutory Compliance:</strong> Lawful disclosures to Indian tax, GST, or regulatory authorities when mandated by valid legal process.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    5. Customer Data Rights &amp; Privacy Contact
                  </h4>
                  <p>
                    You have the right to request access to your stored personal data, request correction of erroneous information, or request deletion of your storefront account. To submit a data request, please email{' '}
                    <a href="mailto:info@nyutaelite.com" className="font-semibold text-[#123B2A] underline">
                      info@nyutaelite.com
                    </a>{' '}
                    with the subject line <em>"Data Privacy Request"</em>.
                  </p>
                </div>
              </div>

              {/* Unresolved Owner Decision Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>OWNER CONFIRMATION REQUIRED — Privacy &amp; Governance Details</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-900/90 pl-1">
                  <li>
                    <strong>Statutory Data Retention Schedule:</strong> Formal confirmation of order invoice retention period (typically 8 years under Indian GST/tax rules vs account purge).
                  </li>
                  <li>
                    <strong>Grievance Officer Designation:</strong> Formal appointment and publication of the designated Data Grievance Redressal Officer under the IT Rules.
                  </li>
                </ul>
              </div>
            </article>

            {/* POLICY 4: Terms of Service */}
            <article
              id="terms"
              className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8DECB] shadow-xs space-y-6 scroll-mt-32"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E8DECB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#123B2A] text-[#C6A15B] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#092218]">
                      Terms and Conditions of Sale &amp; Use
                    </h3>
                    <p className="text-xs text-[#68756E] mt-0.5">
                      Last Updated: October 2026 · Governed by the Laws of India
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F7F1E5] text-[#123B2A] border border-[#E8DECB] self-start sm:self-auto">
                  Fair E-Commerce Terms
                </span>
              </div>

              {/* Subsections */}
              <div className="space-y-4 text-xs sm:text-sm text-[#4A5550] leading-relaxed">
                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    1. Agreement to Terms
                  </h4>
                  <p>
                    These Terms and Conditions govern your access to and purchases from <strong className="text-[#092218]">https://nyutaelite.com</strong> operated by NYUTA ELITE MAKHANA. By creating an account, browsing our website, or placing an order, you agree to be bound by these terms.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    2. Natural Product Characteristics &amp; Sourcing
                  </h4>
                  <p>
                    Makhana (Euryale ferox) is a natural agricultural harvest cultivated in freshwater wetland ponds in Bihar. While all packs undergo strict mechanical grading and hand-sorting, minor natural variations in nut puffing diameter, curvature, and subtle natural markings are inherent to natural fox nuts and do not constitute a defect.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    3. Pricing, Taxes &amp; Product Availability
                  </h4>
                  <p>
                    All prices displayed on the storefront are in <strong>Indian Rupees (INR)</strong> and are <strong>inclusive of applicable Goods and Services Tax (GST)</strong>. Shipping fees, where applicable, are calculated and itemized clearly at checkout. We reserve the right to correct accidental pricing errors before order dispatch with notice and full refund to the customer.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    4. Order Acceptance &amp; Payments
                  </h4>
                  <p>
                    Receipt of an automated order number confirms our receipt of your order; a binding contract of sale is formed when the product is packed and handed over to the courier partner. All digital transactions are processed securely via Razorpay.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    5. Intellectual Property
                  </h4>
                  <p>
                    All brand logos, trademarks, packaging artwork, website copy, product photography, and digital graphics are the exclusive intellectual property of NYUTA ELITE MAKHANA. Unauthorized reproduction or commercial imitation is strictly prohibited.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    6. Statutory Consumer Protection Rights &amp; No Unlawful Waivers
                  </h4>
                  <p>
                    Nothing in these Terms and Conditions operates to exclude, restrict, or modify any non-waivable statutory rights, warranties, or remedies available to consumers under the <strong>Consumer Protection Act, 2019</strong> or the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    7. Governing Law &amp; Jurisdiction
                  </h4>
                  <p>
                    These terms are governed by and construed in accordance with the laws of the Republic of India. Subject to applicable consumer dispute redressal forum jurisdiction, competent courts situated in Bhojpur / Arrah, Bihar, India shall have jurisdiction over legal proceedings.
                  </p>
                </div>
              </div>

              {/* Unresolved Owner Decision Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>OWNER CONFIRMATION REQUIRED — Legal Entity &amp; Registration</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-900/90 pl-1">
                  <li>
                    <strong>Registered Legal Entity Name:</strong> Confirmation of the formal entity structure (Proprietorship, Partnership, or Private Limited) and registered corporate address if distinct from the Bhojpur registered office.
                  </li>
                </ul>
              </div>
            </article>

                        {/* POLICY 5: Food Safety, FSSAI Registration & Product Information */}
            <article
              id="fssai"
              className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8DECB] shadow-xs space-y-6 scroll-mt-32"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E8DECB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#123B2A] text-[#C6A15B] flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#092218]">
                      Food Safety, FSSAI Registration &amp; Product Information
                    </h3>
                    <p className="text-xs text-[#68756E] mt-0.5">
                      Registration Certificate under Food Safety and Standards Act, 2006 · Government of Bihar
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#123B2A] text-[#C6A15B] border border-[#C6A15B]/40 self-start sm:self-auto shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C6A15B]" />
                  <span>FSSAI Reg. 20426021000494</span>
                </span>
              </div>

              {/* Verified FSSAI Certificate Dossier Card */}
              <div className="bg-[#FCFAF5] border-2 border-[#123B2A]/20 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DECB] pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#123B2A]" />
                    <h4 className="font-serif text-base font-bold text-[#092218]">
                      Official FSSAI Registration Certificate Details
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#123B2A] bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Active &amp; Fee Paid
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#4A5550]">
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                        Registration Number
                      </span>
                      <p className="font-mono text-sm sm:text-base font-extrabold text-[#123B2A] tracking-wider mt-0.5">
                        20426021000494
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                        Food Business Operator (FBO) Name
                      </span>
                      <p className="font-bold text-[#092218] mt-0.5">
                        RAUSHAN KUMAR C/O NyutaElite
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                        Registered Business &amp; Premises Address
                      </span>
                      <p className="text-[#092218] leading-relaxed mt-0.5">
                        Krishna Vihar Lock No 11, Bahiro Ara, Bhojpur Bihar, Arrah Sadar, Arrah Sadar, Bhojpur, Bihar – 802301
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                        Kind of Business (KOB)
                      </span>
                      <p className="font-semibold text-[#123B2A] mt-0.5">
                        Wholesaler, Distributor, Retailer
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                        Permitted Food Category (Product Annexure 1)
                      </span>
                      <p className="font-semibold text-[#092218] mt-0.5">
                        Category 04 — Fruits and vegetables (including fresh pulses, legumes, seaweeds), and nuts and seeds
                      </p>
                      <p className="text-[11px] text-[#68756E] mt-0.5">
                        (Covers whole, graded, puffed fox nuts / makhana)
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                        Issuing Authority &amp; Jurisdiction
                      </span>
                      <p className="text-[#092218] mt-0.5">
                        Registering Authority, Bhojpur · Department of Health and Family Welfare, Government of Bihar
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                          Certificate Issued
                        </span>
                        <p className="font-bold text-[#092218] mt-0.5">25-08-2026</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                          Fee Paid Validity
                        </span>
                        <p className="font-bold text-emerald-800 mt-0.5">24-08-2027</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                        Turnover Scale Authorization
                      </span>
                      <p className="text-[#68756E] mt-0.5">
                        Authorized to conduct food business activities with annual turnover up to Rs. 1.5 Crore.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statutory Scope Clarification */}
                <div className="p-3.5 bg-white rounded-xl border border-[#E8DECB] text-xs text-[#4A5550] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#123B2A]">
                    <ShieldCheck className="w-4 h-4 text-[#C6A15B] shrink-0" />
                    <span>Statutory Scope &amp; Business Classification Notice:</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    This certificate is an official <strong>Registration Certificate under the Food Safety and Standards Act, 2006</strong>, authorizing the business as a <strong>Wholesaler, Distributor, and Retailer</strong>. In strict compliance with regulatory ethics, it is not a manufacturing licence and does not claim manufacturing authorization. All NYUTA ELITE makhana packs are procured, graded, sorted, and distributed under this registered trading and retail scope.
                  </p>
                </div>

                {/* Sourcing & Premises Alignment Notice for Owner Review */}
                <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                  <span className="font-bold block text-amber-900 text-[11px] uppercase tracking-wider">
                    Operational Note for Owner Review:
                  </span>
                  <p className="leading-relaxed text-[11px] text-amber-900/90">
                    The FSSAI registered premises is recorded at <em>Krishna Vihar Lock No. 11, Bahiro Ara, Bhojpur, Bihar 802301</em> under FBO <em>RAUSHAN KUMAR C/O NyutaElite</em>. Sourcing and dispatch operations located in the Mithila/Darbhanga harvest wetland corridor operate under this central distribution umbrella. If an additional primary processing facility registration is needed, it can be added to FoSCoS during the annual review.
                  </p>
                </div>
              </div>

              {/* Mandatory Food Product Labeling Standards */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-[#092218] text-sm sm:text-base">
                  Standard Product &amp; Food Safety Disclosures:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-2">
                    <span className="font-bold text-[#123B2A] block uppercase tracking-wider text-[11px]">
                      General Product Identity
                    </span>
                    <p><strong>Product Name:</strong> Puffed Fox Nuts / Makhana (Euryale ferox)</p>
                    <p><strong>Brand Name:</strong> NYUTA ELITE MAKHANA</p>
                    <p><strong>FSSAI Registration:</strong> 20426021000494</p>
                    <p><strong>Classification:</strong> 100% Pure Vegetarian (Green Dot symbol)</p>
                    <p><strong>Quality Grades:</strong> Premium Jumbo Grade &amp; Normal Everyday Grade</p>
                    <p><strong>Available Pack Weights:</strong> 100g, 200g, 250g in sealed pouches</p>
                    <p><strong>Ingredients:</strong> 100% Raw Fox Nuts (Single Ingredient, No Additives)</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-2">
                    <span className="font-bold text-[#123B2A] block uppercase tracking-wider text-[11px]">
                      Nutritional Profile (Approx. Per 100g)
                    </span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                      <div>Energy: <span className="font-semibold">~350 kcal</span></div>
                      <div>Protein: <span className="font-semibold">~9.7 g</span></div>
                      <div>Carbohydrates: <span className="font-semibold">~76.9 g</span></div>
                      <div>Dietary Fiber: <span className="font-semibold">~14.5 g</span></div>
                      <div>Total Fat: <span className="font-semibold">~0.5 g</span></div>
                      <div>Saturated Fat: <span className="font-semibold">~0.1 g</span></div>
                      <div>Calcium: <span className="font-semibold">~60 mg</span></div>
                      <div>Iron: <span className="font-semibold">~1.4 mg</span></div>
                    </div>
                    <p className="text-[10px] text-[#68756E] pt-1">
                      *Nutritional values are approximate reference values characteristic of standardized raw fox nuts.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-2">
                    <span className="font-bold text-[#123B2A] block uppercase tracking-wider text-[11px]">
                      Storage &amp; Shelf Life
                    </span>
                    <p><strong>Storage Instructions:</strong> Store in a cool, dry place away from direct sunlight and dampness. Once opened, transfer to an airtight container to preserve crisp crunch.</p>
                    <p><strong>Shelf Life:</strong> Best before 12 months from packing date.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-2">
                    <span className="font-bold text-[#123B2A] block uppercase tracking-wider text-[11px]">
                      Registered Operator &amp; Customer Care
                    </span>
                    <p><strong>Registered FBO:</strong> RAUSHAN KUMAR C/O NyutaElite, Bhojpur, Bihar – 802301</p>
                    <p><strong>Harvest Origin:</strong> Mithila Region, Bihar, India · <strong>Registered Office:</strong> Bhojpur, Bihar – 802301</p>
                    <p><strong>Customer Care Email:</strong> <a href="mailto:info@nyutaelite.com" className="font-semibold underline">info@nyutaelite.com</a></p>
                    <p><strong>Helpline:</strong> <a href="tel:+918102875852" className="font-semibold underline">+91 81028 75852</a></p>
                  </div>
                </div>
              </div>
            </article>

                                    {/* POLICY 6: Grievance Redressal Mechanism & Proposed Officer */}
            <article
              id="grievance"
              className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8DECB] shadow-xs space-y-6 scroll-mt-32"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E8DECB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#123B2A] text-[#C6A15B] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#092218]">
                      Grievance Redressal Mechanism
                    </h3>
                    <p className="text-xs text-[#68756E] mt-0.5">
                      Pursuant to Information Technology Act, 2000 &amp; Consumer Protection (E-Commerce) Rules, 2020
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 self-start sm:self-auto">
                  Proposed Officer · Pending Ratification
                </span>
              </div>

              {/* Proposed Grievance Officer Dossier */}
              <div className="p-5 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#123B2A]" />
                  <h4 className="font-serif text-base font-bold text-[#092218]">
                    Proposed Grievance Redressal Officer Information
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#4A5550]">
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                        Proposed Grievance Officer Name
                      </span>
                      <p className="font-bold text-[#092218] text-sm mt-0.5">
                        Raushan Kumar
                      </p>
                      <p className="text-[10px] text-amber-800 font-medium">
                        (Proposed by Business Owner — formal corporate appointment resolution pending)
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                        Official Grievance Email
                      </span>
                      <p className="mt-0.5">
                        <a href="mailto:info@nyutaelite.com" className="font-semibold text-[#123B2A] underline hover:text-[#C6A15B]">
                          info@nyutaelite.com
                        </a>
                      </p>
                      <p className="text-[10px] text-[#68756E]">
                        (Subject line: "Grievance / Dispute Escalation — Order #[Order ID]")
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                        Additional Escalation Email
                      </span>
                      <p className="mt-0.5">
                        <a href="mailto:enterprisesp0r@gmail.com" className="font-semibold text-[#123B2A] underline hover:text-[#C6A15B]">
                          enterprisesp0r@gmail.com
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                        Postal Notice Service Address
                      </span>
                      <p className="text-[#092218] leading-relaxed mt-0.5">
                        Krishna Vihar Lock No. 11, Bahiro Ara, Arrah Sadar, Bhojpur, Bihar 802301, India
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                        Support Line &amp; Contact Number
                      </span>
                      <p className="mt-0.5">
                        <a href="tel:+918102875852" className="font-semibold text-[#123B2A] underline hover:text-[#C6A15B]">
                          +91 81028 75852
                        </a>{' '}
                        <span className="text-[11px] text-[#68756E]">(Mon – Sat, 9:00 AM – 7:00 PM IST)</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statutory Pending Approval Disclosure */}
                <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Statutory Designation Disclosure:</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-amber-900/90">
                    The details above represent the business owner's intended nomination for the statutory Grievance Redressal Officer under Rule 5(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and Rule 4 of the Consumer Protection (E-Commerce) Rules, 2020. Final statutory publication remains subject to formal owner confirmation of the corporate appointment resolution and whether a dedicated channel (e.g. <code>grievance@nyutaelite.com</code>) will be deployed.
                  </p>
                </div>
              </div>

              {/* Escalation Procedure */}
              <div className="space-y-3 text-xs sm:text-sm text-[#4A5550] leading-relaxed">
                <h4 className="font-bold text-[#092218] text-sm sm:text-base">
                  Grievance Redressal Procedure:
                </h4>
                <ol className="list-decimal list-inside space-y-2 pl-1">
                  <li>
                    <strong>Step 1 — Frontline Customer Care:</strong> Please reach out to customer support at <a href="mailto:info@nyutaelite.com" className="font-semibold text-[#123B2A] underline">info@nyutaelite.com</a> or <a href="tel:+918102875852" className="font-semibold text-[#123B2A] underline">+91 81028 75852</a> with your order number. Most queries are resolved within 24–48 hours.
                  </li>
                  <li>
                    <strong>Step 2 — Grievance Escalation:</strong> If your issue is not resolved satisfactorily through regular support channels within 3 business days, escalate to the proposed Grievance Officer at <a href="mailto:info@nyutaelite.com" className="font-semibold text-[#123B2A] underline">info@nyutaelite.com</a> with the subject header <em>"Attention: Grievance Officer - Escalation [Order Number]"</em>.
                  </li>
                  <li>
                    <strong>Step 3 — Statutory Acknowledgment &amp; Resolution:</strong> In compliance with Indian e-commerce regulations, all escalated grievances receive formal acknowledgment within 48 hours and a comprehensive investigation and resolution within 30 days.
                  </li>
                </ol>
              </div>
            </article>

            {/* SECTION 7: Owner Policy Confirmation Checklist */}
            <article
              id="checklist"
              className="bg-[#123B2A] text-white p-6 sm:p-10 rounded-3xl border border-[#092218] shadow-md space-y-6 scroll-mt-32"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#092218]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C6A15B] text-[#123B2A] flex items-center justify-center shrink-0">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-white">
                      Owner Confirmation Checklist &amp; Action Plan
                    </h3>
                    <p className="text-xs text-[#D5DED6] mt-0.5">
                      Operational parameters &amp; regulatory verification tracking
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#C6A15B] text-[#123B2A] self-start sm:self-auto">
                  1 Verified · 7 In Review
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#D5DED6] leading-relaxed">
                FSSAI registration details have been verified and integrated into the store policy hub. The remaining operational parameters reflect confirmed owner intent with formal ratification pending:
              </p>

              <div className="space-y-3">
                {/* 1. FSSAI - COMPLETED */}
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400 text-[10px] font-bold">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-white text-xs sm:text-sm">
                        1. FSSAI Certificate Verification &amp; Registration
                      </h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-700/50">
                        COMPLETED &amp; VERIFIED
                      </span>
                    </div>
                    <p className="text-xs text-[#D5DED6] leading-relaxed">
                      Official Registration Certificate No. <strong className="text-white">20426021000494</strong> issued by Government of Bihar / FSSAI to <em>RAUSHAN KUMAR C/O NyutaElite</em> (Bhojpur, Bihar – 802301) for Wholesaler, Distributor, Retailer operations under Category 04 (Nuts &amp; Seeds), valid up to 24-08-2027. Accurately published on the website.
                    </p>
                  </div>
                </div>

                {/* 2 to 7 - PENDING OWNER CONFIRMATION */}
                {[
                  {
                    num: '2',
                    title: '2. Return / Damage Reporting Window (48 Hours Intended)',
                    status: 'PROPOSED INTENT: 48 HOURS · RATIFICATION PENDING',
                    desc: 'Owner has confirmed intended 48-hour post-delivery window for transit-damage and broken seal reporting. Implemented with statutory consumer protection safeguard clause preserving legal remedies.',
                  },
                  {
                    num: '3',
                    title: '3. Delivery Timeline (1–2 Days Processing + 5–7 Days Transit)',
                    status: 'PROPOSED INTENT: ~6–9 DAYS TOTAL · RATIFICATION PENDING',
                    desc: 'Standardized across Shipping Policy, FAQ, Product Page, and Checkout. Order processing clearly separated from courier transit; confirmed as partner estimates, not guarantees.',
                  },
                  {
                    num: '4',
                    title: '4. Shipping Pricing Rule (₹40 Standard / Free at ₹499+)',
                    status: 'ACTIVE IN CODE & BACKEND · CONFIRMED BASELINE',
                    desc: 'Matches backend order.service.ts and frontend checkout calculation. Confirmed as active baseline rule; wholesale sack freight quoted separately.',
                  },
                  {
                    num: '5',
                    title: '5. Regional Service Exclusions & Remote PIN Codes',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Formal confirmation of any non-serviceable PIN codes (e.g. island territories or high-altitude remote regions) or courier special freight surcharges.',
                  },
                  {
                    num: '6',
                    title: '6. Doorstep Refusal Deductions & In-Transit Cancellations',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Confirm whether customer doorstep refusals of non-damaged parcels incur actual two-way return courier fee deductions.',
                  },
                  {
                    num: '7',
                    title: '7. Statutory Grievance Redressal Officer Designation',
                    status: 'PROPOSED: RAUSHAN KUMAR · RATIFICATION PENDING',
                    desc: 'Proposed by owner: Raushan Kumar, info@nyutaelite.com, Bhojpur registered office. Formal appointment resolution and permanent mailbox confirmation pending.',
                  },
                  {
                    num: '8',
                    title: '8. Legal Entity Constitution & Tax Registration Status',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Confirmation of formal commercial entity structure (Sole Proprietorship, Partnership, or Pvt Ltd) and GST registration status if applicable.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#092218]/60 border border-[#C6A15B]/20 flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded-full border border-[#C6A15B] flex items-center justify-center shrink-0 mt-0.5 text-[#C6A15B] text-[10px] font-bold">
                      {item.num}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-white text-xs sm:text-sm">{item.title}</h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-700/50">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#D5DED6] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Compliance Disclaimer Notice */}
              <div className="p-4 rounded-2xl bg-white/10 border border-white/10 text-xs text-[#D5DED6] space-y-2">
                <p className="font-semibold text-white">
                  Compliance Status Notice:
                </p>
                <p className="leading-relaxed text-[11px]">
                  Displaying the verified FSSAI registration certificate fulfills statutory food-safety transparency for wholesale, distribution, and retail of Category 04 nuts and seeds. It does not certify the complete business as legally compliant in all jurisdictions until the remaining owner confirmation action items are finalized.
                </p>
                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span>
                    Direct inquiries: <a href="mailto:info@nyutaelite.com" className="font-bold text-white underline">info@nyutaelite.com</a>
                  </span>
                  <span className="text-[#C6A15B] font-semibold">NYUTA ELITE MAKHANA</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
};
