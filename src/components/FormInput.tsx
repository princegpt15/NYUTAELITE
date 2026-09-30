import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  isPassword?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  helperText,
  error,
  isPassword = false,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5 w-full">
      <label htmlFor={inputId} className="block text-xs sm:text-sm font-semibold text-[#1C2520]">
        {label}
      </label>

      <div className="relative">
        <input
          id={inputId}
          type={resolvedType}
          className={`w-full px-4 py-2.5 sm:py-3 rounded-xl border text-sm text-[#1C2520] placeholder-[#9EAAA4] bg-white transition-colors focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
              : 'border-[#E6DFD3] focus:border-[#00C950] focus:ring-[#00C950]/20'
          } ${isPassword ? 'pr-11' : ''} ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#85948E] hover:text-[#1C2520] p-1 focus:outline-none cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {helperText && !error && (
        <p className="text-[11px] sm:text-xs text-[#5E6C65]">{helperText}</p>
      )}

      {error && (
        <p className="text-[11px] sm:text-xs text-red-500 font-medium animate-in fade-in duration-100">
          {error}
        </p>
      )}
    </div>
  );
};
