import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E6DFD3] flex flex-col items-start transition-all hover:shadow-md hover:border-[#00C950]/40 group">
      <div className="w-12 h-12 rounded-full bg-[#00C950]/10 text-[#00C950] flex items-center justify-center mb-5 shrink-0 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[#1C2520] mb-2">{title}</h3>
      <p className="text-sm text-[#5E6C65] leading-relaxed">{description}</p>
    </div>
  );
};
