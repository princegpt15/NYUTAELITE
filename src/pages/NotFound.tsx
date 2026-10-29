// src/pages/NotFound.tsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { applySeoToDocument } from '../utils/seo';

export const NotFound: React.FC = () => {
  useEffect(() => {
    applySeoToDocument({
      title: 'Page Not Found (404) | NYUTA ELITE MAKHANA',
      description: 'The requested page could not be found on NYUTA ELITE MAKHANA.',
      canonicalUrl: '',
      robots: 'noindex, nofollow',
      ogType: 'website',
      ogTitle: 'Page Not Found (404) | NYUTA ELITE MAKHANA',
      ogDescription: 'The requested page could not be found on NYUTA ELITE MAKHANA.',
      ogImage: 'https://nyutaelite.com/nyuta-elite-logo.webp',
      ogUrl: '',
      ogSiteName: 'NYUTA ELITE MAKHANA',
      twitterCard: 'summary_large_image',
      twitterTitle: 'Page Not Found (404) | NYUTA ELITE MAKHANA',
      twitterDescription: 'The requested page could not be found on NYUTA ELITE MAKHANA.',
      twitterImage: 'https://nyutaelite.com/nyuta-elite-logo.webp',
      jsonLd: [],
    });
  }, []);

  return (
    <div className="bg-[#FCFAF5] min-h-[60vh] flex items-center justify-center py-20 px-6">
      <div className="max-w-md mx-auto text-center space-y-6">
        <span className="inline-block px-3 py-1 bg-[#123B2A]/10 text-[#123B2A] text-xs font-extrabold uppercase tracking-widest rounded-full">
          404 Error
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#092218]">
          Page Not Found
        </h1>
        <p className="text-sm text-[#68756E] leading-relaxed">
          The makhana page or resource you are looking for does not exist or has been moved.
        </p>
        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#123B2A] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#092218] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 border border-[#123B2A] text-[#123B2A] bg-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#FAF7EF] transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Shop Makhana</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
