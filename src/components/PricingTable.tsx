import React from 'react';
import type { PricingTier } from '../types';

interface PricingTableProps {
  tiers: PricingTier[];
  selectedQuantity: number;
}

export const PricingTable: React.FC<PricingTableProps> = ({ tiers, selectedQuantity }) => {
  return (
    <div className="rounded-xl border border-[#E6DFD3] overflow-hidden bg-white shadow-xs">
      <div className="divide-y divide-[#E6DFD3]">
        {tiers.map((tier) => {
          const isSelected =
            (tier.max === null && selectedQuantity >= tier.min) ||
            (tier.max !== null && selectedQuantity >= tier.min && selectedQuantity <= tier.max);

          return (
            <div
              key={tier.label}
              className={`flex items-center justify-between px-4 py-3 transition-colors ${
                isSelected
                  ? 'bg-[#F7F2E8] border-l-4 border-l-[#00C950]'
                  : 'hover:bg-neutral-50 border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-sm font-medium ${
                    isSelected ? 'text-[#173F35] font-semibold' : 'text-[#1C2520]'
                  }`}
                >
                  {tier.label}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#00C950]/15 text-[#173F35] px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                )}
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-bold ${
                    isSelected ? 'text-[#173F35]' : 'text-[#1C2520]'
                  }`}
                >
                  ₹{tier.pricePerKg}
                </span>
                <span className="text-xs text-[#5E6C65]">/kg</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
