import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onChange,
  min = 1,
  max = 10,
  className = '',
  size = 'md',
}) => {
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  };

  const buttonSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`inline-flex items-center border border-[#E8DECB] rounded-xl bg-white shadow-2xs overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={quantity <= min}
        className={`flex items-center justify-center text-[#123B2A] hover:bg-[#F7F1E5] active:bg-[#E8DECB] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer ${buttonSizeClasses[size]}`}
        aria-label="Decrease quantity"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <span className="min-w-8 px-2 text-center font-extrabold text-[#1C1C1C] select-none">
        {quantity}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={quantity >= max}
        className={`flex items-center justify-center text-[#123B2A] hover:bg-[#F7F1E5] active:bg-[#E8DECB] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer ${buttonSizeClasses[size]}`}
        aria-label="Increase quantity"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
