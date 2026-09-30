import React from 'react';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  rating: number;
  quote: string;
  name: string;
  role: string;
  company: string;
  location?: string;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  rating,
  quote,
  name,
  role,
  company,
  location,
}) => {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E6DFD3] flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md">
      <div>
        {/* Star Rating */}
        <div className="flex items-center gap-1 mb-4 text-[#D8A62A]" aria-label={`${rating} stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < rating ? 'fill-[#D8A62A] text-[#D8A62A]' : 'text-neutral-300'
              }`}
            />
          ))}
        </div>
        {/* Quote */}
        <p className="text-sm sm:text-base text-[#1C2520] leading-relaxed mb-6 italic">
          "{quote}"
        </p>
      </div>

      {/* Author Details */}
      <div className="pt-4 border-t border-[#E6DFD3]/60">
        <h4 className="text-sm font-bold text-[#1C2520]">{name}</h4>
        <p className="text-xs text-[#5E6C65] mt-0.5">
          {role}, {company}
          {location && ` · ${location}`}
        </p>
      </div>
    </div>
  );
};
