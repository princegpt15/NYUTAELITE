import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'gold' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  to,
  fullWidth = false,
  loading = false,
  children,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold uppercase tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const sizeStyles = {
    sm: 'text-[11px] px-3.5 py-2 rounded-lg gap-1.5 min-h-9',
    md: 'text-xs px-5 py-3 rounded-xl gap-2 min-h-11',
    lg: 'text-xs sm:text-sm px-7 py-3.5 rounded-xl gap-2.5 min-h-12 tracking-widest',
  };

  const variantStyles = {
    primary:
      'bg-[#123B2A] hover:bg-[#092218] active:bg-black text-white border border-transparent shadow-xs focus-visible:ring-[#123B2A]',
    secondary:
      'bg-[#F7F1E5] hover:bg-[#E8DECB] active:bg-[#D8CEBA] text-[#123B2A] border border-[#E8DECB] shadow-2xs focus-visible:ring-[#123B2A]',
    outline:
      'bg-white hover:bg-[#F7F1E5] active:bg-[#E8DECB] text-[#123B2A] border border-[#123B2A] shadow-2xs focus-visible:ring-[#123B2A]',
    gold:
      'bg-[#C6A15B] hover:bg-[#D8B168] active:bg-[#B38D48] text-[#092218] border border-transparent shadow-sm focus-visible:ring-[#C6A15B]',
    ghost:
      'bg-transparent hover:bg-[#F7F1E5] text-[#1C1C1C] hover:text-[#123B2A] border-transparent focus-visible:ring-[#123B2A]',
    danger:
      'bg-red-600 hover:bg-red-700 text-white border border-transparent shadow-xs focus-visible:ring-red-500',
  };

  const classes = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
    fullWidth ? 'w-full' : ''
  } ${className}`;

  const content = (
    <>
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </>
  );

  if (to && !disabled && !loading) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
};
