// scripts/patch_about_final_policies.cjs
const fs = require('fs');
const path = require('path');

const aboutPath = path.resolve(__dirname, '../src/pages/About.tsx');
let content = fs.readFileSync(aboutPath, 'utf8');
const isCrlf = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Ensure UserCheck is imported from lucide-react
if (!content.includes('UserCheck,')) {
  content = content.replace(
    '  ShieldCheck,\n} from \'lucide-react\';',
    '  ShieldCheck,\n  UserCheck,\n} from \'lucide-react\';'
  );
}

// 2. Add Grievance link in the sticky subnav
const oldNav = `              <a
                href="#fssai"
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#123B2A] hover:text-white border border-[#E8DECB] text-[#123B2A] whitespace-nowrap transition-colors flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>FSSAI &amp; Quality Info</span>
              </a>
              <a
                href="#checklist"`;

const newNav = `              <a
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
                href="#checklist"`;

if (content.includes(oldNav)) {
  content = content.replace(oldNav, newNav);
}

// 3. Update Section 1: Shipping and Delivery Policy
const oldShippingHighlights = `              {/* Confirmed Delivery Highlights Grid */}
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
              </div>`;

const newShippingHighlights = `              {/* Confirmed Delivery Highlights Grid */}
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
              </div>`;

if (content.includes(oldShippingHighlights)) {
  content = content.replace(oldShippingHighlights, newShippingHighlights);
}

// Update Shipping Subsections
const oldShippingSubsections = `              {/* Subsections */}
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
              </div>`;

const newShippingSubsections = `              {/* Subsections */}
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
              </div>`;

if (content.includes(oldShippingSubsections)) {
  content = content.replace(oldShippingSubsections, newShippingSubsections);
}

// Update Shipping Owner Confirmation Banner
const oldShippingBanner = `              {/* Unresolved Owner Decision Banner */}
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
              </div>`;

const newShippingBanner = `              {/* Unresolved Owner Decision Banner */}
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
              </div>`;

if (content.includes(oldShippingBanner)) {
  content = content.replace(oldShippingBanner, newShippingBanner);
}

// 4. Update Section 2: Returns & Refunds Policy
const oldRefundSection = `            {/* POLICY 2: Return, Replacement, Cancellation & Refund Policy */}
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
            </article>`;

const newRefundSection = `            {/* POLICY 2: Return, Replacement, Cancellation & Refund Policy */}
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
            </article>`;

if (content.includes(oldRefundSection)) {
  content = content.replace(oldRefundSection, newRefundSection);
}

// 5. Add Section 6: Grievance Redressal Mechanism right before #checklist
const grievanceArticle = `            {/* POLICY 6: Grievance Redressal Mechanism & Proposed Officer */}
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
                        <a href="mailto:info@nutyaelite.com" className="font-semibold text-[#123B2A] underline hover:text-[#C6A15B]">
                          info@nutyaelite.com
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
                    The details above represent the business owner's intended nomination for the statutory Grievance Redressal Officer under Rule 5(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and Rule 4 of the Consumer Protection (E-Commerce) Rules, 2020. Final statutory publication remains subject to formal owner confirmation of the corporate appointment resolution and whether a dedicated channel (e.g. <code>grievance@nutyaelite.com</code>) will be deployed.
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
                    <strong>Step 1 — Frontline Customer Care:</strong> Please reach out to customer support at <a href="mailto:info@nutyaelite.com" className="font-semibold text-[#123B2A] underline">info@nutyaelite.com</a> or <a href="tel:+918102875852" className="font-semibold text-[#123B2A] underline">+91 81028 75852</a> with your order number. Most queries are resolved within 24–48 hours.
                  </li>
                  <li>
                    <strong>Step 2 — Grievance Escalation:</strong> If your issue is not resolved satisfactorily through regular support channels within 3 business days, escalate to the proposed Grievance Officer at <a href="mailto:info@nutyaelite.com" className="font-semibold text-[#123B2A] underline">info@nutyaelite.com</a> with the subject header <em>"Attention: Grievance Officer - Escalation [Order Number]"</em>.
                  </li>
                  <li>
                    <strong>Step 3 — Statutory Acknowledgment &amp; Resolution:</strong> In compliance with Indian e-commerce regulations, all escalated grievances receive formal acknowledgment within 48 hours and a comprehensive investigation and resolution within 30 days.
                  </li>
                </ol>
              </div>
            </article>\n\n`;

if (!content.includes('id="grievance"')) {
  content = content.replace(
    '            {/* SECTION 6: Owner Policy Confirmation Checklist */}',
    grievanceArticle + '            {/* SECTION 7: Owner Policy Confirmation Checklist */}'
  );
}

// 6. Update Section 7: Owner Policy Confirmation Checklist
const oldChecklistSection = `            {/* SECTION 6: Owner Policy Confirmation Checklist */}
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
                  1 Verified · 6 Pending Review
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#D5DED6] leading-relaxed">
                FSSAI registration details have been verified and integrated into the store policy hub. The remaining six operational parameters are awaiting final business owner decision to conclude complete policy formalization:
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
                    title: '2. Return / Damage Reporting Window',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Formally choose whether customer transit-damage claims must be filed within 48 hours, 72 hours, or 5 days of delivery.',
                  },
                  {
                    num: '3',
                    title: '3. Delivery Estimate Baseline',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Confirm whether the 5–7 business days starts from the moment of order placement or from courier pickup.',
                  },
                  {
                    num: '4',
                    title: '4. Shipping Fee & Free Shipping Rule Confirmation',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Confirm whether the ₹40 standard fee and ₹499 free-shipping threshold are the permanent national baseline across all states.',
                  },
                  {
                    num: '5',
                    title: '5. Regional Service Exclusions',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Confirm whether specific PIN codes (e.g. island territories, specific Northeast remote zones) are excluded or subject to extended transit.',
                  },
                  {
                    num: '6',
                    title: '6. Cancellation Cut-off & Delivery Refusal Fee',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Confirm whether cancellations are strictly pre-dispatch, and whether customer doorstep refusals incur courier return deductions.',
                  },
                  {
                    num: '7',
                    title: '7. Statutory Grievance Redressal Officer Appointment',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Nominate the official name, email, and postal address of the Grievance Officer in compliance with Indian E-Commerce Rules.',
                  },
                ]`;

const newChecklistSection = `            {/* SECTION 7: Owner Policy Confirmation Checklist */}
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
                FSSAI registration details have been verified and integrated into the store policy hub. The remaining operational and compliance items reflect confirmed owner intent with formal ratification pending:
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

                {/* 2 to 8 - PENDING OWNER CONFIRMATION / RATIFICATION */}
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
                    desc: 'Proposed by owner: Raushan Kumar, info@nutyaelite.com, Bhojpur registered office. Formal appointment resolution and permanent mailbox confirmation pending.',
                  },
                  {
                    num: '8',
                    title: '8. Legal Entity Constitution & Tax Registration Status',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Confirmation of formal commercial entity structure (Sole Proprietorship, Partnership, or Pvt Ltd) and GST registration status if applicable.',
                  },
                ]`;

if (content.includes(oldChecklistSection)) {
  content = content.replace(oldChecklistSection, newChecklistSection);
}

const finalContent = isCrlf ? content.replace(/\n/g, '\r\n') : content;
fs.writeFileSync(aboutPath, finalContent, 'utf8');
console.log('Successfully updated src/pages/About.tsx');
