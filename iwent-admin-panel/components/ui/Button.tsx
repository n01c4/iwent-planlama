import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center font-bold tracking-wide transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-[1px]";
  
  // High Contrast Variants
  const variants = {
    primary: "bg-white text-black hover:bg-brand-300 border border-transparent", 
    secondary: "bg-brand-800 text-white border border-brand-700 hover:bg-brand-700 hover:border-brand-500",
    danger: "bg-danger-500 text-white hover:bg-red-600 border border-transparent",
    ghost: "text-brand-300 hover:text-white hover:bg-brand-800",
    outline: "border-2 border-brand-700 text-white hover:border-white hover:bg-brand-900",
  };

  const sizes = {
    sm: "px-3 py-1 text-xs rounded-sm",
    md: "px-5 py-2 text-sm rounded-sm",
    lg: "px-8 py-3 text-base rounded-sm",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin mr-2 h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>
      ) : null}
      {children}
    </button>
  );
};