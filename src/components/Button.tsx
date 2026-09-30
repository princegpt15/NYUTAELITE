import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'dark' | 'gold-outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  to,
  fullWidth = false,
  children,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 rounded-md gap-1.5',
    md: 'text-sm px-5 py-2.5 rounded-lg gap-2',
    lg: 'text-base px-6 py-3 rounded-lg gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#00C950] hover:bg-[#00b347] text-white border border-transparent shadow-sm focus:ring-[#00C950]',
    secondary:
      'bg-[#173F35] hover:bg-[#112F28] text-white border border-transparent shadow-sm focus:ring-[#173F35]',
    outline:
      'bg-transparent hover:bg-[#00C950]/10 text-[#00C950] border border-[#00C950] focus:ring-[#00C950]',
    dark:
      'bg-[#1C2520] hover:bg-black text-white border border-transparent shadow-sm focus:ring-[#1C2520]',
    'gold-outline':
      'bg-transparent hover:bg-[#C89B3C]/10 text-[#C89B3C] border border-[#C89B3C] focus:ring-[#C89B3C]',
    danger:
      'bg-red-600 hover:bg-red-700 text-white border border-transparent shadow-sm focus:ring-red-500',
  };

  const classes = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
    fullWidth ? 'w-full' : ''
  } ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes}>
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
