# scripts/update_about_with_fssai.py
import re

with open('src/pages/About.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's inspect imports
imports = '''// src/pages/About.tsx
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
} from 'lucide-react';'''

# Replace header imports if needed
content = re.sub(r'// src/pages/About\.tsx.*?from \'lucide-react\';', imports, content, flags=re.DOTALL)

# Let's define the new verified FSSAI article content
fssai_article = '''            {/* POLICY 5: Food Safety, FSSAI Registration & Product Information */}
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
                    <p><strong>Harvest &amp; Sourcing Hub:</strong> Mithila Wetland Ponds, Darbhanga, Bihar, India</p>
                    <p><strong>Customer Care Email:</strong> <a href="mailto:info@nutyaelite.com" className="font-semibold underline">info@nutyaelite.com</a></p>
                    <p><strong>Helpline:</strong> <a href="tel:+918102875852" className="font-semibold underline">+91 81028 75852</a></p>
                  </div>
                </div>
              </div>
            </article>'''

# Let's define the new checklist article content
checklist_article = '''            {/* SECTION 6: Owner Policy Confirmation Checklist */}
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
                    Direct inquiries: <a href="mailto:info@nutyaelite.com" className="font-bold text-white underline">info@nutyaelite.com</a>
                  </span>
                  <span className="text-[#C6A15B] font-semibold">NYUTA ELITE MAKHANA</span>
                </div>
              </div>
            </article>'''

# Replace Policy 5 and Checklist in content
pattern_p5 = r'\{\/\* POLICY 5: FSSAI and Food Product Quality Transparency \*\/.*?(?=\{\/\* SECTION 6: Owner Policy Confirmation Checklist \*\/)'
pattern_chk = r'\{\/\* SECTION 6: Owner Policy Confirmation Checklist \*\/.*?</section>'

content = re.sub(pattern_p5, fssai_article + '\n\n            ', content, flags=re.DOTALL)
content = re.sub(pattern_chk, checklist_article + '\n          </div>\n        </div>\n      </section>', content, flags=re.DOTALL)

with open('src/pages/About.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Updated src/pages/About.tsx with verified FSSAI certificate details!")
