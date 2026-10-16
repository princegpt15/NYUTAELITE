import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowRight, Check, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react';

import thumb1 from '../assets/images/thumb-1.png';
import thumb2 from '../assets/images/thumb-2.png';
import thumb3 from '../assets/images/thumb-3.png';
import thumb4 from '../assets/images/thumb-4.png';

interface MakhanaGrade {
  id: string;
  name: string;
  description: string;
  image: string;
}

const GRADES: MakhanaGrade[] = [
  {
    id: '4-sutta',
    name: '4 Sutta Makhana',
    description: 'Classic texture, suitable for everyday use.',
    image: thumb1,
  },
  {
    id: '5-sutta',
    name: '5 Sutta Makhana',
    description: 'Slightly larger kernels, premium texture.',
    image: thumb2,
  },
  {
    id: '5.5-sutta',
    name: '5.5 Sutta Makhana',
    description: 'Enhanced size for premium snack mixes.',
    image: thumb3,
  },
  {
    id: '6-sutta',
    name: '6 Sutta Makhana',
    description: 'Largest, jumbo quality for deluxe presentations.',
    image: thumb4,
  },
];

export const BulkOrderQualities: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve grade from navigation state or sessionStorage
  const navGrade = (location.state as { grade?: string })?.grade;
  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    if (navGrade) return navGrade;
    try {
      return sessionStorage.getItem('nyuta_selected_grade') || '';
    } catch {
      return '';
    }
  });

  // Sync if location.state changes
  useEffect(() => {
    if (navGrade) {
      setSelectedGrade(navGrade);
      try {
        sessionStorage.setItem('nyuta_selected_grade', navGrade);
      } catch {
        // ignore
      }
    }
  }, [navGrade]);

  const handleSelect = (gradeName: string) => {
    setSelectedGrade(gradeName);
    try {
      sessionStorage.setItem('nyuta_selected_grade', gradeName);
    } catch {
      // ignore
    }
  };

  const handleContinue = () => {
    if (!selectedGrade) return;
    navigate('/bulk-order/enquiry', { state: { grade: selectedGrade } });
  };

  return (
    <div className="bg-[#F7F4E8] min-h-screen text-[#123D2D] py-6 sm:py-10 lg:py-14">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs font-bold uppercase tracking-wider text-[#68756E]">
          <ol className="flex items-center gap-2">
            <li>
              <Link to="/" className="hover:text-[#123D2D] transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link to="/bulk-order/qualities" className="text-[#123D2D] font-extrabold">
                Bulk Order
              </Link>
            </li>
            <li>/</li>
            <li className="text-[#C9A65B] font-extrabold" aria-current="page">
              Explore Qualities
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#123D2D] text-[#C9A65B] border border-[#C9A65B]/40 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A65B]" />
            <span>MITHILA ORIGIN • HAND-SORTED GRADES</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#123D2D]">
            EXPLORE OUR MAKHANA QUALITIES
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-[#4A5D53] leading-relaxed max-w-2xl mx-auto">
            Discover our carefully selected makhana grades and choose the right quality for your bulk requirements.
          </p>
        </div>

        {/* 4 Quality Cards Grid: 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6">
          {GRADES.map((grade) => {
            const isSelected = selectedGrade === grade.name;

            return (
              <div
                key={grade.id}
                data-testid={`quality-card-${grade.id}`}
                onClick={() => handleSelect(grade.name)}
                className={`relative flex flex-col justify-between rounded-2xl bg-white border transition-all duration-200 cursor-pointer overflow-hidden shadow-xs hover:shadow-md ${
                  isSelected
                    ? 'border-[#C9A65B] ring-2 ring-[#C9A65B] shadow-lg -translate-y-0.5'
                    : 'border-[#E8DECB] hover:border-[#C9A65B]/60'
                }`}
              >
                {/* Visual Status Indicator */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 bg-[#123D2D] text-[#C9A65B] border border-[#C9A65B] px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                      <Check className="w-3 h-3 text-[#C9A65B]" />
                      <span>SELECTED</span>
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-[#D5DED6] bg-white/90 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-transparent" />
                    </span>
                  )}
                </div>

                {/* Card Top: Image */}
                <div className="relative aspect-[4/3] w-full bg-[#FCFAF5] overflow-hidden border-b border-[#E8DECB]/60">
                  <img
                    src={grade.image}
                    alt={grade.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 left-2 bg-[#123D2D]/85 text-[#F7F4E8] text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs">
                    Grade Visual
                  </div>
                </div>

                {/* Card Middle: Content */}
                <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h2 className="font-serif text-sm sm:text-base lg:text-lg font-bold text-[#123D2D] leading-snug">
                      {grade.name}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-[#68756E] leading-relaxed line-clamp-3">
                      {grade.description}
                    </p>
                  </div>

                  {/* Card Action Button */}
                  <button
                    type="button"
                    data-testid={`select-grade-${grade.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(grade.name);
                    }}
                    className={`w-full min-h-10 sm:min-h-11 rounded-xl text-[11px] sm:text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#123D2D] text-[#C9A65B] border border-[#C9A65B]'
                        : 'bg-[#123D2D] hover:bg-[#092218] text-[#F7F4E8]'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#C9A65B]" />
                        <span>SELECTED</span>
                      </>
                    ) : (
                      <>
                        <span>SELECT QUALITY</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#C9A65B]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Sticky/Floating Continuation Banner */}
        <div className="bg-white rounded-2xl border border-[#E8DECB] p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-[#F7F4E8] text-[#123D2D] border border-[#C9A65B]/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#123D2D]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#123D2D]">
                {selectedGrade ? (
                  <span>
                    Selected Quality: <strong className="text-[#C9A65B] font-extrabold">{selectedGrade}</strong>
                  </span>
                ) : (
                  <span className="text-[#68756E]">Please choose a makhana grade above to proceed</span>
                )}
              </p>
              <p className="text-[11px] text-[#68756E]">
                Direct Bihar pond procurement • Wholesale tiered rates • Pan-India freight dispatch
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedGrade}
            className="w-full sm:w-auto min-h-12 px-8 bg-[#C9A65B] hover:bg-[#b89549] active:bg-[#a6843c] text-[#123D2D] font-extrabold rounded-xl text-xs sm:text-sm uppercase tracking-widest transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>CONTINUE TO ENQUIRY</span>
            <ChevronRight className="w-4 h-4 text-[#123D2D]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkOrderQualities;
