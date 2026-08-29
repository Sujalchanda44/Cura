import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const dimensions = {
    sm: { svg: 'w-6 h-6', text: 'text-lg' },
    md: { svg: 'w-10 h-10', text: 'text-2xl' },
    lg: { svg: 'w-16 h-16', text: 'text-4xl' },
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG Icon: Medical Cross + Heart + AI Network Node */}
      <div className={`relative ${dimensions.svg} flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Ring / Glow */}
          <circle cx="50" cy="50" r="48" fill="url(#bgGradient)" fillOpacity="0.05" stroke="url(#borderGradient)" strokeWidth="1.5" />
          
          {/* AI Circuit Lines */}
          <path d="M50 15 L50 35 M50 65 L50 85 M15 50 L35 50 M65 50 L85 50" stroke="url(#accentGradient)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
          
          {/* Medical Cross (Centered and Rounded) */}
          <path
            d="M42 30 H58 V42 H70 V58 H58 V70 H42 V58 H30 V42 H42 Z"
            fill="url(#primaryGradient)"
            stroke="url(#accentGradient)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          
          {/* Integrated Circuit Heart Nodes */}
          <circle cx="50" cy="18" r="4" fill="#3B82F6" />
          <circle cx="50" cy="82" r="4" fill="#14B8A6" />
          <circle cx="18" cy="50" r="4" fill="#8B5CF6" />
          <circle cx="82" cy="50" r="4" fill="#3B82F6" />

          {/* Glowing Inner Core */}
          <circle cx="50" cy="50" r="6" fill="#FFFFFF" />

          {/* Gradients */}
          <defs>
            <linearGradient id="primaryGradient" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#14B8A6" />
            </linearGradient>
            <linearGradient id="accentGradient" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#2DD4BF" />
            </linearGradient>
            <linearGradient id="bgGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="borderGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <span className={`${dimensions.text} font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-teal-500 bg-clip-text text-transparent`}>
          Cura<span className="font-light text-blue-500">+</span>
        </span>
      )}
    </div>
  );
};
