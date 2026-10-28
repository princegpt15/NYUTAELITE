// src/pages/learn/MakhanaHealthBenefits.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  Heart,
  Zap,
  Leaf,
  Scale,
  ShieldCheck,
  Sparkles,
  BookOpen,
  ArrowRight,
  Check,
  HelpCircle,
} from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const BENEFITS_FAQS: FaqItem[] = [
  {
    id: 'faq-benefits-1',
    question: 'How much makhana should I eat per day for health benefits?',
    answer:
      'A standard serving of 20–40 g per day (approximately 1–2 cupped handfuls) is a practical and nutritionally meaningful amount for most adults. This provides a useful contribution of protein, fiber, and minerals without excessive caloric intake. There is no clinically established "therapeutic dose" — makhana is a whole food, not a supplement.',
  },
  {
    id: 'faq-benefits-2',
    question: 'Is makhana good for weight loss?',
    answer:
      'Makhana may support weight management as part of a calorie-controlled, balanced diet. Its high fiber and moderate protein content promote satiety, and its very low fat content keeps caloric density relatively modest. However, no single food causes or prevents weight loss in isolation — total dietary pattern and energy balance remain the key drivers.',
  },
  {
    id: 'faq-benefits-3',
    question: 'Can diabetic individuals eat makhana?',
    answer:
      "Makhana's relatively low glycemic index and high fiber content mean it is generally considered a suitable snack choice for blood sugar-aware individuals. However, individuals with diagnosed diabetes or prediabetes should consult their doctor or clinical dietitian before making dietary changes. Makhana is not a treatment for diabetes.",
  },
  {
    id: 'faq-benefits-4',
    question: 'Does makhana contain gluten?',
    answer:
      'No. Euryale ferox (makhana) is naturally gluten-free. It contains no wheat, barley, rye, or gluten-forming proteins. Individuals with coeliac disease should verify that their specific product was packed in a gluten-free facility.',
  },
  {
    id: 'faq-benefits-5',
    question: 'Is makhana high in protein compared to other snacks?',
    answer:
      'At approximately 9.7 g of protein per 100 g, roasted makhana is a respectable plant-based protein source. It is lower in protein than legumes like lentils (~24 g/100 g dry) or peanuts (~26 g/100 g), but significantly higher in protein and lower in fat than most grain-based snacks like chips or popcorn.',
  },
  {
    id: 'faq-benefits-6',
    question: 'What is kaempferol in makhana?',
    answer:
      'Kaempferol is a naturally occurring flavonoid (a type of plant polyphenol) that has been identified in Euryale ferox seeds in food science studies. It is also found in broccoli, kale, and apples. Kaempferol is studied for its antioxidant properties in laboratory settings. Its exact bioavailability from makhana in human diets has not been fully characterised by clinical research.',
  },
];

const TOC_ITEMS = [
  { id: 'section-1', label: 'Nutritional Overview' },
  { id: 'section-2', label: 'Benefit 1: High Protein, Low Calorie' },
  { id: 'section-3', label: 'Benefit 2: Rich in Magnesium' },
  { id: 'section-4', label: 'Benefit 3: Gluten-Free & Low Sodium' },
  { id: 'section-5', label: 'Benefit 4: High Dietary Fiber' },
  { id: 'section-6', label: 'Benefit 5: Calcium & Phosphorus' },
  { id: 'section-7', label: 'Benefit 6: Low Glycemic Index' },
  { id: 'section-8', label: 'Benefit 7: Antioxidant Activity' },
  { id: 'section-9', label: 'How to Eat Makhana' },
];

const NUTRITION_ROWS = [
  { nutrient: 'Energy', value: '~347 kcal' },
  { nutrient: 'Protein', value: '~9.7 g' },
  { nutrient: 'Total Fat', value: '~0.1 g' },
  { nutrient: 'Carbohydrates', value: '~76.9 g' },
  { nutrient: 'Dietary Fiber', value: '~14.5 g' },
  { nutrient: 'Calcium', value: '~60 mg' },
  { nutrient: 'Magnesium', value: '~67 mg' },
  { nutrient: 'Phosphorus', value: '~200 mg' },
  { nutrient: 'Potassium', value: '~500 mg' },
  { nutrient: 'Sodium', value: '~5 mg' },
];

export const MakhanaHealthBenefits: React.FC = () => {
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-benefits-1');

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
                Makhana Benefits
              </li>
            </ol>
          </nav>

          {/* Title & Metadata */}
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A4D38] border border-[#C6A15B]/30 text-[#C6A15B] text-[11px] font-bold tracking-widest uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Health & Nutrition Guide</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Makhana Benefits: 7 Reasons to Eat Fox Nuts Every Day
            </h1>
            <p className="text-sm sm:text-base text-[#D5DED6] leading-relaxed">
              Discover 7 evidence-informed health benefits of makhana (fox nuts) — from high-protein weight management
              support to magnesium, fiber, antioxidants, and beyond.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#9BB0A3] border-t border-[#1A4D38]">
              <span>
                By <strong>NYUTAELITE Quality Editorial</strong>
              </span>
              <span>•</span>
              <time dateTime="2026-10-26">Updated October 2026</time>
              <span>•</span>
              <span>7 min read</span>
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
                Makhana — the popped seed of <em>Euryale ferox</em>, also called <strong>fox nuts</strong> or lotus seeds
                — has been consumed across Bihar and eastern India for centuries, long prized in Ayurvedic tradition and
                festive fasting cuisine. Modern nutrition research is beginning to confirm what traditional wisdom long
                suggested: makhana is a genuinely impressive whole food.
              </p>
              <p>
                Whether you are looking for a high-protein snack for post-workout recovery, a low-sodium option for a
                heart-conscious diet, or a satisfying munch for weight management, makhana delivers across multiple
                nutritional fronts. Below, we break down <strong>7 evidence-informed reasons</strong> to make fox nuts
                part of your daily routine.
              </p>
              {/* Disclaimer */}
              <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#C6A15B]/40 text-xs text-[#2D3748]">
                <p className="font-bold text-[#092218] mb-1">A note on nutritional claims</p>
                <p>
                  All values cited refer to <strong>plain roasted makhana (Euryale ferox)</strong> per 100 g dry weight,
                  consistent with published food composition data. Claims use hedged language ("may support", "is
                  associated with") and are not intended as medical advice.
                </p>
              </div>
            </div>

            {/* Section 1: Nutritional Overview */}
            <section id="section-1" className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm shrink-0">
                  1
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  What is Makhana? A Nutritional Overview
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Makhana is the air-popped, de-husked seed of the prickly water-lily (<em>Euryale ferox</em>), harvested
                from freshwater wetlands (<em>chaurs</em>) predominantly in Mithila, Bihar — which accounts for over 85%
                of India's domestic supply.
              </p>

              {/* Nutrition Fact Card */}
              <div className="rounded-2xl border border-[#E8DECB] bg-white shadow-xs overflow-hidden">
                <div className="bg-[#123B2A] text-white px-5 py-3 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-[#C6A15B]" />
                  <span className="font-bold text-sm">Nutrition Facts — Roasted Makhana (per 100 g, plain)</span>
                </div>
                <div className="divide-y divide-[#E8DECB]">
                  {NUTRITION_ROWS.map((row, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-5 py-2.5 text-xs sm:text-sm ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#FCFAF5]'
                      }`}
                    >
                      <span className="text-[#2D3748] font-medium">{row.nutrient}</span>
                      <span className="font-bold text-[#123B2A]">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 bg-[#F7F4EB] text-[10px] text-[#68756E]">
                  Source: Published food composition data for <em>Euryale ferox</em>. Values are approximate and may vary
                  by batch and preparation.
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Protein', value: '~9.7 g', sub: 'per 100 g' },
                  { label: 'Fiber', value: '~14.5 g', sub: 'per 100 g' },
                  { label: 'Sodium', value: '~5 mg', sub: 'per 100 g' },
                  { label: 'Fat', value: '~0.1 g', sub: 'per 100 g' },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded-xl bg-[#EAF2ED] border border-[#123B2A]/15 text-center">
                    <p className="text-xs text-[#68756E] mb-0.5">{stat.label}</p>
                    <p className="font-bold text-lg text-[#123B2A] leading-tight">{stat.value}</p>
                    <p className="text-[10px] text-[#9BB0A3]">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2: Benefit 1 — Protein & Weight */}
            <section id="section-2" className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm shrink-0">
                  2
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Benefit 1 — High Protein, Low Calorie: Ideal for Weight Management
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[#C6A15B]">
                <Scale className="w-5 h-5 shrink-0" />
                <span className="text-sm font-semibold text-[#123B2A]">~9.7 g protein · ~347 kcal · ~0.1 g fat per 100 g</span>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                At approximately <strong>9.7 g of protein per 100 g</strong>, makhana is one of the better plant-based
                protein sources among dry snack foods. Combined with its high fiber content and very low fat density, this
                makes makhana a food that <strong>may support weight management goals</strong> by promoting satiety —
                helping you feel full for longer and reducing the urge to reach for calorie-dense options between meals.
              </p>
              {/* Snack Comparison Table */}
              <div className="overflow-x-auto rounded-xl border border-[#E8DECB] bg-white shadow-xs">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#123B2A] text-white">
                      <th className="py-3 px-4 font-bold">Snack (100 g)</th>
                      <th className="py-3 px-4 font-bold">Protein</th>
                      <th className="py-3 px-4 font-bold">Fat</th>
                      <th className="py-3 px-4 font-bold">Calories</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DECB] text-[#2D3748]">
                    <tr className="bg-[#EAF2ED]/60">
                      <td className="py-3 px-4 font-bold text-[#123B2A]">Roasted Makhana ✓</td>
                      <td className="py-3 px-4 font-medium">~9.7 g</td>
                      <td className="py-3 px-4 font-medium">~0.1 g</td>
                      <td className="py-3 px-4 font-medium">~347 kcal</td>
                    </tr>
                    <tr className="hover:bg-[#FCFAF5]">
                      <td className="py-3 px-4">Potato Chips</td>
                      <td className="py-3 px-4">~6 g</td>
                      <td className="py-3 px-4 text-amber-700 font-semibold">~30+ g</td>
                      <td className="py-3 px-4 text-amber-700 font-semibold">~530+ kcal</td>
                    </tr>
                    <tr className="hover:bg-[#FCFAF5] bg-[#FCFAF5]/50">
                      <td className="py-3 px-4">Roasted Cashews</td>
                      <td className="py-3 px-4">~18 g</td>
                      <td className="py-3 px-4 text-amber-700 font-semibold">~44 g</td>
                      <td className="py-3 px-4 text-amber-700 font-semibold">~553 kcal</td>
                    </tr>
                    <tr className="hover:bg-[#FCFAF5]">
                      <td className="py-3 px-4">Air-popped Popcorn</td>
                      <td className="py-3 px-4">~11 g</td>
                      <td className="py-3 px-4">~4 g</td>
                      <td className="py-3 px-4">~375 kcal</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-4 rounded-xl bg-[#EAF2ED] border border-[#123B2A]/20 text-xs text-[#123B2A]">
                <p className="font-bold flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-[#C6A15B] shrink-0" />
                  Serving Tip
                </p>
                <p>
                  A typical serving of 30 g (~one cupped handful) provides approximately 104 kcal, 2.9 g protein, and
                  4.4 g fiber — a genuinely nutritious snack portion.
                </p>
              </div>
            </section>

            {/* Section 3: Benefit 2 — Magnesium */}
            <section id="section-3" className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm shrink-0">
                  3
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Benefit 2 — Rich in Magnesium: Supports Heart and Muscle Health
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#C6A15B] shrink-0" />
                <span className="text-sm font-semibold text-[#123B2A]">~67 mg magnesium per 100 g</span>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Makhana provides approximately <strong>67 mg of magnesium per 100 g</strong> — a meaningful dietary
                contribution of this often-underconsumed mineral. Magnesium plays a critical role in muscle contraction
                and relaxation (including the heart muscle), nerve signal transmission, blood glucose regulation, protein
                synthesis, and bone mineralisation.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: 'Muscle Function', desc: 'Supports contraction and relaxation of skeletal and cardiac muscle fibres.' },
                  { title: 'Nerve Signalling', desc: 'Essential cofactor for neurotransmitter synthesis and nerve impulse conduction.' },
                  { title: 'Glucose Regulation', desc: 'Acts as a cofactor for insulin receptor signalling pathways.' },
                  { title: 'Bone Health', desc: 'Works alongside calcium and phosphorus in bone mineralisation processes.' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#E8DECB]">
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
              <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#C6A15B]/40 text-xs text-[#2D3748]">
                <p className="font-bold text-[#092218] mb-1">Accuracy note</p>
                <p>
                  The above reflects general nutritional science on magnesium. These statements should not be interpreted
                  as claims that makhana treats, prevents, or cures heart disease or any other condition.
                </p>
              </div>
            </section>

            {/* Section 4: Benefit 3 — Gluten-Free & Low Sodium */}
            <section id="section-4" className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm shrink-0">
                  4
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Benefit 3 — Naturally Gluten-Free &amp; Low Sodium
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-5 rounded-xl bg-white border border-[#123B2A]/30 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-[#123B2A] font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-[#123B2A] shrink-0" />
                    <span>Naturally Gluten-Free</span>
                  </div>
                  <p className="text-xs text-[#2D3748] leading-relaxed">
                    <em>Euryale ferox</em> contains no wheat, barley, rye, or related gluten proteins. It is a safe,
                    naturally grain-free snack for individuals with coeliac disease or non-coeliac gluten sensitivity.
                  </p>
                  <p className="text-[11px] text-[#68756E]">
                    NYUTAELITE makhana is packed in a dedicated facility under FSSAI Reg. 20426021000494.
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-white border border-[#E8DECB] space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-[#123B2A] font-bold text-sm">
                    <Leaf className="w-4 h-4 text-[#C6A15B] shrink-0" />
                    <span>Ultra-Low Sodium (~5 mg/100 g)</span>
                  </div>
                  <ul className="text-xs text-[#2D3748] space-y-1.5 list-disc list-inside leading-relaxed">
                    <li>Salted potato chips: ~500–800 mg sodium/100 g</li>
                    <li>Salted roasted peanuts: ~350–400 mg sodium/100 g</li>
                    <li>Commercial namkeen: often &gt;800 mg sodium/100 g</li>
                    <li>
                      <strong className="text-[#123B2A]">Plain makhana: ~5 mg sodium/100 g</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 5: Benefit 4 — Fiber */}
            <section id="section-5" className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm shrink-0">
                  5
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Benefit 4 — High Dietary Fiber: Aids Digestion and Satiety
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                With approximately <strong>14.5 g of dietary fiber per 100 g</strong>, makhana is genuinely fiber-dense
                — comparable to or exceeding many vegetables and legumes on a gram-for-gram basis. Dietary fiber is
                crucial for gut health, satiety, and metabolic wellbeing.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    title: 'Feeds Beneficial Gut Microbiota',
                    desc: 'Fermentable fiber fractions fuel Lactobacillus and Bifidobacterium populations in the colon.',
                  },
                  {
                    title: 'Slows Gastric Emptying',
                    desc: 'Extends satiety and moderates post-meal blood glucose rises by delaying digestion.',
                  },
                  {
                    title: 'Supports Bowel Regularity',
                    desc: 'Promotes healthy bowel motility, reducing the risk of constipation.',
                  },
                  {
                    title: 'Cholesterol Management',
                    desc: 'Soluble fiber fractions may bind bile acids in the gut, potentially supporting cholesterol balance.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#E8DECB]">
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
              <div className="p-4 rounded-xl bg-[#EAF2ED] border border-[#123B2A]/20 text-xs text-[#123B2A]">
                <p className="font-bold mb-1">Daily Fiber Contribution</p>
                <p>
                  The ICMR recommends approximately 40 g of dietary fiber daily for Indian adults. A 30 g serving of
                  makhana provides ~4.4 g fiber — roughly <strong>11% of daily needs</strong> from a single small snack.
                </p>
              </div>
            </section>

            {/* Section 6: Benefit 5 — Calcium & Phosphorus */}
            <section id="section-6" className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm shrink-0">
                  6
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Benefit 5 — Good Source of Calcium &amp; Phosphorus: Bone Health
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Makhana contains approximately <strong>60 mg calcium</strong> and <strong>200 mg phosphorus</strong> per
                100 g — both essential minerals for skeletal integrity. Calcium and phosphorus combine to form
                hydroxyapatite, the primary mineral matrix of bone and tooth enamel.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#E8DECB] text-center space-y-1">
                  <p className="text-xs text-[#68756E]">Calcium</p>
                  <p className="text-2xl font-bold text-[#123B2A]">~60 mg</p>
                  <p className="text-[10px] text-[#9BB0A3]">per 100 g</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#E8DECB] text-center space-y-1">
                  <p className="text-xs text-[#68756E]">Phosphorus</p>
                  <p className="text-2xl font-bold text-[#123B2A]">~200 mg</p>
                  <p className="text-[10px] text-[#9BB0A3]">per 100 g</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                For <strong>vegan and plant-based eaters</strong> who avoid dairy, makhana provides an accessible
                non-dairy calcium and phosphorus source. Unlike spinach or certain legumes, makhana does not contain
                oxalic acid at levels that would significantly inhibit calcium absorption.
              </p>
            </section>

            {/* Section 7: Benefit 6 — Low GI */}
            <section id="section-7" className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm shrink-0">
                  7
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Benefit 6 — Low Glycemic Index: Suitable for Blood Sugar Awareness
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Makhana has a <strong>relatively low glycemic index</strong> compared to most processed snack foods and
                refined grain products. Its nutritional profile — high fiber, moderate protein, very low fat, and a
                predominantly resistant starch fraction — is consistent with a moderate-to-low glycemic response pattern,
                meaning it tends to cause a more gradual rise in blood glucose after consumption.
              </p>
              <div className="p-5 rounded-xl bg-white border border-[#E8DECB] space-y-3 shadow-xs">
                <h3 className="font-bold text-sm text-[#1C1C1C]">Why GI matters for everyday snacking:</h3>
                <ul className="text-xs text-[#2D3748] space-y-2 list-disc list-inside leading-relaxed">
                  <li>High-GI snacks cause rapid blood glucose spikes followed by steep insulin responses</li>
                  <li>This is associated with increased hunger return within 1–2 hours</li>
                  <li>Greater likelihood of overeating at subsequent meals</li>
                  <li>Makhana's fiber content slows the rate at which glucose enters the bloodstream</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#C6A15B]/40 text-xs text-[#2D3748]">
                <p className="font-bold text-[#8C2A1E] mb-1">Important</p>
                <p>
                  Makhana is <strong>not a treatment for diabetes or hyperglycaemia</strong>. Individuals with diagnosed
                  blood sugar conditions should consult their doctor or registered dietitian before making dietary changes.
                </p>
              </div>
            </section>

            {/* Section 8: Benefit 7 — Antioxidants */}
            <section id="section-8" className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm shrink-0">
                  8
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Benefit 7 — Antioxidant Activity: Kaempferol and Flavonoids
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C6A15B] shrink-0" />
                <span className="text-sm font-semibold text-[#123B2A]">Kaempferol — a plant-derived flavonoid</span>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Food science research has identified the presence of <strong>kaempferol</strong> — a plant-derived
                flavonoid — in <em>Euryale ferox</em> seeds. Kaempferol belongs to the flavonol subclass of polyphenols
                and is also found in common foods like kale, broccoli, apples, and green tea. In laboratory studies,
                kaempferol has demonstrated antioxidant activity by neutralising free radicals.
              </p>
              <div className="p-5 rounded-xl bg-white border border-[#E8DECB] space-y-3 shadow-xs">
                <h3 className="font-bold text-sm text-[#1C1C1C]">What this means for makhana:</h3>
                <ul className="text-xs text-[#2D3748] space-y-2 list-disc list-inside leading-relaxed">
                  <li>
                    <strong>Kaempferol presence</strong> confirmed in published food science literature for{' '}
                    <em>Euryale ferox</em>
                  </li>
                  <li>
                    Antioxidant activity demonstrated in <strong>in vitro (laboratory) studies</strong>
                  </li>
                  <li>Free radical neutralisation is associated with reducing oxidative cellular stress</li>
                  <li>
                    Also found in broccoli, kale, apples, and green tea — widely consumed functional foods
                  </li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#C6A15B]/40 text-xs text-[#2D3748]">
                <p className="font-bold text-[#092218] mb-1">Research note</p>
                <p>
                  The antioxidant properties referenced are based on published food science literature and in vitro
                  findings. They do not constitute clinical evidence that eating makhana prevents or treats any disease.
                  Research on the bioavailability and in vivo efficacy of makhana flavonoids in humans is ongoing.
                </p>
              </div>
            </section>

            {/* Section 9: How to Eat Makhana */}
            <section id="section-9" className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm shrink-0">
                  9
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  How to Eat Makhana for Maximum Benefit
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Getting the most from makhana comes down to portion size, preparation method, and timing. Here's what
                the nutritional profile suggests:
              </p>

              {/* Serving size */}
              <div className="p-5 rounded-xl bg-white border border-[#E8DECB] space-y-3 shadow-xs">
                <h3 className="font-bold text-sm text-[#1C1C1C]">Optimal Serving Size</h3>
                <p className="text-xs text-[#2D3748] leading-relaxed">
                  A standard daily serving is <strong>20–40 g (approx. 1–2 cupped handfuls)</strong> of plain roasted
                  makhana. This range delivers:
                </p>
                <ul className="text-xs text-[#2D3748] space-y-1 list-disc list-inside">
                  <li>~70–140 kcal</li>
                  <li>~2–4 g protein</li>
                  <li>~3–6 g dietary fiber</li>
                </ul>
              </div>

              {/* Roasting tips */}
              <div className="p-5 rounded-xl bg-white border border-[#E8DECB] space-y-3 shadow-xs">
                <h3 className="font-bold text-sm text-[#1C1C1C]">Roasting Tips for Maximum Crunch</h3>
                <ol className="text-xs sm:text-sm text-[#2D3748] space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Dry roast in a heavy-bottomed pan over medium-low heat for 4–6 minutes, stirring continuously</li>
                  <li>
                    Add <strong>½ tsp ghee</strong> (optional) for richer flavour — even a small amount significantly
                    enhances taste without dramatically altering the nutritional profile
                  </li>
                  <li>
                    Season lightly with <strong>rock salt, cumin, and black pepper</strong> post-roast (not during, to
                    avoid burning spices)
                  </li>
                  <li>Allow to cool for 2 minutes before eating — the crunch intensifies as they cool</li>
                </ol>
              </div>

              {/* Recipe ideas table */}
              <div className="overflow-x-auto rounded-xl border border-[#E8DECB] bg-white shadow-xs">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#123B2A] text-white">
                      <th className="py-3 px-4 font-bold">Preparation</th>
                      <th className="py-3 px-4 font-bold">Method</th>
                      <th className="py-3 px-4 font-bold">When to Eat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DECB] text-[#2D3748]">
                    {[
                      { prep: 'Ghee-Roasted Makhana', method: 'Pan-roast with ghee + rock salt', when: 'Anytime snack' },
                      { prep: 'Makhana Kheer', method: 'Simmer in milk with jaggery and cardamom', when: 'Dessert / festive' },
                      { prep: 'Spiced Trail Mix', method: 'Roast with pumpkin seeds, raisins, and turmeric', when: 'Post-workout' },
                      { prep: 'Makhana Curry', method: 'Simmer in tomato-onion gravy', when: 'Main meal side' },
                    ].map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'hover:bg-[#FCFAF5]' : 'hover:bg-[#FCFAF5] bg-[#FCFAF5]/50'}>
                        <td className="py-3 px-4 font-medium text-[#1C1C1C]">{row.prep}</td>
                        <td className="py-3 px-4">{row.method}</td>
                        <td className="py-3 px-4 text-[#123B2A] font-medium">{row.when}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* FAQ Accordion */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-[#C6A15B]" />
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="space-y-3">
                {BENEFITS_FAQS.map((faq) => {
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

            {/* Read Also — Internal link to Article 1 */}
            <div className="p-5 rounded-2xl bg-white border border-[#E8DECB] shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-3 rounded-xl bg-[#EAF2ED] shrink-0">
                <BookOpen className="w-6 h-6 text-[#123B2A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#C6A15B] mb-0.5">Read also</p>
                <p className="font-serif text-base font-bold text-[#092218] leading-snug">
                  How to Choose Good-Quality Makhana: Complete Buyer's Guide
                </p>
                <p className="text-xs text-[#68756E] mt-1">
                  Understand Suta sizing, natural vs bleached fox nuts, crispness checks, and storage tips.
                </p>
              </div>
              <Link
                to="/learn/how-to-choose-good-quality-makhana"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#123B2A] text-white text-xs font-bold hover:bg-[#092218] transition-colors shrink-0"
              >
                <span>Read Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Conclusion CTA */}
            <section className="p-6 sm:p-8 rounded-2xl bg-[#123B2A] text-white space-y-4">
              <h2 className="font-serif text-2xl font-bold text-white">
                Experience Bihar's Finest Fox Nuts Daily
              </h2>
              <p className="text-xs sm:text-sm text-[#D5DED6] leading-relaxed">
                Makhana delivers meaningful protein, very high fiber, extremely low fat, negligible sodium, useful mineral
                density, and a flavonoid profile that includes kaempferol — all in a clean, whole-food snack rooted in
                Bihar's centuries-old farming tradition.
              </p>
              {/* All 6 pack sizes */}
              <div className="pt-2 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#C6A15B]">Choose Your Pack</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {([
                    ['Premium 100g', '/products/makhana?sku=premium-100g', '₹160'],
                    ['Premium 200g', '/products/makhana?sku=premium-200g', '₹310'],
                    ['Premium 250g', '/products/makhana?sku=premium-250g', '₹380'],
                    ['Normal 100g',  '/products/makhana?sku=normal-100g',  '₹120'],
                    ['Normal 200g',  '/products/makhana?sku=normal-200g',  '₹230'],
                    ['Normal 250g',  '/products/makhana?sku=normal-250g',  '₹280'],
                  ] as [string, string, string][]).map(([label, href, price]) => (
                    <Link
                      key={href}
                      to={href}
                      className="bg-[#1A4D38] border border-[#C6A15B]/30 rounded-xl p-2.5 text-center hover:border-[#C6A15B] transition-colors"
                    >
                      <p className="text-[10px] font-bold text-[#D5DED6] uppercase tracking-wide">{label}</p>
                      <p className="text-xs font-bold text-[#C6A15B] mt-0.5">{price}</p>
                    </Link>
                  ))}
                </div>
              </div>
              {/* Cross-article link */}
              <div className="mt-4 pt-4 border-t border-[#C6A15B]/30">
                <p className="text-xs text-[#D5DED6] mb-2">Related guide:</p>
                <Link
                  to="/learn/how-to-choose-good-quality-makhana"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#C6A15B] hover:underline"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>How to Choose Good-Quality Makhana →</span>
                </Link>
              </div>
            </section>
          </main>

          {/* Sticky Sidebar on Desktop */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E8DECB] shadow-xs space-y-5 sticky top-24">
              {/* Table of Contents */}
              <div className="space-y-3">
                <h3 className="font-serif text-lg font-bold text-[#092218]">In This Article</h3>
                <nav aria-label="Table of contents">
                  <ul className="space-y-1">
                    {TOC_ITEMS.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="flex items-center gap-2 text-xs text-[#68756E] hover:text-[#123B2A] transition-colors py-1 group"
                        >
                          <ChevronRight className="w-3 h-3 text-[#C6A15B] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                          <span>{item.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              <div className="border-t border-[#E8DECB] pt-4 space-y-3">
                <h3 className="font-serif text-base font-bold text-[#092218]">Shop Makhana</h3>
                <p className="text-xs text-[#68756E]">Choose between our two pure Bihar grades:</p>

                {/* Premium CTA */}
                <div className="p-3.5 rounded-xl bg-[#FCFAF5] border border-[#123B2A]/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#123B2A]">Premium Jumbo</span>
                    <span className="text-xs font-bold text-[#C6A15B]">From ₹160</span>
                  </div>
                  <p className="text-[11px] text-[#68756E]">5+ Suta (~15–22+ mm). Ideal for ghee roasting.</p>
                  <Link
                    to="/products/makhana?sku=premium-100g"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123B2A] hover:underline"
                  >
                    <span>View Premium Pack</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Normal CTA */}
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

              {/* Nutrition Quick Ref */}
              <div className="border-t border-[#E8DECB] pt-4 space-y-2">
                <h3 className="text-xs font-bold text-[#092218]">Nutrition at a Glance (per 100 g)</h3>
                <div className="space-y-1">
                  {[
                    { label: 'Protein', value: '~9.7 g' },
                    { label: 'Fiber', value: '~14.5 g' },
                    { label: 'Magnesium', value: '~67 mg' },
                    { label: 'Sodium', value: '~5 mg' },
                    { label: 'Calories', value: '~347 kcal' },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-[11px]">
                      <span className="text-[#68756E]">{row.label}</span>
                      <span className="font-bold text-[#123B2A]">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FSSAI Trust Badge */}
              <div className="pt-2 border-t border-[#E8DECB] space-y-2 text-center">
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
