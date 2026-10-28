// src/pages/learn/HowToChooseMakhana.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Scale,
  Check,
  ArrowRight,
  Flame,
  Award,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const ARTICLE_FAQS: FaqItem[] = [
  {
    id: 'faq-guide-1',
    question: 'What does "5 Suta" or "6 Suta" makhana mean?',
    answer:
      '"Suta" (or Sutta) is a traditional grading unit used in Bihar wholesale mandis corresponding to round sieve screen diameters. Grade 4 Suta equates to roughly 12–14 mm, while 5 to 6+ Suta refers to jumbo kernels measuring approximately 15–22+ mm. These measurements represent trade sizing conventions and sieve classifications rather than legally mandated statutory standards.',
  },
  {
    id: 'faq-guide-2',
    question: 'Can I test for chemically bleached makhana at home?',
    answer:
      'No home sensory test can reliably verify chemical bleaching or pesticide residue. While bleached seeds often display an unnaturally chalk-white appearance, natural variations in sun-drying, seed batch, and pond conditions also produce lighter or darker shades. The only reliable approach is buying from trusted brands with verified FSSAI licensing and transparent, unbleached sourcing.',
  },
  {
    id: 'faq-guide-3',
    question: 'Why did my makhana become chewy after opening, and can I fix it?',
    answer:
      'Makhana has a porous, honeycomb starch cellular matrix that naturally absorbs ambient atmospheric humidity. If your pack lost its crispness, spread the kernels in a dry pan over low heat for 2 to 3 minutes; the heat evaporates the absorbed moisture and restores their snappy crunch. Never consume makhana that smells sour or shows signs of mold.',
  },
  {
    id: 'faq-guide-4',
    question: 'Are there differences in nutritional value between Premium and Normal makhana?',
    answer:
      'No. Both Premium and Normal grades come from the exact same Euryale ferox harvest from Mithila, Bihar. They deliver identical macro-nutrients: plant protein, dietary fiber, magnesium, potassium, and calcium. The distinction is strictly physical size, kernel expansion, and visual uniformity.',
  },
  {
    id: 'faq-guide-5',
    question: 'How should I store makhana once the pouch is opened?',
    answer:
      'Store makhana in an airtight food-grade container or keep it inside a resealable barrier pouch with the zipper tightly sealed. Keep the container in a cool, dry pantry away from direct sunlight, stove heat, and cooking steam.',
  },
  {
    id: 'faq-guide-6',
    question: 'Why do some makhana packets contain hard black pieces?',
    answer:
      'Makhana seeds grow with a rock-hard black outer husk. During traditional wooden mallet popping, small shell fragments can remain lodged in the kernel folds. High-grade makhana undergoes secondary mechanical blowing and manual table grading to eliminate over 98% of shell fragments before packaging.',
  },
];

export const HowToChooseMakhana: React.FC = () => {
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-guide-1');

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
                How to Choose Good-Quality Makhana
              </li>
            </ol>
          </nav>

          {/* Title & Metadata */}
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A4D38] border border-[#C6A15B]/30 text-[#C6A15B] text-[11px] font-bold tracking-widest uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Buyer’s Guide &amp; Quality Standard</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              How to Choose Good-Quality Makhana: Complete Buyer’s Guide
            </h1>
            <p className="text-sm sm:text-base text-[#D5DED6] leading-relaxed">
              Understand traditional Bihar Suta grading, identify natural unbleached fox nuts, evaluate crunch and moisture, and choose the right grade for your home.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#9BB0A3] border-t border-[#1A4D38]">
              <span>By <strong>NYUTAELITE Quality Editorial</strong></span>
              <span>•</span>
              <time dateTime="2026-10-25">Updated October 2026</time>
              <span>•</span>
              <span>6 min read</span>
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
                Makhana (popped <em>Euryale ferox</em> seeds, or fox nuts) has transformed from a revered regional fasting food in eastern India into one of the country&apos;s most celebrated natural superfoods. Rich in plant protein, dietary fiber, magnesium, and potassium while being naturally gluten-free and low in sodium, it has become the gold standard for mindful snacking.
              </p>
              <p>
                However, with commercial popularity surging across online marketplaces and supermarkets, quality varies dramatically. Shoppers encounter packets stamped with generic phrases like &quot;Super Jumbo,&quot; &quot;Organic,&quot; or &quot;Export Grade&quot;—often with zero objective explanation of why one batch is crisp, fluffy, and sweet while another is rubbery, bitter, or filled with rock-hard black husks.
              </p>
              <p>
                This guide provides an evidence-based breakdown of traditional Bihar grading standards, visual indicators, texture tests, and storage methods so you can evaluate makhana like an experienced cultivator.
              </p>
            </div>

            {/* Section 1: Suta Grading */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  1
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Understanding the Traditional &quot;Suta&quot; Grading System
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Over 85% of India&apos;s makhana crop originates in the freshwater wetlands (<em>chaurs</em>) of the Mithila region in Bihar—chiefly Darbhanga, Madhubani, Purnia, and Katihar. Following harvest and high-heat earthen roasting, the seeds are cracked open by hand with wooden mallets (<em>thapi</em>) to release the expanded white kernel.
              </p>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Once popped, kernels are screened through round-mesh wire sieves. In Bihar&apos;s wholesale mandis, sizing is measured using the vernacular <strong>Suta (or Sutta) scale</strong>:
              </p>

              {/* Suta Comparison Table */}
              <div className="overflow-x-auto rounded-xl border border-[#E8DECB] bg-white shadow-xs">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#123B2A] text-white">
                      <th className="py-3 px-4 font-bold">Grade</th>
                      <th className="py-3 px-4 font-bold">Sieve Benchmark</th>
                      <th className="py-3 px-4 font-bold">Physical Appearance</th>
                      <th className="py-3 px-4 font-bold">Best Culinary Use</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DECB] text-[#2D3748]">
                    <tr className="hover:bg-[#FCFAF5]">
                      <td className="py-3.5 px-4 font-bold text-[#1C1C1C]">3 Suta</td>
                      <td className="py-3.5 px-4">&lt; 12 mm</td>
                      <td className="py-3.5 px-4">Small, irregular, fragmented</td>
                      <td className="py-3.5 px-4">Flour, thickeners, sweet confectionery</td>
                    </tr>
                    <tr className="hover:bg-[#FCFAF5] bg-[#F7F4EB]/50">
                      <td className="py-3.5 px-4 font-bold text-[#123B2A]">
                        4 to 4+ Suta
                        <span className="block text-[10px] text-[#68756E] font-normal">Everyday Grade</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">~12 – 14 mm</td>
                      <td className="py-3.5 px-4">Medium-sized, spherical, uniform crunch</td>
                      <td className="py-3.5 px-4">Daily roasting, curries (Matar Makhana), kheer</td>
                    </tr>
                    <tr className="hover:bg-[#FCFAF5] bg-[#EAF2ED]/60">
                      <td className="py-3.5 px-4 font-bold text-[#123B2A]">
                        5 to 6+ Suta
                        <span className="block text-[10px] text-[#C6A15B] font-bold">Jumbo Grade</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">~15 – 22+ mm</td>
                      <td className="py-3.5 px-4">Jumbo, spherical, dense honeycomb pop</td>
                      <td className="py-3.5 px-4">Gourmet ghee roasting, snack bowls, gifting</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Factual Disclaimer Alert */}
              <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#C6A15B]/40 text-xs text-[#2D3748] space-y-1.5">
                <div className="flex items-center gap-2 text-[#092218] font-bold">
                  <AlertCircle className="w-4 h-4 text-[#C6A15B] shrink-0" />
                  <span>Trade Benchmark Qualification</span>
                </div>
                <p>
                  While the Suta grading scale is universally recognized in wholesale Bihar trade, physical millimeter measurements (~12–14 mm for 4 Suta and ~15–22+ mm for 5+ Suta) represent supplier trade conventions and mechanical sieve screen classifications rather than a statutory national legal standard. Screen mesh dimensions can vary slightly between sorting facilities.
                </p>
              </div>
            </section>

            {/* Section 2: Color and Bleaching */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  2
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Natural Color vs. Chemical Bleaching: What the Science Tells Us
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                A frequent worry among health-conscious shoppers is whether commercial fox nuts have been fumigated with sulfur dioxide (SO<sub>2</sub>) or treated with chemical bleaches to produce a picture-perfect white coat.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-5 rounded-xl bg-white border border-[#E8DECB] space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-[#123B2A] font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-[#123B2A]" />
                    <span>Pure, Unbleached Fox Nuts</span>
                  </div>
                  <ul className="text-xs text-[#2D3748] space-y-2 list-disc list-inside leading-relaxed">
                    <li><strong>Warm Ivory Shade:</strong> Natural cream, soft off-white, or pale ivory tone.</li>
                    <li><strong>Seed Coat Specks:</strong> Natural reddish-brown micro-freckles where the seed met the inner shell.</li>
                    <li><strong>Clean Aroma:</strong> Mild, neutral, slightly nutty, earthy scent upon unsealing.</li>
                    <li><strong>Sweet Natural Flavor:</strong> Subtle natural sweetness with no metallic astringency.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-xl bg-white border border-amber-200 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>The Limits of Sensory Checks</span>
                  </div>
                  <ul className="text-xs text-[#2D3748] space-y-2 list-disc list-inside leading-relaxed">
                    <li><strong>Color Alone Is Not Proof:</strong> Visual color and aroma alone cannot definitively confirm or disprove chemical treatment.</li>
                    <li><strong>Natural Hue Variations:</strong> Harvest water minerals, sun-drying duration, and roasting temperatures naturally produce lighter or darker batches.</li>
                    <li><strong>Avoid Chemical Guesses:</strong> Never rely on smell or taste tests to diagnose chemical residues at home.</li>
                    <li><strong>Buy Traceable:</strong> Purchase exclusively from verified, FSSAI-registered suppliers with documented handling standards.</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#EAF2ED] border border-[#123B2A]/20 text-xs text-[#123B2A] space-y-1">
                <p className="font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#123B2A]" />
                  <span>The NYUTAELITE Sourcing Standard</span>
                </p>
                <p>
                  NYUTAELITE makhana is 100% unbleached and sun-dried naturally in Mithila, Bihar under strict FSSAI compliance (Registration: 20426021000494). We never subject our harvest to sulfur fumigation or synthetic brightening agents.
                </p>
              </div>
            </section>

            {/* Section 3: In-Hand Crispness Check */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  3
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  The In-Hand Crispness Check (Physical Texture vs. Moisture)
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Popped makhana features an expanded, porous honeycomb cellular structure. Because of this high porosity, fox nuts are naturally <strong>hygroscopic</strong>—they rapidly draw moisture from ambient humid air if left exposed.
              </p>

              <div className="p-5 rounded-xl bg-white border border-[#E8DECB] space-y-3 shadow-xs">
                <h3 className="font-bold text-sm text-[#1C1C1C]">How to Test Crispness at Home:</h3>
                <ol className="text-xs sm:text-sm text-[#2D3748] space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Take an unroasted nut between your thumb and forefinger.</li>
                  <li>Press inward firmly until the kernel fractures:
                    <ul className="pl-6 mt-1 space-y-1 list-disc list-inside text-xs text-[#68756E]">
                      <li><strong className="text-[#123B2A]">Crisp, Fresh Makhana:</strong> Fractures crisply with an audible snap into brittle, dry shards.</li>
                      <li><strong className="text-amber-800">Moist or Softened Makhana:</strong> Compresses inward like a sponge or bends rubbery without snapping.</li>
                    </ul>
                  </li>
                </ol>
              </div>

              {/* Moisture Notice */}
              <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#C6A15B]/40 text-xs text-[#2D3748] space-y-2">
                <p className="font-bold text-[#092218] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#C6A15B]" />
                  <span>Practical Tip: Restoring Crunch vs. Food Safety</span>
                </p>
                <p>
                  A softened or chewy texture is simply a physical sign of ambient humidity absorption, not a food safety failure. If the kernels smell fresh and neutral, dry roasting them in a skillet on low heat for 2 to 3 minutes will evaporate moisture and restore their snappy crunch.
                </p>
                <p className="text-[#8C2A1E] font-medium">
                  <strong>Food Safety Warning:</strong> Never taste or consume makhana that smells sour, damp, or rancid, or displays dark greenish/gray mold spots.
                </p>
              </div>
            </section>

            {/* Section 4: Shell Residue */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  4
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Shell Residue &amp; De-Husking Purity
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Raw <em>Euryale ferox</em> seeds are encased in a rock-hard black shell. When struck by wooden mallets during popping, small pieces of this woody husk can lodge into the folds of the expanded nut.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#E8DECB] text-xs space-y-1.5">
                  <span className="font-bold text-[#8C2A1E]">Low-Grade / Uncleaned Makhana</span>
                  <p className="text-[#68756E] leading-relaxed">
                    Frequently contains sharp black shell fragments in the crevices. Biting into one can crack a tooth or ruin your snack experience.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#123B2A]/30 text-xs space-y-1.5">
                  <span className="font-bold text-[#123B2A]">Handpicked Double-Sorted Makhana</span>
                  <p className="text-[#68756E] leading-relaxed">
                    Undergoes mechanical aspiration blowing followed by manual table-grading to remove over 98% of hard shell fragments before sealing.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5: Packaging */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  5
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Packaging Integrity &amp; Pantry Storage
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Even the highest grade 6-Suta jumbo makhana will lose its crunch if packaged in flimsy polythene pouches or stored incorrectly.
              </p>
              <div className="p-5 rounded-xl bg-white border border-[#E8DECB] space-y-3 text-xs sm:text-sm text-[#2D3748]">
                <h3 className="font-bold text-sm text-[#1C1C1C]">Key Storage Rules:</h3>
                <ul className="space-y-2 list-disc list-inside text-xs leading-relaxed text-[#68756E]">
                  <li><strong>Airtight Barrier Pouch:</strong> Multi-layer foil-laminated barrier pouches block ambient humidity and prevent oxidation.</li>
                  <li><strong>Resealable Zipper:</strong> Squeeze excess air from the pouch and press the zipper firmly closed after every serving.</li>
                  <li><strong>Cool Pantry Environment:</strong> Store away from stove steam, sink humidity, and direct sunlight to preserve natural seed oils.</li>
                </ul>
              </div>
            </section>

            {/* Section 6: Grade Selection */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  6
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Premium vs. Normal Makhana: Which Grade Fits Your Kitchen?
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                At NYUTAELITE, we keep our catalog transparent. Both grades come from the same pure Bihar wetland harvest and deliver identical nutrition:
              </p>

              {/* Product Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Premium Card */}
                <div className="p-6 rounded-2xl bg-white border-2 border-[#123B2A] shadow-md flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF2ED] text-[#123B2A] text-[10px] font-bold tracking-wider uppercase">
                      <Sparkles className="w-3 h-3 text-[#C6A15B]" />
                      <span>Jumbo Sizing</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#092218]">
                      Premium Makhana (5+ Suta)
                    </h3>
                    <p className="text-xs text-[#68756E] leading-relaxed">
                      Handpicked jumbo-grade fox nuts (~15–22+ mm). Spherical, expanded honeycomb core, ideal for roasted snack bowls and festive gifting.
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

                {/* Normal Card */}
                <div className="p-6 rounded-2xl bg-white border border-[#E8DECB] shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F7F4EB] text-[#68756E] text-[10px] font-bold tracking-wider uppercase">
                      <Scale className="w-3 h-3 text-[#68756E]" />
                      <span>Everyday Value</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#092218]">
                      Normal Makhana (4+ Suta)
                    </h3>
                    <p className="text-xs text-[#68756E] leading-relaxed">
                      Everyday versatile fox nuts (~12–14 mm). Perfect for home curries, makhana kheer, grinding into flours, and daily family snacking.
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
            </section>

            {/* Section 7: Buyer's Checklist */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  7
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Buyer’s Quality Checklist
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Before purchasing makhana online or in a local store, use this fast checklist:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: 'Transparent Sizing', desc: 'Suta grade or diameter (~12–14mm vs ~15–22+mm) clearly declared.' },
                  { title: 'Natural Ivory Color', desc: 'Unbleached cream hue with natural seed specks rather than chalk-white.' },
                  { title: 'Audible Crisp Snap', desc: 'Brittle fracture under finger pressure with dry, porous core.' },
                  { title: 'Minimal Husk Residue', desc: 'Double-cleaned to remove teeth-chipping hard black shells.' },
                  { title: 'Moisture-Barrier Pouch', desc: 'Multi-layer pouch with a reliable airtight zip-lock seal.' },
                  { title: 'FSSAI Registered', desc: 'Verifiable food hygiene registration printed clearly on the pack.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#E8DECB]">
                    <div className="p-1 rounded-full bg-[#EAF2ED] text-[#123B2A] shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1C1C1C]">{item.title}</p>
                      <p className="text-[11px] text-[#68756E] leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 8: FAQ Accordion */}
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

            {/* Section 9: Conclusion */}
            <section className="p-6 sm:p-8 rounded-2xl bg-[#123B2A] text-white space-y-4">
              <h2 className="font-serif text-2xl font-bold text-white">
                Experience Handpicked Mithila Makhana
              </h2>
              <p className="text-xs sm:text-sm text-[#D5DED6] leading-relaxed">
                Choosing high-quality makhana comes down to understanding harvest origin, sizing standards, natural coloration, and moisture protection. At NYUTAELITE, we bring unbleached, hand-sorted fox nuts directly from Bihar’s freshwater lotus ponds to your pantry.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  to="/products/makhana"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C6A15B] text-[#092218] text-xs font-bold uppercase tracking-wider hover:bg-[#b5924d] transition-colors"
                >
                  <span>Explore Makhana Packs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1A4D38] border border-[#C6A15B]/30 text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218] transition-colors"
                >
                  <span>Our Sourcing Story</span>
                </Link>
              </div>
              {/* Cross-article link */}
              <div className="mt-4 pt-4 border-t border-[#C6A15B]/30">
                <p className="text-xs text-[#D5DED6] mb-2">Related guide:</p>
                <Link
                  to="/learn/makhana-benefits-health"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#C6A15B] hover:underline"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Makhana Benefits: 7 Reasons to Eat Fox Nuts Every Day →</span>
                </Link>
              </div>
            </section>
          </main>

          {/* Sticky Sidebar on Desktop */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Quick Sizing Box */}
            <div className="p-6 rounded-2xl bg-white border border-[#E8DECB] shadow-xs space-y-4 sticky top-24">
              <h3 className="font-serif text-lg font-bold text-[#092218]">
                Catalog Quick Finder
              </h3>
              <p className="text-xs text-[#68756E] leading-relaxed">
                Choose between our two distinct unbleached Bihar grades:
              </p>

              <div className="space-y-3 pt-1">
                <div className="p-3.5 rounded-xl bg-[#FCFAF5] border border-[#E8DECB] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#123B2A]">Premium Jumbo</span>
                    <span className="text-xs font-bold text-[#C6A15B]">From ₹160</span>
                  </div>
                  <p className="text-[11px] text-[#68756E]">5+ Suta (~15–22+ mm). Ideal for ghee roasting.</p>
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
                  <p className="text-[11px] text-[#68756E]">4+ Suta (~12–14 mm). Ideal for daily cooking.</p>
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
