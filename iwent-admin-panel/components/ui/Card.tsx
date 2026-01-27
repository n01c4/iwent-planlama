import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-brand-900 border border-brand-700 transition-all hover:border-brand-500/50 ${className}`}
      style={{ borderRadius: '4px' }} // Sharper corners for high contrast feel
    >
      {children}
    </div>
  );
};