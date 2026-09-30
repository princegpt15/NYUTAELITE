import React from 'react';
import { Minus, Plus, Info } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  minOrder?: number;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onChange,
  minOrder = 10,
}) => {
  const presets = [10, 25, 50, 100];
  const isPreset = presets.includes(quantity);

  const handleDecrement = () => {
    if (quantity > minOrder) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    onChange(quantity + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      onChange(Math.max(minOrder, val));
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1C2520]">Select Bulk Quantity</h3>
      </div>

      {/* Preset pills */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              quantity === preset
                ? 'bg-[#173F35] text-white shadow-sm'
                : 'bg-[#F7F2E8] text-[#1C2520] hover:bg-[#EBE4D5] border border-[#E6DFD3]'
            }`}
          >
            {preset} KG
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            if (isPreset) onChange(30);
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            !isPreset
              ? 'bg-[#173F35] text-white shadow-sm'
              : 'bg-[#F7F2E8] text-[#1C2520] hover:bg-[#EBE4D5] border border-[#E6DFD3]'
          }`}
        >
          Custom Quantity
        </button>
      </div>

      {/* Minimum Order Note */}
      <div className="flex items-center gap-1.5 text-xs text-[#5E6C65]">
        <Info className="w-3.5 h-3.5 text-[#00C950]" />
        <span>Minimum Order Quantity: {minOrder} KG</span>
      </div>

      {/* Stepper with KG label */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center border border-[#E6DFD3] rounded-lg bg-white overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= minOrder}
            className="p-2.5 text-[#1C2520] hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            min={minOrder}
            value={quantity}
            onChange={handleInputChange}
            className="w-16 text-center text-sm font-semibold text-[#1C2520] focus:outline-none border-x border-[#E6DFD3] py-2"
          />
          <button
            type="button"
            onClick={handleIncrement}
            className="p-2.5 text-[#1C2520] hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <span className="text-sm font-semibold text-[#5E6C65]">KG</span>
      </div>
    </div>
  );
};
