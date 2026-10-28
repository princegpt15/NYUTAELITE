// src/pages/learn/HowToStoreMakhana.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  Flame,
  BookOpen,
  HelpCircle,
  Sparkles,
  Thermometer,
  Droplets,
  Package,
  Clock,
} from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const STORAGE_FAQS: FaqItem[] = [
  {
    id: 'faq-storage-1',
    question: 'Can I store makhana in the fridge?',
    answer:
      'No. Refrigerators maintain higher relative humidity than a dry pantry cupboard. Placing makhana in the fridge actually accelerates moisture absorption and causes faster softening. The condensation cycle inside a refrigerator is particularly damaging to the porous air-popped structure of fox nuts. Store makhana in a cool, dry pantry instead.',
  },
  {
    id: 'faq-storage-2',
    question: 'Is frozen makhana okay?',
    answer:
      'Freezing makhana is not recommended. When frozen makhana is removed from the freezer, condensation rapidly forms on the cold surface as it meets warm ambient air. This moisture — concentrated and sudden — is far more damaging to makhana texture than ordinary ambient humidity. Thawing degrades the crisp honeycomb structure significantly. Room-temperature storage in a sealed airtight container is always preferable.',
  },
  {
    id: 'faq-storage-3',
    question: 'Why does makhana go yellow?',
    answer:
      'Yellowing is primarily caused by prolonged exposure to light (particularly UV) and oxygen. The natural seed oils and starch fractions in makhana undergo slow oxidation when left in transparent containers on open countertops or in sunlit areas. To prevent yellowing, use an opaque airtight container or keep a transparent jar inside a dark cupboard. Consuming makhana before the best-before date also minimises this.',
  },
  {
    id: 'faq-storage-4',
    question: 'What is the shelf life of NYUTAELITE makhana?',
    answer:
      'The best-before date is printed on every NYUTAELITE makhana pouch. Sealed and unopened pouches typically remain fresh for 6–9 months from the manufacture date when stored in normal room-temperature conditions. Once opened, correctly stored makhana (airtight container, cool dry place) stays crisp for approximately 4–6 weeks. In humid climates without silica gel protection, quality may decline within 1–2 weeks of opening.',
  },
];

export const HowToStoreMakhana: React.FC = () => {
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-storage-1');

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
                How to Store Makhana to Keep It Crisp
              </li>
            </ol>
          </nav>

          {/* Title & Metadata */}
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A4D38] border border-[#C6A15B]/30 text-[#C6A15B] text-[11px] font-bold tracking-widest uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Storage &amp; Freshness Guide</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              How to Store Makhana to Keep It Crisp
            </h1>
            <p className="text-sm sm:text-base text-[#D5DED6] leading-relaxed">
              Learn the right containers, ideal conditions, monsoon tips, and how to revive soggy fox nuts — keeping your makhana fresh and crisp for months.
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
                You&apos;ve bought a fresh pack of Bihar makhana — crisp, light, and perfectly popped. But within
                days of opening the pouch, the fox nuts have turned soft, chewy, and flat. What went wrong?
              </p>
              <p>
                The answer is almost always moisture. Makhana&apos;s uniquely porous, air-popped cellular structure
                makes it one of the most moisture-sensitive dry foods in your pantry. Understanding exactly why this
                happens — and how to prevent it — is the difference between makhana that stays delightfully crisp
                for weeks and makhana that turns rubbery within days.
              </p>
              <p>
                This guide covers the science of makhana softening, the best containers and conditions, special
                monsoon precautions, and a simple technique to restore crunch if softening has already occurred.
              </p>
            </div>

            {/* Section 1: Why Makhana Goes Soft */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  1
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Why Makhana Goes Soft: The Science
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Makhana is <strong>hygroscopic</strong> — it actively draws moisture from the surrounding air. This
                isn&apos;t a quality defect; it&apos;s a physical property of the expanded starch structure created
                during the high-heat roasting and popping process used in Bihar&apos;s traditional <em>thapi</em> method.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-white border border-[#E8DECB] space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-[#123B2A] font-bold text-sm">
                    <Droplets className="w-4 h-4 text-[#123B2A]" />
                    <span>The Hygroscopic Effect</span>
                  </div>
                  <ul className="text-xs text-[#2D3748] space-y-2 list-disc list-inside leading-relaxed">
                    <li><strong>Air-Popped Pores:</strong> The popping process creates a honeycomb of tiny air pockets throughout the kernel.</li>
                    <li><strong>Surface Area:</strong> These pores dramatically increase the effective moisture-absorbing surface area of each nut.</li>
                    <li><strong>Rapid Absorption:</strong> In humid conditions, visible softening can begin within minutes of the pouch being unsealed.</li>
                  </ul>
                </div>
                <div className="p-5 rounded-xl bg-white border border-[#E8DECB] space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-[#092218] font-bold text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>More Sensitive Than Regular Nuts</span>
                  </div>
                  <ul className="text-xs text-[#2D3748] space-y-2 list-disc list-inside leading-relaxed">
                    <li><strong>Denser nuts</strong> (cashews, almonds) have far less porosity and absorb moisture much more slowly.</li>
                    <li><strong>Bihar fox nuts</strong> — especially premium jumbo-grade — have the highest expansion ratio and thus the highest surface area for moisture entry.</li>
                    <li>Even a brief exposure to cooking steam or open air is enough to noticeably degrade crispness.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2: Best Storage Containers */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  2
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Best Storage Containers
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                The container is your first line of defence. Not all containers are equal when it comes to keeping
                makhana crisp.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-[#EAF2ED] border border-[#123B2A]/20 space-y-3">
                  <div className="flex items-center gap-2 text-[#123B2A] font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-[#123B2A]" />
                    <span>Recommended</span>
                  </div>
                  <ul className="text-xs text-[#2D3748] space-y-2 list-disc list-inside leading-relaxed">
                    <li><strong>Airtight glass jars</strong> with silicone-sealed lids (Kilner-style or mason jars) — completely block ambient humidity.</li>
                    <li><strong>Resealable multi-layer moisture-barrier zipper pouches</strong> — the same foil-laminated pouches NYUTAELITE makhana comes in. Squeeze out excess air before sealing.</li>
                    <li><strong>Hard-sided airtight food containers</strong> (BPA-free plastic or stainless steel with rubber-sealed lids).</li>
                  </ul>
                </div>
                <div className="p-5 rounded-xl bg-white border border-amber-200 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Avoid These</span>
                  </div>
                  <ul className="text-xs text-[#2D3748] space-y-2 list-disc list-inside leading-relaxed">
                    <li><strong>Open bowls</strong> — the worst option; maximum moisture exposure.</li>
                    <li><strong>Paper bags</strong> — absorb ambient moisture themselves and transfer it directly to makhana.</li>
                    <li><strong>Loosely closed packets</strong> — even a small gap is enough for humid air to ruin a batch overnight.</li>
                    <li><strong>Thin single-layer polythene bags</strong> — poor moisture barrier, particularly in summer.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3: Ideal Storage Conditions */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  3
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Ideal Storage Conditions
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                The right container matters, but so does where you put it.
              </p>
              <div className="p-5 rounded-xl bg-white border border-[#E8DECB] space-y-4 shadow-xs">
                <div className="flex items-center gap-2 text-[#123B2A] font-bold text-sm">
                  <Thermometer className="w-4 h-4 text-[#C6A15B]" />
                  <span>Optimal Environment: Cool, Dry, Dark Pantry Cupboard</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {[
                    { title: 'Temperature', desc: 'Room temperature 18–25°C. Consistent cool temperature slows oxidation and moisture cycling.' },
                    { title: 'Humidity', desc: 'Relative humidity below 60%. A dry pantry cupboard is ideal; avoid zones near sinks or dishwashers.' },
                    { title: 'Light', desc: 'Darkness or opaque containers. UV and visible light accelerate oxidation and yellowing of natural seed oils.' },
                    { title: 'Airflow', desc: 'Minimal airflow into the container. Sealed storage prevents the continual fresh introduction of humid air.' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-[#FCFAF5] border border-[#E8DECB]">
                      <div>
                        <p className="text-xs font-bold text-[#1C1C1C]">{item.title}</p>
                        <p className="text-[11px] text-[#68756E] leading-relaxed mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#C6A15B]/40 text-xs text-[#2D3748] space-y-2">
                <p className="font-bold text-[#8C2A1E]">Locations to Avoid</p>
                <ul className="space-y-1.5 list-disc list-inside leading-relaxed">
                  <li><strong>Near the stovetop:</strong> Heat and steam from cooking are the fastest way to ruin a batch.</li>
                  <li><strong>Refrigerator condensation zones:</strong> The temperature cycling creates condensation that actively wets the kernels.</li>
                  <li><strong>Sunlit countertops:</strong> Direct sunlight heats the container, creates convection, and drives UV oxidation simultaneously.</li>
                  <li><strong>Above the fridge:</strong> The heat from the refrigerator compressor creates a warm, sometimes humid micro-environment.</li>
                </ul>
              </div>
            </section>

            {/* Section 4: Monsoon & Humidity Tips */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  4
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Monsoon &amp; High-Humidity Tips
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Indian summers and the monsoon season (June–September in most of India) can push indoor relative
                humidity well above 70% — far beyond what makhana can handle without protection. During these months,
                extra precautions become essential.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: <Package className="w-4 h-4 text-[#C6A15B]" />,
                    title: 'Add a Food-Safe Silica Gel Packet',
                    desc: 'Place a clean food-grade silica gel desiccant sachet inside the airtight storage jar. These are inexpensive, reusable (dry in an oven), and highly effective at absorbing ambient moisture inside the container.',
                  },
                  {
                    icon: <Clock className="w-4 h-4 text-[#C6A15B]" />,
                    title: 'Seal Within 2 Minutes of Opening',
                    desc: 'In humid weather, every second the pouch or jar is open allows moisture to enter. Pour your serving quickly, then immediately reseal the container tightly.',
                  },
                  {
                    icon: <Droplets className="w-4 h-4 text-[#C6A15B]" />,
                    title: 'Never Open Near Cooking Steam',
                    desc: 'Avoid unsealing makhana near boiling pots, pressure cookers, or the kettle. Even momentary steam exposure will noticeably soften the nuts.',
                  },
                  {
                    icon: <Sparkles className="w-4 h-4 text-[#C6A15B]" />,
                    title: 'Consider Smaller Batches',
                    desc: 'In peak monsoon months, transfer only a few days\' worth of makhana into a smaller container for daily use. Keep the bulk supply sealed and undisturbed.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#E8DECB] shadow-xs">
                    <div className="p-1.5 rounded-full bg-[#EAF2ED] text-[#123B2A] shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1C1C1C]">{item.title}</p>
                      <p className="text-[11px] text-[#68756E] leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5: How to Revive Soggy Makhana */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  5
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  How to Revive Soggy Makhana
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                If your makhana has already absorbed moisture and gone soft or chewy, all is not lost. A simple dry-roasting
                technique effectively drives out the absorbed moisture and restores the crisp snap — provided the makhana
                is not mouldy or rancid.
              </p>
              <div className="p-5 rounded-xl bg-white border border-[#E8DECB] space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-[#123B2A] font-bold text-sm">
                  <Flame className="w-4 h-4 text-[#C6A15B]" />
                  <span>Step-by-Step: Dry-Roasting to Restore Crunch</span>
                </div>
                <ol className="text-xs sm:text-sm text-[#2D3748] space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Heat a heavy-bottomed pan (preferably cast iron or thick stainless steel) over <strong>low flame</strong>.</li>
                  <li>Add the softened makhana — no oil, no ghee, no water.</li>
                  <li>Stir gently but continuously for <strong>3–4 minutes</strong>. The heat drives absorbed moisture out of the porous kernel structure.</li>
                  <li>You will notice the makhana becoming noticeably lighter and beginning to feel drier under the stirring spoon.</li>
                  <li>Remove from heat and spread on a dry plate or tray.</li>
                  <li><strong>Cool completely</strong> for at least 10 minutes before tasting or returning to the airtight container. The crunch intensifies as they cool.</li>
                </ol>
              </div>
              <div className="p-4 rounded-xl bg-[#F7F4EB] border border-[#C6A15B]/40 text-xs text-[#2D3748] space-y-2">
                <p className="font-bold text-[#8C2A1E] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Food Safety Note
                </p>
                <p>
                  A soft texture alone is a physical sign of moisture absorption, not a safety issue. However,{' '}
                  <strong>never dry-roast or consume makhana</strong> that smells sour, damp, rancid, or shows
                  any dark green or gray mold spots. If in doubt, discard.
                </p>
              </div>
            </section>

            {/* Section 6: Shelf Life */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#123B2A] text-white font-bold text-sm">
                  6
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  How Long Does Makhana Last?
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#2D3748] leading-relaxed">
                Shelf life depends significantly on storage conditions. Here is a practical reference:
              </p>
              <div className="overflow-x-auto rounded-xl border border-[#E8DECB] bg-white shadow-xs">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#123B2A] text-white">
                      <th className="py-3 px-4 font-bold">Storage Scenario</th>
                      <th className="py-3 px-4 font-bold">Estimated Freshness</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DECB] text-[#2D3748]">
                    <tr className="hover:bg-[#FCFAF5]">
                      <td className="py-3.5 px-4 font-medium">Sealed, unopened pouch (room temperature)</td>
                      <td className="py-3.5 px-4 font-bold text-[#123B2A]">6–9 months from manufacture date</td>
                    </tr>
                    <tr className="hover:bg-[#FCFAF5] bg-[#F7F4EB]/50">
                      <td className="py-3.5 px-4 font-medium">Opened, in airtight container (dry climate)</td>
                      <td className="py-3.5 px-4 font-bold text-[#123B2A]">4–6 weeks before noticeable softness</td>
                    </tr>
                    <tr className="hover:bg-[#FCFAF5]">
                      <td className="py-3.5 px-4 font-medium">Opened, in airtight container with silica gel (humid climate)</td>
                      <td className="py-3.5 px-4 font-bold text-[#123B2A]">2–4 weeks, good crispness retained</td>
                    </tr>
                    <tr className="hover:bg-[#FCFAF5] bg-[#F7F4EB]/50">
                      <td className="py-3.5 px-4 font-medium">Opened, no silica gel, humid climate (&gt;70% RH)</td>
                      <td className="py-3.5 px-4 font-bold text-amber-700">1–2 weeks before significant softening</td>
                    </tr>
                    <tr className="hover:bg-[#FCFAF5]">
                      <td className="py-3.5 px-4 font-medium">Left in open bowl at room temperature</td>
                      <td className="py-3.5 px-4 font-bold text-[#8C2A1E]">Hours to 1–2 days (not recommended)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-4 rounded-xl bg-[#EAF2ED] border border-[#123B2A]/20 text-xs text-[#123B2A]">
                <p className="font-bold mb-1">Check the Best Before Date</p>
                <p>
                  The best-before date is printed on every NYUTAELITE makhana pouch. This date applies to the sealed,
                  unopened pouch stored at room temperature. Once opened, consume within the timeframes above for
                  optimal quality.
                </p>
              </div>
            </section>

            {/* FAQ Section */}
            <section className="space-y-6 pt-4 border-t border-[#E8DECB]">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-[#C6A15B]" />
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="space-y-3">
                {STORAGE_FAQS.map((faq) => {
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

            {/* Conclusion CTA */}
            <section className="p-6 sm:p-8 rounded-2xl bg-[#123B2A] text-white space-y-4">
              <h2 className="font-serif text-2xl font-bold text-white">
                Start With Quality Makhana That Stays Crisp
              </h2>
              <p className="text-xs sm:text-sm text-[#D5DED6] leading-relaxed">
                The best storage practice in the world can only protect the quality you start with. NYUTAELITE
                makhana is sealed in multi-layer moisture-barrier pouches directly after grading in Mithila, Bihar
                — giving you the freshest possible baseline to preserve.
              </p>
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
                      <p className="text-sm font-extrabold text-[#C6A15B] mt-0.5">{price}</p>
                    </Link>
                  ))}
                </div>
              </div>
              {/* Cross-article links */}
              <div className="mt-4 pt-4 border-t border-[#C6A15B]/30 space-y-2">
                <p className="text-xs text-[#D5DED6] mb-2">Related guides:</p>
                <Link
                  to="/learn/how-to-choose-good-quality-makhana"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#C6A15B] hover:underline"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>How to Choose Good-Quality Makhana: Complete Buyer&apos;s Guide →</span>
                </Link>
                <br />
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
            <div className="p-6 rounded-2xl bg-white border border-[#E8DECB] shadow-xs space-y-4 sticky top-24">
              <h3 className="font-serif text-lg font-bold text-[#092218]">
                Shop NYUTAELITE Makhana
              </h3>
              <p className="text-xs text-[#68756E] leading-relaxed">
                Sealed in moisture-barrier pouches for lasting freshness:
              </p>

              <div className="space-y-3 pt-1">
                {/* Premium Grade */}
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

                {/* Normal Grade */}
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

              {/* Related Articles */}
              <div className="pt-4 border-t border-[#E8DECB] space-y-3">
                <p className="text-xs font-bold text-[#1C1C1C]">Related Articles</p>
                <Link
                  to="/learn/how-to-choose-good-quality-makhana"
                  className="flex items-start gap-2 p-3 rounded-xl bg-[#F7F4EB] border border-[#E8DECB] hover:border-[#123B2A] transition-colors group"
                >
                  <BookOpen className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-[#123B2A] group-hover:underline leading-snug">
                      How to Choose Good-Quality Makhana
                    </p>
                    <p className="text-[10px] text-[#68756E] mt-0.5">Suta grades, bleaching tests, crispness checks</p>
                  </div>
                </Link>
                <Link
                  to="/learn/makhana-benefits-health"
                  className="flex items-start gap-2 p-3 rounded-xl bg-[#F7F4EB] border border-[#E8DECB] hover:border-[#123B2A] transition-colors group"
                >
                  <BookOpen className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-[#123B2A] group-hover:underline leading-snug">
                      Makhana Benefits: 7 Reasons to Eat Fox Nuts Every Day
                    </p>
                    <p className="text-[10px] text-[#68756E] mt-0.5">Protein, fiber, magnesium, antioxidants</p>
                  </div>
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
