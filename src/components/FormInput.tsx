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
  const inputId = id || `input-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5 w-full">
      <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C]">
        {label}
      </label>

      <div className="relative">
        <input
          id={inputId}
          type={resolvedType}
          className={`w-full px-3.5 py-3 rounded-xl border text-xs sm:text-sm text-[#1C1C1C] placeholder-[#68756E]/60 bg-white transition-all focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
              : 'border-[#E8DECB] focus:border-[#123B2A] focus:ring-[#123B2A]/15'
          } ${isPassword ? 'pr-11' : ''} ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68756E] hover:text-[#123B2A] p-1 focus:outline-none cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {helperText && !error && (
        <p className="text-[11px] text-[#68756E]">{helperText}</p>
      )}

      {error && (
        <p className="text-[11px] text-red-600 font-semibold animate-in fade-in duration-100">
          {error}
        </p>
      )}
    </div>
  );
};
