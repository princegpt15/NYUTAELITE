import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { FAQItem } from '../components/FAQItem';
import { FAQS } from '../data/faqs';

export const FAQ: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Orders & Pricing', 'Shipping & Delivery', 'Quality & Specifications', 'Billing & Compliance'];

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-12 lg:py-16">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest text-[#C89B3C] uppercase">
            HELP & KNOWLEDGE BASE
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1C2520] tracking-tight mt-1 mb-2">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-[#5E6C65]">
            Find quick answers regarding our makhana grading, bulk tiers, shipping logistics, and GST documentation.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="w-5 h-5 text-[#85948E] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions (e.g. minimum order, GST, delivery time)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#E6DFD3] bg-white text-sm text-[#1C2520] placeholder-[#85948E] focus:outline-none focus:border-[#00C950] shadow-2xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#173F35] text-white shadow-xs'
                  : 'bg-white text-[#5E6C65] hover:text-[#1C2520] border border-[#E6DFD3]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-3.5 mb-12">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <FAQItem
                key={faq.id}
                question={faq.question}
                answer={faq.answer}
                isOpen={openId === faq.id}
                onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
              />
            ))
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-[#E6DFD3] text-sm text-[#5E6C65]">
              No questions found matching "{searchTerm}".
            </div>
          )}
        </div>

        {/* Still have questions banner */}
        <div className="bg-[#173F35] text-white p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-bold">Have a specific bulk inquiry?</h3>
            <p className="text-xs sm:text-sm text-[#A5BDB5]">
              Our wholesale specialists can assist with test batch sampling, contracts, and export documentation.
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00C950] hover:bg-[#00b347] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all shrink-0"
          >
            <span>Contact Support</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
