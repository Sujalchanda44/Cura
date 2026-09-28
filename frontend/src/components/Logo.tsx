import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  textClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md', textClassName = '' }) => {
  const dimensions = {
    sm: { svg: 'w-6 h-6', text: 'text-lg' },
    md: { svg: 'w-9 h-9', text: 'text-2xl' },
    lg: { svg: 'w-14 h-14', text: 'text-4xl' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${dimensions.svg} rounded-xl bg-[#134E2F] flex items-center justify-center p-1.5 shadow-sm border border-[#18603B] shrink-0`}>
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Medical Cross + AI Node Core */}
          <path
            d="M16 6 H24 V16 H34 V24 H24 V34 H16 V24 H6 V16 H16 Z"
            fill="#C1F3BA"
          />
          <circle cx="20" cy="20" r="3" fill="#134E2F" />
          <circle cx="20" cy="9" r="1.5" fill="#134E2F" />
          <circle cx="20" cy="31" r="1.5" fill="#134E2F" />
          <circle cx="9" cy="20" r="1.5" fill="#134E2F" />
          <circle cx="31" cy="20" r="1.5" fill="#134E2F" />
        </svg>
      </div>
      {showText && (
        <span className={`${dimensions.text} font-black tracking-tight ${textClassName || 'text-slate-900'} flex items-center`}>
          Cura<span className="text-[#A2ECA0] ml-0.5 font-bold">+</span>
        </span>
      )}
    </div>
  );
};
