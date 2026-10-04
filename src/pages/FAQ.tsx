import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { FAQS } from '../data/faqs';

export const FAQ: React.FC = () => {
  const [activeFaqId, setActiveFaqId] = useState<string | null>('faq-1');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#FCFAF5] min-h-screen py-12 sm:py-20">
      <div className="max-w-[960px] mx-auto px-5 sm:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
            HELP &amp; INFORMATION
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#092218] mt-1 mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-[#68756E]">
            Everything you need to know about our Premium &amp; Normal makhana products, shipping, and returns.
          </p>
        </div>

        {/* Search Filter */}
        <div className="relative max-w-md mx-auto mb-10">
          <Search className="w-4 h-4 text-[#68756E] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g. premium, sizes, delivery)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8DECB] rounded-xl text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] shadow-xs"
          />
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E8DECB]">
              <p className="text-sm font-bold text-[#1C1C1C]">No matching questions found.</p>
              <p className="text-xs text-[#68756E] mt-1">Try clearing your search query.</p>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = activeFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-xl border border-[#E8DECB] overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaqId(isOpen ? null : faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#1C1C1C] hover:text-[#123B2A] cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#C6A15B] shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-[#68756E] leading-relaxed border-t border-[#E8DECB]/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
