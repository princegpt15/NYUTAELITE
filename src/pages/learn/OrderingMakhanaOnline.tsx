// src/pages/learn/OrderingMakhanaOnline.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  Truck,
  Package,
  Phone,
  Mail,
  Clock,
  BookOpen,
  HelpCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const ORDERING_FAQS: FaqItem[] = [
  {
    id: 'faq-order-1',
    question: 'How long does delivery take after I place an order?',
    answer:
      'Orders are dispatched within 1–2 business days of payment confirmation. Pan-India courier transit typically takes 3–7 business days depending on your pin code. You will receive a tracking number by email once your order is shipped.',
  },
  {
    id: 'faq-order-2',
    question: 'Is NYUTAELITE MAKHANA FSSAI registered?',
    answer:
      'Yes. NYUTAELITE MAKHANA operates under FSSAI registration number 20426021000494. This registration confirms compliance with Indian food safety and hygiene standards for processing and packaging.',
  },
  {
    id: 'faq-order-3',
    question: 'What if my makhana arrives damaged or broken?',
    answer:
      'We offer a 48-hour delivery damage replacement guarantee. If your package arrives damaged, please photograph the sealed parcel and the product and contact us within 48 hours of delivery at info@nyutaelite.com or call +91 8102875852. We will arrange a replacement at no additional charge.',
  },
  {
    id: 'faq-order-4',
    question: 'Do you ship pan-India including remote areas?',
    answer:
      'Yes, we deliver across India including Tier-2 and Tier-3 cities. Delivery timelines may be slightly longer for remote pin codes. Enter your pin code at checkout to see estimated delivery dates.',
  },
  {
    id: 'faq-order-5',
    question: 'How is freshness maintained during shipping?',
    answer:
      'Each pack is sealed in a food-grade multi-layer moisture-barrier pouch before dispatch. The sealed pouch protects the makhana from humidity during transit. We source directly from Bihar and maintain short farm-to-dispatch timelines to ensure maximum freshness on arrival.',
  },
  {
    id: 'faq-order-6',
    question: 'Can I cancel or modify my order after placing it?',
    answer:
      'Orders can be cancelled or modified within 2 hours of placement if they have not yet been dispatched. Please contact us immediately at +91 8102875852 or info@nyutaelite.com for any changes.',
  },
];

const TIMELINE_STEPS = [
  {
    icon: <Package className="w-5 h-5 text-[#C6A15B]" />,
    title: 'Order Placed',
    detail: 'You receive a confirmation email with your order details and payment receipt.',
    time: 'Immediately',
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-[#C6A15B]" />,
    title: 'Quality Check & Packing',
    detail: 'Your makhana is inspected and sealed in a food-grade moisture-barrier pouch.',
    time: 'Same or next business day',
  },
  {
    icon: <Truck className="w-5 h-5 text-[#C6A15B]" />,
    title: 'Dispatched with Tracking',
    detail: 'Your package is handed to our courier partner. A tracking number is emailed to you.',
    time: '1–2 business days after order',
  },
  {
    icon: <CheckCircle className="w-5 h-5 text-[#C6A15B]" />,
    title: 'Delivered to Your Door',
    detail: 'Pan-India transit typically takes 3–7 business days from dispatch.',
    time: '4–9 business days total',
  },
];

export function OrderingMakhanaOnline() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const toggleFaq = (id: string) => setOpenFaq(prev => (prev === id ? null : id));

  const packSizes: [string, string, string][] = [
    ['Premium 100g', '/products/makhana?sku=premium-100g', '₹160'],
    ['Premium 200g', '/products/makhana?sku=premium-200g', '₹310'],
    ['Premium 250g', '/products/makhana?sku=premium-250g', '₹380'],
    ['Normal 100g',  '/products/makhana?sku=normal-100g',  '₹120'],
    ['Normal 200g',  '/products/makhana?sku=normal-200g',  '₹230'],
    ['Normal 250g',  '/products/makhana?sku=normal-250g',  '₹280'],
  ];

  const relatedArticles = [
    { to: '/learn/how-to-choose-good-quality-makhana', label: "How to Choose Good-Quality Makhana" },
    { to: '/learn/makhana-benefits-health',            label: "Makhana Benefits: 7 Reasons to Eat Fox Nuts Daily" },
    { to: '/learn/how-to-store-makhana',               label: "How to Store Makhana to Keep It Crisp" },
    { to: '/learn/makhana-pack-size-guide',            label: "Makhana Pack Size Guide: 100g, 200g or 250g?" },
  ];

  return (
    <div className="min-h-screen bg-[#FCFAF5]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E8DECB] px-6 py-3">
        <div className="max-w-[960px] mx-auto flex items-center gap-2 text-xs text-[#68756E]">
          <Link to="/" className="hover:text-[#123B2A]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/categories" className="hover:text-[#123B2A]">Guides</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#123B2A] font-semibold">Ordering Makhana Online</span>
        </div>
      </div>

      <div className="max-w-[960px] mx-auto px-6 py-10 lg:grid lg:grid-cols-[1fr_280px] lg:gap-10">
        {/* ── Main Article ── */}
        <article className="space-y-10">
          {/* Hero */}
          <header className="space-y-4">
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#092218] leading-tight">
              Ordering Makhana Online in India: Shipping, Freshness & What to Expect
            </h1>
            <p className="text-base text-[#68756E] leading-relaxed">
              Buying makhana (fox nuts) online is straightforward when you know what to look for.
              This guide covers shipping timelines, how freshness is protected during transit,
              FSSAI food safety compliance, and what to do if your order arrives damaged.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/products/makhana"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218] transition-colors"
              >
                <span>Shop All Makhana Packs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/faq"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#123B2A] text-[#123B2A] text-xs font-bold uppercase tracking-wider hover:bg-[#F0EBE0] transition-colors"
              >
                View Full FAQ
              </Link>
            </div>
          </header>

          {/* Section 1: Order-to-Delivery Timeline */}
          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-[#092218]">
              Order-to-Delivery Timeline
            </h2>
            <p className="text-sm text-[#68756E] leading-relaxed">
              From the moment you place your order to the day it arrives at your door, here's exactly what happens:
            </p>
            <div className="space-y-4">
              {TIMELINE_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-4 bg-white rounded-xl border border-[#E8DECB] p-4">
                  <div className="w-9 h-9 rounded-full bg-[#F0EBE0] flex items-center justify-center shrink-0">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="font-bold text-sm text-[#092218]">{step.title}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C6A15B] bg-[#FBF5E8] px-2 py-0.5 rounded-full">
                        {step.time}
                      </span>
                    </div>
                    <p className="text-xs text-[#68756E] mt-1 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Freshness in Transit */}
          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-[#092218]">
              How Freshness Is Protected During Transit
            </h2>
            <div className="bg-white rounded-xl border border-[#E8DECB] p-5 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#123B2A] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-[#092218]">Multi-layer moisture-barrier pouch</p>
                  <p className="text-xs text-[#68756E] leading-relaxed mt-1">
                    Each pack is sealed in a food-grade zipper pouch with a multi-layer moisture barrier that protects the makhana from ambient humidity throughout storage and courier transit. The pouch maintains the crisp snap of the kernels even during 5–7 day shipping windows.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#123B2A] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-[#092218]">Short farm-to-dispatch timelines</p>
                  <p className="text-xs text-[#68756E] leading-relaxed mt-1">
                    NYUTAELITE MAKHANA sources directly from Bihar harvesting communities in Mithila. By eliminating intermediary warehouse stages, the time between popping and packing is minimised, resulting in fresher makhana reaching you compared to supermarket inventory cycles.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-[#123B2A] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-[#092218]">Outer packaging protection</p>
                  <p className="text-xs text-[#68756E] leading-relaxed mt-1">
                    Packs are placed in rigid outer boxes or padded mailers to prevent crushing during courier handling. Best-before dates are printed on every pouch for full transparency.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: FSSAI Compliance */}
          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-[#092218]">
              Food Safety: FSSAI Registration
            </h2>
            <div className="bg-[#F0EBE0] rounded-xl border border-[#C6A15B]/40 p-5 flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-[#C6A15B] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-[#092218]">FSSAI Registration No. 20426021000494</p>
                <p className="text-xs text-[#68756E] leading-relaxed mt-2">
                  NYUTAELITE MAKHANA operates under a valid Food Safety and Standards Authority of India (FSSAI) registration. This means our processing and packaging practices comply with Indian food safety and hygiene regulations. The registration number is printed on every pack for your reference.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Damage Policy */}
          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-[#092218]">
              48-Hour Delivery Damage Guarantee
            </h2>
            <div className="bg-white rounded-xl border border-[#E8DECB] p-5 space-y-3">
              <p className="text-sm text-[#68756E] leading-relaxed">
                If your order arrives visibly damaged (crushed packaging, broken seals, or compromised product quality), we offer a full replacement at no additional cost.
              </p>
              <div className="space-y-2">
                {[
                  'Photograph the outer packaging before opening',
                  'Photograph the product inside',
                  'Contact us within 48 hours of delivery',
                  'We arrange a replacement — no questions asked',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#123B2A] text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                    <p className="text-xs text-[#68756E]">{step}</p>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-[#E8DECB] flex flex-wrap gap-4">
                <a href="tel:+918102875852" className="inline-flex items-center gap-2 text-xs font-bold text-[#123B2A] hover:underline">
                  <Phone className="w-3.5 h-3.5" />
                  +91 8102875852
                </a>
                <a href="mailto:info@nyutaelite.com" className="inline-flex items-center gap-2 text-xs font-bold text-[#123B2A] hover:underline">
                  <Mail className="w-3.5 h-3.5" />
                  info@nyutaelite.com
                </a>
              </div>
            </div>
          </section>

          {/* Section 5: Bulk Orders */}
          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-[#092218]">
              Bulk & Wholesale Orders
            </h2>
            <div className="bg-white rounded-xl border border-[#E8DECB] p-5 space-y-3">
              <p className="text-sm text-[#68756E] leading-relaxed">
                For larger quantities beyond our standard 250g retail packs — whether for restaurant use, corporate gifting, or retail distribution — we offer Grade 4, 5, 5.5, and 6 Suta wholesale packs.
              </p>
              <Link
                to="/bulk-order/qualities"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218] transition-colors"
              >
                View Bulk Order Options
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-[#092218]">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {ORDERING_FAQS.map(faq => (
                <div key={faq.id} className="bg-white rounded-xl border border-[#E8DECB] overflow-hidden">
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                    aria-expanded={openFaq === faq.id}
                  >
                    <span className="font-bold text-sm text-[#092218] leading-snug">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#68756E] shrink-0 transition-transform duration-200 ${openFaq === faq.id ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openFaq === faq.id && (
                    <div className="px-5 pb-4 text-xs text-[#68756E] leading-relaxed border-t border-[#E8DECB] pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Contact CTA */}
          <section className="bg-[#123B2A] rounded-2xl p-6 text-white space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#C6A15B]" />
              <h2 className="font-serif text-xl font-bold">Still Have Questions?</h2>
            </div>
            <p className="text-sm text-[#D5DED6] leading-relaxed">
              Our customer support team is available to help with any queries about your order, delivery, or product.
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C6A15B] text-[#092218] text-xs font-bold uppercase tracking-wider hover:bg-[#b5924d] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Contact Us
              </Link>
              <Link
                to="/faq"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#C6A15B]/50 text-white text-xs font-bold uppercase tracking-wider hover:border-[#C6A15B] transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                View Full FAQ
              </Link>
            </div>
          </section>
        </article>

        {/* ── Sidebar ── */}
        <aside className="hidden lg:block space-y-6 mt-1">
          {/* Pack Sizes */}
          <div className="bg-[#123B2A] rounded-2xl p-5 text-white space-y-4">
            <h3 className="font-serif text-base font-bold text-[#C6A15B]">Shop Makhana Packs</h3>
            <div className="space-y-2">
              {packSizes.map(([label, href, price]) => (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center justify-between bg-[#1A4D38] rounded-xl px-3 py-2.5 hover:bg-[#092218] transition-colors group"
                >
                  <span className="text-xs font-bold text-[#D5DED6] group-hover:text-white">{label}</span>
                  <span className="text-xs font-bold text-[#C6A15B]">{price}</span>
                </Link>
              ))}
            </div>
            <Link
              to="/categories"
              className="block text-center text-[10px] font-bold uppercase tracking-wider text-[#C6A15B] hover:underline pt-1"
            >
              View All Packs →
            </Link>
          </div>

          {/* Related Articles */}
          <div className="bg-white rounded-2xl border border-[#E8DECB] p-5 space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#092218] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#C6A15B]" />
              Related Guides
            </h3>
            <div className="space-y-2">
              {relatedArticles.map(art => (
                <Link
                  key={art.to}
                  to={art.to}
                  className="block text-xs font-semibold text-[#123B2A] hover:underline leading-snug"
                >
                  {art.label} →
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Contact */}
          <div className="bg-[#F0EBE0] rounded-2xl border border-[#C6A15B]/30 p-5 space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#092218]">Customer Support</h3>
            <div className="space-y-2">
              <a href="tel:+918102875852" className="flex items-center gap-2 text-xs font-semibold text-[#123B2A] hover:underline">
                <Phone className="w-3.5 h-3.5 text-[#C6A15B]" />
                +91 8102875852
              </a>
              <a href="mailto:info@nyutaelite.com" className="flex items-center gap-2 text-xs font-semibold text-[#123B2A] hover:underline">
                <Mail className="w-3.5 h-3.5 text-[#C6A15B]" />
                info@nyutaelite.com
              </a>
            </div>
            <p className="text-[10px] text-[#68756E]">Damage claims: within 48 hrs of delivery</p>
          </div>

          {/* Alert */}
          <div className="bg-white rounded-2xl border border-[#E8DECB] p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#68756E] leading-relaxed">
              FSSAI Reg. No. 20426021000494. All packs carry a printed best-before date.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
