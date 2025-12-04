import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'dark' }) => {
  const color = variant === 'light' ? 'text-white' : 'text-brand-900';
  const iconColor = variant === 'light' ? 'text-brand-300' : 'text-brand-600';

  return (
    <div className={`flex items-center gap-2 font-bold text-2xl tracking-tight ${color} ${className}`}>
      <div className={`relative flex items-center justify-center w-8 h-8 rounded-lg bg-current opacity-10`}>
         {/* Background opacity layer */}
      </div>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={`w-8 h-8 absolute ${iconColor}`}
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
      <span>Vissito</span>
    </div>
  );
};