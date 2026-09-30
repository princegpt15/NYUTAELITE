import React from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-[#5E6C65] py-4">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center space-x-2">
              {index > 0 && <span className="text-[#C3BBB0]">/</span>}
              {isLast || !item.to ? (
                <span className="font-medium text-[#1C2520]">{item.label}</span>
              ) : (
                <Link to={item.to} className="hover:text-[#00C950] transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
