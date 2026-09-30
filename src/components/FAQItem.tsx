import React from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const FAQItem: React.FC<FAQItemProps> = ({
  question,
  answer,
  isOpen,
  onToggle,
}) => {
  return (
    <div className="border border-[#E6DFD3] rounded-xl bg-white overflow-hidden transition-colors shadow-2xs">
      <button
        type="button"
        onClick={onToggle}
        className="w-full py-4 px-5 sm:px-6 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C950]"
        aria-expanded={isOpen}
      >
        <span className="text-sm sm:text-base font-semibold text-[#1C2520]">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-[#5E6C65] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#00C950]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-[#5E6C65] leading-relaxed border-t border-[#F0EBE1] animate-in fade-in duration-150">
          {answer}
        </div>
      )}
    </div>
  );
};
