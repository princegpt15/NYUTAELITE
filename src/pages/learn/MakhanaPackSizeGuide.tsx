// src/pages/learn/MakhanaPackSizeGuide.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Scale,
  ArrowRight,
  Award,
  BookOpen,
  HelpCircle,
  Package,
  Users,
  Star,
} from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string | React.ReactNode;
}

const ARTICLE_FAQS: FaqItem[] = [
  {
    id: 'faq-size-1',
    question: 'Does buying a larger pack mean shorter freshness or shelf life?',
    answer:
      'No. Shelf life depends on storage conditions, not the pack size. Whether you buy 100g or 250g, both packs are sealed in the same multi-layer moisture-barrier pouches. As long as you store makhana in an airtight container in a cool, dry pantry away from direct sunlight, steam, and heat, the freshness window is the same regardless of pack size. Consume after opening within 2–3 weeks for best crunch.',
  },
  {
    id: 'faq-size-2',
    question: 'Can I mix Premium grade and Normal grade makhana in the same storage jar?',
    answer:
      'Yes, you can store them together — both grades are food-safe and do not interact with each other. However, for the best consistent snacking experience, it is preferable to consume the same grade together. Premium and Normal kernels have different expansion sizes, so mixing them means uneven roasting times when you pan-roast them with ghee or spices.',
  },
  {
    id: 'faq-size-3',
    question: 'Is there a bulk order option beyond 250g?',
    answer: (
      <>
        Yes. For quantities beyond 250g pouches — whether for large families, small businesses, or
        institutional use — please visit our{' '}
        <Link
          to="/bulk-order/qualities"
          className="text-[#123B2A] font-bold underline hover:no-underline"
        >
          Bulk Order page
        </Link>{' '}
        where you can explore wholesale grade options (4 Suta to 6 Suta) and submit a bulk enquiry.
      </>
    ),
  },
];

export const MakhanaPackSizeGuide: React.FC = () => {
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-size-1');

  return (
    <article className="bg-[#FCFAF5] min-h-screen text-[#1C1C1C]">
      {/* 1. Header & Breadcrumb */}
      <section className="bg-[#123B2A] text-white pt-8 pb-14 sm:pb-20 border-b border-[#092218]">
        <div className="max-w-[1080px] mx-auto px-5 sm:px-8">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-[#D5DED6]">
              <li>
                <Link to="/" className="hover:text-[#C6A15B] transition-colors">
                  Home
                </Link>
              </li>
              <ChevronRight className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
              <li>
                <Link to="/categories" className="hover:text-[#C6A15B] transition-colors">
                  Learn
                </Link>
              </li>
              <ChevronRight className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
              <li aria-current="page" className="text-[#C6A15B] font-medium truncate max-w-[240px] sm:max-w-none">
                Makhana Pack Size Guide
              </li>
            </ol>
          </nav>

          {/* Title & Metadata */}
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A4D38] border border-[#C6A15B]/30 text-[#C6A15B] text-[11px] font-bold tracking-widest uppercase">
              <Package className="w-3.5 h-3.5" />
              <span>Pack Size Buying Guide</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Choosing the Right Makhana Pack Size: 100g, 200g or 250g?
            </h1>
            <p className="text-sm sm:text-base text-[#D5DED6] leading-relaxed">
              Compare servings per pack, price per gram, and ideal use cases to find the perfect NYUTA ELITE MAKHANA pack size for your household.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#9BB0A3] border-t border-[#1A4D38]">
              <span>By <strong>NYUTAELITE Quality Editorial</strong></span>
              <span>•</span>
              <time dateTime="2026-10-28">Updated October 2026</time>
              <span>•</span>
              <span>5 min read</span>
              <span>•</span>
              <span className="text-[#C6A15B] font-medium">FSSAI: 20426021000494</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content Container */}
      <div className="max-w-[1080px] mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Main Article Body */}
          <main className="lg:col-span-8 space-y-12">
            {/* Intro */}
            <div className="prose prose-stone max-w-none space-y-4 text-sm sm:text-base leading-relaxed text-[#2D3748]">
              <p className="text-base sm:text-lg text-[#1C1C1C] font-medium leading-relaxed">
                Choosing between a 100g, 200g, and 250g makhana pack is not just about price — it is about matching your snacking frequency, household size, and storage capacity to the right quantity so you always enjoy fresh, crisp fox nuts.
              </p>
              <p>
                At NYUTAELITE, both our Premium jumbo-grade and Normal everyday-grade makhana are available in all three sizes. This guide breaks down servings per pack, value per gram, and the ideal buyer profile for each size — so you can choose with confidence.
              </p>
            </div>

            {/* Section 1: Servings per Pack */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  1
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  How Many Servings Per Pack?
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                A healthy single serving of makhana is approximately <strong>25–30g</strong> — roughly one small bowl or a generous open-palm handful. Based on this serving size, here is what each pack delivers:
              </p>

              {/* Servings Table */}
              <div className="overflow-x-auto rounded-xl border border-[#E8DECB] bg-white shadow-xs">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#123B2A] text-white">
                      <th className="py-3 px-4 font-bold">Pack Size</th>
                      <th className="py-3 px-4 font-bold">Approx. Servings</th>
                      <th className="py-3 px-4 font-bold">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DECB] text-[#2D3748]">
                    <tr className="hover:bg-[#FCFAF5]">
                      <td className="py-3.5 px-4 font-bold text-[#1C1C1C]">100g</td>
                      <td className="py-3.5 px-4">3–4 servings</td>
                      <td className="py-3.5 px-4">~1 week for 1 person snacking daily</td>
                    </tr>
                    <tr className="hover:bg-[#FCFAF5] bg-[#F7F4EB]/50">
                      <td className="py-3.5 px-4 font-bold text-[#123B2A]">
                        200g
                        <span className="block text-[10px] text-[#68756E] font-normal">Most Popular</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">7–8 servings</td>
                      <td className="py-3.5 px-4">~2 weeks for 1 person, or 1 week for 2 people</td>
                    </tr>
                    <tr className="hover:bg-[#FCFAF5] bg-[#EAF2ED]/60">
                      <td className="py-3.5 px-4 font-bold text-[#123B2A]">
                        250g
                        <span className="block text-[10px] text-[#C6A15B] font-bold">Best Value</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">9–10 servings</td>
                      <td className="py-3.5 px-4">Ideal pantry staple for regular snackers or small families</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#C6A15B]/40 text-xs text-[#2D3748] space-y-1.5">
                <div className="flex items-center gap-2 text-[#092218] font-bold">
                  <AlertCircle className="w-4 h-4 text-[#C6A15B] shrink-0" />
                  <span>Serving Size Note</span>
                </div>
                <p>
                  Serving sizes above are based on a 25–30g estimate for dry, unroasted makhana. Actual consumption varies by individual appetite, recipe use (e.g., makhana kheer uses more), and whether it is a standalone snack or part of a larger meal.
                </p>
              </div>
            </section>

            {/* Section 2: Price Per 100g Comparison */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  2
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Price Per 100g — Value Analysis
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Larger packs offer marginally better per-gram value. Here is an exact breakdown at our published prices:
              </p>

              {/* Price Comparison Table */}
              <div className="overflow-x-auto rounded-xl border border-[#E8DECB] bg-white shadow-xs">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#123B2A] text-white">
                      <th className="py-3 px-4 font-bold">Pack</th>
                      <th className="py-3 px-4 font-bold">Premium Price</th>
                      <th className="py-3 px-4 font-bold">Normal Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DECB] text-[#2D3748]">
                    <tr className="hover:bg-[#FCFAF5]">
                      <td className="py-3.5 px-4 font-bold text-[#1C1C1C]">100g</td>
                      <td className="py-3.5 px-4">₹160 <span className="text-[#68756E]">(₹1.60/g)</span></td>
                      <td className="py-3.5 px-4">₹120 <span className="text-[#68756E]">(₹1.20/g)</span></td>
                    </tr>
                    <tr className="hover:bg-[#FCFAF5] bg-[#F7F4EB]/50">
                      <td className="py-3.5 px-4 font-bold text-[#123B2A]">200g</td>
                      <td className="py-3.5 px-4">₹310 <span className="text-[#68756E]">(₹1.55/g)</span></td>
                      <td className="py-3.5 px-4">₹230 <span className="text-[#68756E]">(₹1.15/g)</span></td>
                    </tr>
                    <tr className="hover:bg-[#FCFAF5] bg-[#EAF2ED]/60">
                      <td className="py-3.5 px-4 font-bold text-[#123B2A]">
                        250g
                        <span className="block text-[10px] text-[#C6A15B] font-bold">Best per-gram rate</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">₹380 <span className="text-[#68756E]">(₹1.52/g)</span></td>
                      <td className="py-3.5 px-4 font-medium">₹280 <span className="text-[#68756E]">(₹1.12/g)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-[#EAF2ED] border border-[#123B2A]/20 text-xs text-[#123B2A] space-y-1">
                <p className="font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#123B2A]" />
                  <span>The 250g pack offers the best per-gram value in both Premium and Normal grades.</span>
                </p>
                <p>
                  The price difference per gram between pack sizes is small — the bigger factor is your storage capacity and how quickly you consume makhana after opening.
                </p>
              </div>
            </section>

            {/* Section 3: Who Should Buy 100g */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  3
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Who Should Buy the 100g Pack?
                </h2>
              </div>
              <div className="p-5 rounded-xl bg-white border border-[#E8DECB] space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-[#123B2A] font-bold text-sm">
                  <Star className="w-4 h-4 text-[#C6A15B]" />
                  <span>The 100g Pack Is Ideal For:</span>
                </div>
                <ul className="text-sm text-[#2D3748] space-y-2 list-disc list-inside leading-relaxed">
                  <li><strong>First-time buyers</strong> who want to try NYUTA ELITE MAKHANA before committing to a larger quantity.</li>
                  <li><strong>Occasional snackers</strong> who eat makhana 2–3 times a week rather than daily.</li>
                  <li>Anyone who wants a <strong>trial or gift-sized</strong> pack to sample the quality or share with someone.</li>
                  <li>Those with <strong>limited pantry or storage space</strong> who prefer smaller, more frequent orders.</li>
                </ul>
              </div>
            </section>

            {/* Section 4: Who Should Buy 200g */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  4
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Who Should Buy the 200g Pack?
                </h2>
              </div>
              <div className="p-5 rounded-xl bg-white border border-[#E8DECB] space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-[#123B2A] font-bold text-sm">
                  <Users className="w-4 h-4 text-[#C6A15B]" />
                  <span>The 200g Pack Is Ideal For:</span>
                </div>
                <ul className="text-sm text-[#2D3748] space-y-2 list-disc list-inside leading-relaxed">
                  <li><strong>Couples or small families</strong> who snack on makhana regularly (4–5 times a week).</li>
                  <li>People who want approximately a <strong>2-week supply</strong> without the commitment of storing a large pack.</li>
                  <li><strong>Repeat customers</strong> who are familiar with the grade and want a balance of value and freshness.</li>
                  <li>Anyone who uses makhana both as a <strong>direct snack and occasionally for cooking</strong>.</li>
                </ul>
                <div className="mt-2 p-3 rounded-lg bg-[#EAF2ED] text-xs text-[#123B2A]">
                  <strong>Most popular size</strong> among NYUTAELITE customers who order regularly.
                </div>
              </div>
            </section>

            {/* Section 5: Who Should Buy 250g */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  5
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Who Should Buy the 250g Pack?
                </h2>
              </div>
              <div className="p-5 rounded-xl bg-white border-2 border-[#123B2A] space-y-3 shadow-md">
                <div className="flex items-center gap-2 text-[#123B2A] font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-[#C6A15B]" />
                  <span>The 250g Pack Is Ideal For:</span>
                </div>
                <ul className="text-sm text-[#2D3748] space-y-2 list-disc list-inside leading-relaxed">
                  <li><strong>Daily snackers</strong> who eat makhana every day as part of their regular diet.</li>
                  <li>Families who use makhana for <strong>cooking dishes</strong> like makhana kheer, matar makhana curries, or roasted varieties.</li>
                  <li>Anyone who wants the <strong>best per-gram price savings</strong> on both Premium and Normal grades.</li>
                  <li>Households with good <strong>airtight storage capacity</strong> — a 250g pack fits well in a 700–800ml food-grade jar.</li>
                </ul>
              </div>
            </section>

            {/* Section 6: Premium vs Normal */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  6
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Premium vs Normal: Which Grade with Which Size?
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Both grades are available in all three pack sizes. The right combination depends on how you plan to use your makhana:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Premium Grade Card */}
                <div className="p-6 rounded-2xl bg-white border-2 border-[#123B2A] shadow-md flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF2ED] text-[#123B2A] text-[10px] font-bold tracking-wider uppercase">
                      <Sparkles className="w-3 h-3 text-[#C6A15B]" />
                      <span>Premium Grade (5+ Suta)</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#092218]">
                      Choose Premium for Direct Snacking
                    </h3>
                    <p className="text-xs text-[#68756E] leading-relaxed">
                      Jumbo kernels (~15–22+ mm) with a dense honeycomb expansion hold roasting spices and ghee coatings better. Delivers a more satisfying crunch for direct bowl snacking.
                    </p>
                    <div className="text-xs text-[#2D3748] space-y-1 font-medium pt-1">
                      <p>• 100g Pouch: <strong>₹160</strong> (SKU: NYM-PREM-100)</p>
                      <p>• 200g Pouch: <strong>₹310</strong> (SKU: NYM-PREM-200)</p>
                      <p>• 250g Pouch: <strong>₹380</strong> (SKU: NYM-PREM-250)</p>
                    </div>
                  </div>
                  <Link
                    to="/products/makhana?sku=premium-100g"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#123B2A] text-white text-xs font-bold hover:bg-[#092218] transition-colors"
                  >
                    <span>Shop Premium Makhana</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Normal Grade Card */}
                <div className="p-6 rounded-2xl bg-white border border-[#E8DECB] shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F7F4EB] text-[#68756E] text-[10px] font-bold tracking-wider uppercase">
                      <Scale className="w-3 h-3 text-[#68756E]" />
                      <span>Normal Grade (4+ Suta)</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#092218]">
                      Choose Normal for Cooking
                    </h3>
                    <p className="text-xs text-[#68756E] leading-relaxed">
                      Everyday-grade kernels (~12–14 mm) are ideal for makhana kheer, curries, and grinding into flour. Size uniformity matters less in cooked dishes, making Normal grade an excellent value choice.
                    </p>
                    <div className="text-xs text-[#2D3748] space-y-1 font-medium pt-1">
                      <p>• 100g Pouch: <strong>₹120</strong> (SKU: NYM-NORM-100)</p>
                      <p>• 200g Pouch: <strong>₹230</strong> (SKU: NYM-NORM-200)</p>
                      <p>• 250g Pouch: <strong>₹280</strong> (SKU: NYM-NORM-250)</p>
                    </div>
                  </div>
                  <Link
                    to="/products/makhana?sku=normal-100g"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#F7F4EB] text-[#123B2A] border border-[#E8DECB] text-xs font-bold hover:bg-[#E8DECB] transition-colors"
                  >
                    <span>Shop Normal Makhana</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#C6A15B]/40 text-xs text-[#2D3748] space-y-1.5">
                <div className="flex items-center gap-2 text-[#092218] font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#C6A15B] shrink-0" />
                  <span>Same Harvest, Different Sizing</span>
                </div>
                <p>
                  Both Premium and Normal grades come from the same pure Bihar wetland harvest and deliver identical nutrition. The distinction is strictly physical size, kernel expansion, and visual uniformity — not nutritional content. FSSAI Reg. 20426021000494.
                </p>
              </div>
            </section>

            {/* Section 7: FAQ Accordion */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-[#C6A15B]" />
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="space-y-3">
                {ARTICLE_FAQS.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="bg-white rounded-xl border border-[#E8DECB] overflow-hidden shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#1C1C1C] hover:text-[#123B2A] cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#C6A15B] shrink-0 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-[#68756E] leading-relaxed border-t border-[#E8DECB]/50">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Section 8: Conclusion CTA */}
            <section className="p-6 sm:p-8 rounded-2xl bg-[#123B2A] text-white space-y-4">
              <h2 className="font-serif text-2xl font-bold text-white">
                Ready to Choose Your Pack?
              </h2>
              <p className="text-xs sm:text-sm text-[#D5DED6] leading-relaxed">
                Whether you are a first-time buyer testing our 100g trial size, a regular household reaching for the 200g, or a daily snacker stocking up with 250g — NYUTA ELITE MAKHANA is handpicked from Bihar's freshwater wetlands and packed in airtight moisture-barrier pouches.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  to="/products/makhana"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C6A15B] text-[#092218] text-xs font-bold uppercase tracking-wider hover:bg-[#b5924d] transition-colors"
                >
                  <span>Explore All Packs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/bulk-order/qualities"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1A4D38] border border-[#C6A15B]/30 text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218] transition-colors"
                >
                  <span>Bulk / Wholesale Orders</span>
                </Link>
              </div>
              {/* Cross-article links */}
              <div className="mt-4 pt-4 border-t border-[#C6A15B]/30 space-y-2">
                <p className="text-xs text-[#D5DED6] mb-2">More guides from our Learn series:</p>
                <Link
                  to="/learn/how-to-choose-good-quality-makhana"
                  className="flex items-center gap-2 text-xs font-bold text-[#C6A15B] hover:underline"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>How to Choose Good-Quality Makhana: Complete Buyer's Guide →</span>
                </Link>
                <Link
                  to="/learn/makhana-benefits-health"
                  className="flex items-center gap-2 text-xs font-bold text-[#C6A15B] hover:underline"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>Makhana Benefits: 7 Reasons to Eat Fox Nuts Every Day →</span>
                </Link>
                <Link
                  to="/learn/how-to-store-makhana"
                  className="flex items-center gap-2 text-xs font-bold text-[#C6A15B] hover:underline"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>How to Store Makhana: Keep Fox Nuts Fresh Longer →</span>
                </Link>
              </div>
            </section>
          </main>

          {/* Sticky Sidebar on Desktop */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Quick Sizing Box */}
            <div className="p-6 rounded-2xl bg-white border border-[#E8DECB] shadow-xs space-y-4 sticky top-24">
              <h3 className="font-serif text-lg font-bold text-[#092218]">
                Shop by Pack Size
              </h3>
              <p className="text-xs text-[#68756E] leading-relaxed">
                All sizes available in both Premium and Normal grade:
              </p>

              <div className="space-y-3 pt-1">
                <div className="p-3.5 rounded-xl bg-[#FCFAF5] border border-[#E8DECB] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#123B2A]">Premium Jumbo</span>
                    <span className="text-xs font-bold text-[#C6A15B]">From ₹160</span>
                  </div>
                  <p className="text-[11px] text-[#68756E]">5+ Suta (~15–22+ mm). Best for direct snacking.</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[['100g','premium-100g'],['200g','premium-200g'],['250g','premium-250g']].map(([label, sku]) => (
                      <Link key={sku} to={`/products/makhana?sku=${sku}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#123B2A] bg-[#F7F1E5] px-2 py-1 rounded-lg border border-[#E8DECB] hover:border-[#123B2A]">
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FCFAF5] border border-[#E8DECB] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#123B2A]">Normal Everyday</span>
                    <span className="text-xs font-bold text-[#C6A15B]">From ₹120</span>
                  </div>
                  <p className="text-[11px] text-[#68756E]">4+ Suta (~12–14 mm). Best for cooking & daily use.</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[['100g','normal-100g'],['200g','normal-200g'],['250g','normal-250g']].map(([label, sku]) => (
                      <Link key={sku} to={`/products/makhana?sku=${sku}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#123B2A] bg-[#F7F1E5] px-2 py-1 rounded-lg border border-[#E8DECB] hover:border-[#123B2A]">
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Related Articles */}
              <div className="pt-4 border-t border-[#E8DECB] space-y-3">
                <p className="text-xs font-bold text-[#092218]">Related Learn Articles</p>
                <Link
                  to="/learn/how-to-choose-good-quality-makhana"
                  className="flex items-start gap-2 text-[11px] text-[#123B2A] hover:text-[#092218] font-medium leading-tight"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#C6A15B]" />
                  <span>How to Choose Good-Quality Makhana</span>
                </Link>
                <Link
                  to="/learn/makhana-benefits-health"
                  className="flex items-start gap-2 text-[11px] text-[#123B2A] hover:text-[#092218] font-medium leading-tight"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#C6A15B]" />
                  <span>Makhana Benefits: 7 Reasons to Eat Fox Nuts Daily</span>
                </Link>
                <Link
                  to="/learn/how-to-store-makhana"
                  className="flex items-start gap-2 text-[11px] text-[#123B2A] hover:text-[#092218] font-medium leading-tight"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#C6A15B]" />
                  <span>How to Store Makhana to Keep It Fresh</span>
                </Link>
              </div>

              {/* FSSAI Trust Badge */}
              <div className="pt-4 border-t border-[#E8DECB] space-y-2 text-center">
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#123B2A]">
                  <ShieldCheck className="w-4 h-4 text-[#C6A15B]" />
                  <span>FSSAI Reg. 20426021000494</span>
                </div>
                <p className="text-[10px] text-[#68756E]">
                  Directly sourced from certified Mithila wetland farmer clusters in Bihar.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
};
