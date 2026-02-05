import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  return (
    <div 
      className={`bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};