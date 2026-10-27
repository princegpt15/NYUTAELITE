# scripts/create_about_policies.py
about_content = '''// src/pages/About.tsx
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
} from 'lucide-react';

const brandEmblem = '/nyuta-elite-logo.png';

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
            NYUTA ELITE MAKHANA is dedicated to bringing authentic, carefully selected Euryale ferox (fox nuts) directly from freshwater lotus ponds to your home pantry.
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6A15B] block">
                    Order Processing
                  </span>
                  <p className="font-serif text-xl font-bold text-[#092218]">1–2 Business Days</p>
                  <p className="text-[11px] text-[#68756E]">
                    Packed &amp; labeled at our Bihar hub (Mon–Sat, excl. national holidays).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6A15B] block">
                    Estimated Delivery
                  </span>
                  <p className="font-serif text-xl font-bold text-[#092218]">5–7 Business Days</p>
                  <p className="text-[11px] text-[#68756E]">
                    Typical courier transit timeline to serviceable PIN codes across India.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6A15B] block">
                    Transit Clarification
                  </span>
                  <p className="font-serif text-xl font-bold text-[#092218]">Estimates Only</p>
                  <p className="text-[11px] text-[#68756E]">
                    Timelines are estimated schedules, not guaranteed commitments.
                  </p>
                </div>
              </div>

              {/* Subsections */}
              <div className="space-y-4 text-xs sm:text-sm text-[#4A5550] leading-relaxed">
                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    1. Order Processing &amp; Handoff
                  </h4>
                  <p>
                    All retail makhana orders placed on <strong className="text-[#092218]">NYUTA ELITE MAKHANA</strong> are carefully inspected, hand-packed in airtight pouches, and handed over to our contracted courier partners within <strong>1–2 business days</strong> following order confirmation.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    2. Serviceable Areas &amp; Geographic Reach
                  </h4>
                  <p>
                    We currently ship to most residential, retail, and commercial PIN codes throughout India. Delivery timelines may be extended for remote interior zones, hilly sectors, or regions experiencing severe weather or logistics interruptions.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    3. Shipping Rates &amp; Free Shipping Rule
                  </h4>
                  <p>
                    On our retail storefront, standard delivery is <strong className="text-[#092218]">FREE for orders of ₹499 and above</strong>. For orders below ₹499, a flat shipping charge of <strong>₹40</strong> is applied at checkout. Applicable delivery charges are always itemized transparently in your shopping cart before you confirm payment.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    4. Consignment Tracking
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
                    5. Undeliverable Shipments &amp; Address Accuracy
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
                    <strong>Delivery Window Baseline:</strong> Formal confirmation whether the 5–7 business days starts from initial order placement or from courier pickup.
                  </li>
                  <li>
                    <strong>Excluded PIN Codes:</strong> Formal confirmation of any non-serviceable PIN codes (e.g., island territories or high-altitude regions).
                  </li>
                  <li>
                    <strong>Bulk Consignment Freight:</strong> Clarification of whether bulk freight rates apply separately for wholesale sacks above 25 kg.
                  </li>
                </ul>
              </div>

              {/* Contact Footer */}
              <div className="pt-2 text-xs text-[#68756E] border-t border-[#E8DECB] flex flex-wrap items-center justify-between gap-3">
                <span>Shipping inquiries: <a href="mailto:info@nutyaelite.com" className="font-semibold text-[#123B2A] underline">info@nutyaelite.com</a></span>
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
                      Last Updated: October 2026 · Compliant with Consumer Protection (E-Commerce) Rules, 2020
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F7F1E5] text-[#123B2A] border border-[#E8DECB] self-start sm:self-auto">
                  Food Safety Standards
                </span>
              </div>

              {/* Food Hygiene & Fairness Notice */}
              <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] text-xs sm:text-sm text-[#4A5550] leading-relaxed space-y-2">
                <p className="font-bold text-[#092218]">
                  🌿 Food Product Hygiene &amp; Perishability Considerations:
                </p>
                <p>
                  Makhana is an edible, naturally air-popped food product sealed in airtight packaging. To preserve food safety, freshness, and strict sanitary standards for all patrons, <strong>opened, unsealed, or consumed packets cannot be accepted for return or restocked</strong>.
                </p>
                <p>
                  However, in full compliance with Indian consumer protection standards, we guarantee prompt <strong>replacement or refund</strong> whenever an order arrives damaged, defective, incomplete, or incorrect.
                </p>
              </div>

              {/* Subsections */}
              <div className="space-y-4 text-xs sm:text-sm text-[#4A5550] leading-relaxed">
                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    1. When Are You Eligible for a Replacement or Refund?
                  </h4>
                  <p className="mb-2">You are fully eligible for an immediate replacement pack or full refund in any of these scenarios:</p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Transit Damage:</strong> The shipping parcel or inner makhana pouch was crushed, torn, punctured, or had its seal compromised in transit.</li>
                    <li><strong>Defective Quality or Spoilage:</strong> Any abnormal discoloration, rancidity, or quality defect inconsistent with our purity guarantee.</li>
                    <li><strong>Incorrect Item Delivered:</strong> The grade (e.g. Normal instead of Premium), weight (e.g. 100g instead of 250g), or SKU received did not match your confirmed order.</li>
                    <li><strong>Missing Items:</strong> Items listed on your delivery challan or invoice were missing from the package.</li>
                    <li><strong>Expired Product:</strong> Any product delivered past its marked Best Before date.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    2. How &amp; Where to Report Issues
                  </h4>
                  <p>
                    Please contact our customer support desk as soon as possible after delivery with your claim details:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                    <div className="p-3 rounded-xl bg-[#FAF7EF] border border-[#E8DECB]">
                      <span className="font-bold text-[#123B2A] block text-xs">Primary Support Email</span>
                      <a href="mailto:info@nutyaelite.com" className="text-xs font-semibold underline text-[#123B2A] hover:text-[#C6A15B]">
                        info@nutyaelite.com
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
                    You can also copy <a href="mailto:enterprisesp0r@gmail.com" className="font-semibold underline">enterprisesp0r@gmail.com</a> for enterprise and escalation matters.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    3. Reasonable Evidence Requirements
                  </h4>
                  <p>
                    To expedite verification and prevent fraudulent claims, please provide:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>Your <strong>Order Number</strong> (e.g., NYM-XXXXX) and delivery date.</li>
                    <li>Clear photographs or a continuous unboxing video showing the outer shipping box, shipping label, and the affected pouch.</li>
                    <li>A clear close-up of the batch number and packaging seal.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    4. Replacement &amp; Refund Processing Timelines
                  </h4>
                  <p>
                    Once photographic evidence is submitted, our support team inspects and resolves the claim within <strong>1–2 business days</strong>. Upon approval:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Replacements:</strong> A fresh replacement parcel is dispatched at zero cost via expedited courier.</li>
                    <li><strong>Refunds:</strong> Processed directly via Razorpay to your original payment method (Credit/Debit Card, UPI, or Net Banking). Gateway refunds typically reflect in your bank account within <strong>5–7 business days</strong> depending on your financial institution.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-[#092218] text-sm sm:text-base mb-1">
                    5. Order Cancellation Rules
                  </h4>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Pre-Dispatch Cancellation:</strong> If you wish to cancel an order, please email or call us immediately. Orders cancelled prior to warehouse dispatch receive a 100% full refund including any paid shipping charges.</li>
                    <li><strong>Post-Dispatch In-Flight Cancellation:</strong> Once an order is handed over to the courier and in transit, it cannot be recalled. If you refuse delivery at your doorstep, return logistics handling and shipping charge deductions are subject to confirmed business policy.</li>
                  </ul>
                </div>
              </div>

              {/* Unresolved Owner Decision Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>OWNER CONFIRMATION REQUIRED — Return &amp; Refund Decisions</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-900/90 pl-1">
                  <li>
                    <strong>Official Reporting Window:</strong> Legacy references varied between 48 hours and 5 days. Owner confirmation is required to lock in the official window (e.g., 48 hours vs 3 days vs 5 days from delivery).
                  </li>
                  <li>
                    <strong>Post-Dispatch Cancellation Fee:</strong> Confirmation whether customer-side delivery refusals incur standard courier return charges deducted from refund.
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
                    <a href="mailto:info@nutyaelite.com" className="font-semibold text-[#123B2A] underline">
                      info@nutyaelite.com
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
                    These Terms and Conditions govern your access to and purchases from <strong className="text-[#092218]">https://nutyaelite.com</strong> operated by NYUTA ELITE MAKHANA. By creating an account, browsing our website, or placing an order, you agree to be bound by these terms.
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
                    These terms are governed by and construed in accordance with the laws of the Republic of India. Subject to applicable consumer dispute redressal forum jurisdiction, competent courts situated in Darbhanga / Bihar, India shall have jurisdiction over legal proceedings.
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
                    <strong>Registered Legal Entity Name:</strong> Confirmation of the formal entity structure (Proprietorship, Partnership, or Private Limited) and registered corporate address if distinct from the Darbhanga dispatch facility.
                  </li>
                </ul>
              </div>
            </article>

            {/* POLICY 5: FSSAI and Food Product Quality Transparency */}
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
                      Food Safety and Standards (Packaging and Labelling) Regulations Compliance
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F7F1E5] text-[#123B2A] border border-[#E8DECB] self-start sm:self-auto">
                  Regulatory Transparency
                </span>
              </div>

              {/* FSSAI Administrative Verification Notice */}
              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 text-xs text-amber-950 space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                  <span>FSSAI Licence / Registration Administrative Verification Notice</span>
                </div>
                <p className="leading-relaxed">
                  The business owner has confirmed that an active <strong>FSSAI licence/registration</strong> is maintained for the sourcing, grading, and packaging of NYUTA ELITE MAKHANA. In strict accordance with regulatory integrity and anti-fabrication standards:
                </p>
                <div className="p-3 bg-white/80 rounded-xl border border-amber-200/60 space-y-1">
                  <p className="font-semibold text-amber-950">
                    Document Verification Underway:
                  </p>
                  <p className="text-[11px] text-amber-900">
                    The exact 14-digit FSSAI licence/registration number, registered operator name, and licensed facility address are currently being verified against the physical certificate. The verified number will be published directly on this portal and stamped on retail packaging upon final document reconciliation. No unverified or placeholder licence number is published.
                  </p>
                </div>
              </div>

              {/* Mandatory Food Product Labeling Standards */}
              <div className="space-y-4">
                <h4 className="font-bold text-[#092218] text-sm sm:text-base">
                  Mandatory Online Food Product Information:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-2">
                    <span className="font-bold text-[#123B2A] block uppercase tracking-wider text-[11px]">
                      General Product Identity
                    </span>
                    <p><strong>Product Name:</strong> Puffed Fox Nuts / Makhana (Euryale ferox)</p>
                    <p><strong>Brand Name:</strong> NYUTA ELITE MAKHANA</p>
                    <p><strong>Classification:</strong> 100% Pure Vegetarian (Green Dot)</p>
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
                      Origin &amp; Customer Care Redressal
                    </span>
                    <p><strong>Harvest &amp; Dispatch Location:</strong> Mithila Region, Darbhanga, Bihar 846004, India</p>
                    <p><strong>Support Email:</strong> <a href="mailto:info@nutyaelite.com" className="font-semibold underline">info@nutyaelite.com</a></p>
                    <p><strong>Helpline:</strong> <a href="tel:+918102875852" className="font-semibold underline">+91 81028 75852</a></p>
                  </div>
                </div>
              </div>
            </article>

            {/* SECTION 6: Owner Policy Confirmation Checklist */}
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
                      Items marked for final business decision and regulatory document verification
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#C6A15B] text-[#123B2A] self-start sm:self-auto">
                  Owner Action Items
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#D5DED6] leading-relaxed">
                To complete the transition from interim customer-friendly policies to finalized legal text, the business owner must provide and confirm the following seven operational parameters:
              </p>

              <div className="space-y-3">
                {[
                  {
                    title: '1. FSSAI Licence / Registration Certificate',
                    desc: 'Provide the official certificate to publish the verified 14-digit number, legal entity name, and licensed facility address on the website and retail packaging.',
                  },
                  {
                    title: '2. Return / Damage Reporting Window',
                    desc: 'Formally choose whether customer transit-damage claims must be filed within 48 hours, 72 hours, or 5 days of delivery.',
                  },
                  {
                    title: '3. Delivery Estimate Baseline',
                    desc: 'Confirm whether the 5–7 business days starts from the moment of order placement or from courier pickup.',
                  },
                  {
                    title: '4. Shipping Fee & Free Shipping Rule Confirmation',
                    desc: 'Confirm whether the ₹40 standard fee and ₹499 free-shipping threshold are the permanent national baseline across all states.',
                  },
                  {
                    title: '5. Regional Service Exclusions',
                    desc: 'Confirm whether specific PIN codes (e.g. island territories, specific Northeast remote zones) are excluded or subject to extended transit.',
                  },
                  {
                    title: '6. Cancellation Cut-off & Delivery Refusal Fee',
                    desc: 'Confirm whether cancellations are strictly pre-dispatch, and whether customer doorstep refusals incur courier return deductions.',
                  },
                  {
                    title: '7. Statutory Grievance Redressal Officer Appointment',
                    desc: 'Nominate the official name, email, and postal address of the Grievance Officer in compliance with Indian E-Commerce Rules.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#092218]/60 border border-[#C6A15B]/20 flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded-full border border-[#C6A15B] flex items-center justify-center shrink-0 mt-0.5 text-[#C6A15B] text-[10px] font-bold">
                      {idx + 1}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-white text-xs sm:text-sm">{item.title}</h4>
                      <p className="text-xs text-[#D5DED6] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-white/10 border border-white/10 text-xs text-[#D5DED6] flex flex-col sm:flex-row items-center justify-between gap-3">
                <span>
                  Business Inquiries &amp; Verification Submission: <a href="mailto:info@nutyaelite.com" className="font-bold text-white underline">info@nutyaelite.com</a>
                </span>
                <span className="text-[#C6A15B] font-semibold">NYUTA ELITE MAKHANA</span>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
};
'''

with open('src/pages/About.tsx', 'w', encoding='utf-8') as f:
    f.write(about_content)

print("SUCCESS: Updated src/pages/About.tsx")
