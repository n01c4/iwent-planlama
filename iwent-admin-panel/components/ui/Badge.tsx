import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
  const styles = {
    // Solid, high contrast backgrounds for easier reading
    success: "text-black bg-emerald-400 border-emerald-500 font-bold",
    warning: "text-black bg-amber-400 border-amber-500 font-bold",
    danger: "text-white bg-danger-500 border-red-600 font-bold",
    neutral: "text-white bg-brand-700 border-brand-600 font-medium",
    info: "text-white bg-blue-600 border-blue-500 font-bold",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-xs border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};