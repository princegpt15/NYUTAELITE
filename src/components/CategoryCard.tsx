import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

type CategoryCardProps = {
  imageSrc: string;
  title: string;
  subtitle: string;
  href?: string;
  fit?: 'contain' | 'cover';
};

const CategoryCard: React.FC<CategoryCardProps> = ({
  imageSrc,
  title,
  subtitle,
  href = '#',
  fit = 'contain',
}) => {
  return (
    <Link to={href} className="group block w-full max-w-sm mx-auto h-full">
      <article className="h-full flex flex-col justify-between bg-white rounded-2xl p-3.5 sm:p-4 border border-[#E8E0D2] shadow-2xs hover:shadow-md hover:border-[#D6BC83] hover:-translate-y-0.5 transition-all duration-300">
        <div>
          <div className="relative aspect-square rounded-xl overflow-hidden bg-[#F7F3E9] border border-[#E8E0D2]/60 mb-3">
            <img
              src={imageSrc}
              alt={title}
              className={`w-full h-full object-center transition-transform duration-500 group-hover:scale-105 ${
                fit === 'cover' ? 'object-cover' : 'object-contain p-1.5 sm:p-2'
              }`}
              loading="lazy"
              width={200}
              height={200}
            />
          </div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-display text-sm sm:text-base font-bold text-[#123D2E] group-hover:text-[#D6BC83] transition-colors leading-snug">
              {title}
            </h3>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#8A968F] group-hover:text-[#123D2E] transition-colors shrink-0 mt-0.5" />
          </div>
          <p className="text-xs text-[#5C6760] font-normal mt-1 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </article>
    </Link>
  );
};

export default CategoryCard;
