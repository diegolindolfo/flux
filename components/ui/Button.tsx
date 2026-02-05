import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button: React.FC<ButtonProps> = ({ className = '', children, ...props }) => {
  return (
    <button 
      className={`inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};