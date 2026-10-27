// scripts/apply_final_policy_updates.js
const fs = require('fs');
const path = require('path');

function updateFile(filePath, updater) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  const original = fs.readFileSync(fullPath, 'utf8');
  const isCrlf = original.includes('\r\n');
  const normalized = original.replace(/\r\n/g, '\n');
  const updated = updater(normalized);
  if (updated === normalized) {
    console.log(`[NO CHANGE] ${filePath}`);
    return false;
  }
  const finalContent = isCrlf ? updated.replace(/\n/g, '\r\n') : updated;
  fs.writeFileSync(fullPath, finalContent, 'utf8');
  console.log(`[UPDATED] ${filePath}`);
  return true;
}

// 1. UPDATE App.tsx to include /grievance route alias
updateFile('src/App.tsx', (content) => {
  if (content.includes('path="/grievance"')) return content;
  return content.replace(
    '<Route path="/fssai" element={<Navigate to="/about#fssai" replace />} />',
    '<Route path="/fssai" element={<Navigate to="/about#fssai" replace />} />\n            <Route path="/grievance" element={<Navigate to="/about#grievance" replace />} />'
  );
});

// 2. UPDATE Footer.tsx to include Grievance Redressal link in LEGAL column
updateFile('src/components/Footer.tsx', (content) => {
  if (content.includes('/about#grievance')) return content;
  return content.replace(
    `              <li>
                <Link to="/about#fssai" className="hover:text-white transition-colors">
                  FSSAI: 20426021000494
                </Link>
              </li>`,
    `              <li>
                <Link to="/about#fssai" className="hover:text-white transition-colors">
                  FSSAI: 20426021000494
                </Link>
              </li>
              <li>
                <Link to="/about#grievance" className="hover:text-white transition-colors">
                  Grievance Redressal
                </Link>
              </li>`
  );
});

// 3. UPDATE faqs.ts for exact timeline and 48-hour return window
updateFile('src/data/faqs.ts', (content) => {
  let updated = content;
  // Update FAQ 7
  const oldFaq7 = `    question: 'How long does delivery take?',
    answer:
      'Orders are generally processed and packed within 1–2 business days. Estimated delivery across India is typically 5–7 business days depending on destination and courier transit schedules. All transit times are provided as estimates, not guarantees.',`;
  
  const newFaq7 = `    question: 'How long does delivery take?',
    answer:
      'Orders are generally processed and packed within 1–2 business days at our Bihar hub. Estimated courier transit is 5–7 business days following courier dispatch, resulting in an expected overall timeline of approximately 6–9 business days to most serviceable Indian PIN codes (excluding national holidays or unexpected logistics delays). Please note that delivery timelines are courier partner estimates, not guaranteed commitments.',`;
  
  if (updated.includes(oldFaq7)) {
    updated = updated.replace(oldFaq7, newFaq7);
  }

  // Update FAQ 9
  const oldFaq9 = `    question: 'What is the return/refund policy?',
    answer:
      'Because makhana is a natural food product, opened or consumed packs cannot be returned for restock. However, if your order arrives damaged, unsealed, or defective, please contact customer care at info@nutyaelite.com or call/WhatsApp +91 81028 75852 with photos or an unboxing video. We will promptly investigate and arrange an approved replacement or refund.',`;

  const newFaq9 = `    question: 'What is the return/refund policy?',
    answer:
      'Because makhana is an edible, naturally air-popped food product sealed in airtight pouches, opened or consumed packs cannot be returned or restocked for food hygiene reasons. However, if your order arrives with transit damage, broken freshness seals, defective quality, or incorrect/missing items, please report it within 48 hours of delivery to customer care at info@nutyaelite.com or call/WhatsApp +91 81028 75852 with clear unboxing photos or video. Our team will review the claim on its merits and arrange an approved replacement or refund. This requested 48-hour reporting period helps expedite courier claims while preserving all rights available to consumers under applicable law.',`;

  if (updated.includes(oldFaq9)) {
    updated = updated.replace(oldFaq9, newFaq9);
  }

  return updated;
});

// 4. UPDATE Product.tsx for consistent timeline and 48-hour reporting
updateFile('src/pages/Product.tsx', (content) => {
  let updated = content;
  const oldShipping = `                <div>
                  <span className="font-bold text-[#1C1C1C] block text-[11px] uppercase tracking-wider">
                    Pan-India Express Dispatch
                  </span>
                  <p className="mt-0.5 text-[#1C1C1C] font-medium">
                    Orders generally process in 1–2 business days. Estimated delivery: 5–7 business days across serviceable PIN codes.
                  </p>
                </div>`;

  const newShipping = `                <div>
                  <span className="font-bold text-[#1C1C1C] block text-[11px] uppercase tracking-wider">
                    Pan-India Express Dispatch &amp; Delivery
                  </span>
                  <p className="mt-0.5 text-[#1C1C1C] font-medium">
                    Order processing: 1–2 business days. Estimated courier transit: 5–7 business days after courier dispatch (expected overall timeline: ~6–9 business days). Estimates only. Standard shipping ₹40 (FREE on orders ₹499+).
                  </p>
                </div>`;

  if (updated.includes(oldShipping)) {
    updated = updated.replace(oldShipping, newShipping);
  }

  const oldAssurance = `                  <p className="text-[10px] text-[#68756E] font-normal">
                    Damaged packaging or compromised freshness seal? Contact customer care via{' '}
                    <a href="mailto:info@nutyaelite.com" className="font-semibold underline hover:text-[#C6A15B]">
                      info@nutyaelite.com
                    </a>{' '}
                    or{' '}
                    <a href="tel:+918102875852" className="font-semibold underline hover:text-[#C6A15B]">
                      +91 81028 75852
                    </a>{' '}
                    for prompt replacement or refund under our{' '}
                    <Link to="/about#refund" className="font-bold underline text-[#123B2A]">
                      Return Policy
                    </Link>
                    .
                  </p>`;

  const newAssurance = `                  <p className="text-[10px] text-[#68756E] font-normal">
                    Damaged parcel, broken seal, or defective product? Please report within 48 hours of delivery to customer care via{' '}
                    <a href="mailto:info@nutyaelite.com" className="font-semibold underline hover:text-[#C6A15B]">
                      info@nutyaelite.com
                    </a>{' '}
                    or{' '}
                    <a href="tel:+918102875852" className="font-semibold underline hover:text-[#C6A15B]">
                      +91 81028 75852
                    </a>{' '}
                    with photos or unboxing video for prompt review and replacement/refund under our{' '}
                    <Link to="/about#refund" className="font-bold underline text-[#123B2A]">
                      Return Policy
                    </Link>
                    .
                  </p>`;

  if (updated.includes(oldAssurance)) {
    updated = updated.replace(oldAssurance, newAssurance);
  }

  return updated;
});

// 5. UPDATE Checkout.tsx for clear timeline banner in order summary
updateFile('src/pages/Checkout.tsx', (content) => {
  let updated = content;
  const oldSidebarSection = `            {/* Value Props */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-medium text-[#68756E] border-t border-[#E8DECB]">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#123B2A]" />
                <span>Express Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#123B2A]" />
                <span>Verified Freshness</span>
              </div>
            </div>`;

  const newSidebarSection = `            {/* Delivery Schedule & Trust Breakdown */}
            <div className="p-3 bg-[#FCFAF5] rounded-xl border border-[#E8DECB] text-[11px] text-[#4A5550] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#123B2A]">
                <Truck className="w-4 h-4 text-[#C6A15B] shrink-0" />
                <span>Fulfillment &amp; Delivery Timeline</span>
              </div>
              <ul className="text-[10.5px] leading-relaxed text-[#68756E] space-y-0.5">
                <li>• <strong>Order Processing:</strong> 1–2 business days</li>
                <li>• <strong>Estimated Courier Transit:</strong> 5–7 business days post-dispatch</li>
                <li>• <strong>Expected Overall Timeline:</strong> ~6–9 business days (estimates only)</li>
                <li>• <strong>Standard Shipping:</strong> ₹40 (FREE for orders ₹499+)</li>
              </ul>
              <div className="pt-1.5 border-t border-[#E8DECB]/70 text-[10px] text-[#68756E] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#123B2A] shrink-0" />
                <span>Report transit damage or broken seals within 48h of delivery</span>
              </div>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-medium text-[#68756E] border-t border-[#E8DECB]">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#123B2A]" />
                <span>Express Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#123B2A]" />
                <span>FSSAI Reg. 20426021000494</span>
              </div>
            </div>`;

  if (updated.includes(oldSidebarSection)) {
    updated = updated.replace(oldSidebarSection, newSidebarSection);
  }

  return updated;
});

// 6. UPDATE Contact.tsx for Grievance Redressal link
updateFile('src/pages/Contact.tsx', (content) => {
  let updated = content;
  const target = `              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#C6A15B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Response Time</h4>
                  <p className="text-xs text-[#D5DED6] mt-0.5">Within 24 hours on business days</p>
                </div>
              </div>`;

  const replacement = `              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#C6A15B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Response Time</h4>
                  <p className="text-xs text-[#D5DED6] mt-0.5">Within 24 hours on business days</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-1 border-t border-white/10">
                <ShieldCheck className="w-5 h-5 text-[#C6A15B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Statutory Grievance Redressal</h4>
                  <p className="text-xs text-[#D5DED6] mt-0.5">
                    For consumer dispute escalations, review our{' '}
                    <Link to="/about#grievance" className="text-[#C6A15B] font-semibold underline hover:text-white">
                      Grievance Redressal Desk
                    </Link>{' '}
                    (Proposed Officer: Raushan Kumar).
                  </p>
                </div>
              </div>`;

  if (updated.includes(target) && !updated.includes('Statutory Grievance Redressal')) {
    updated = updated.replace(target, replacement);
  }

  return updated;
});
