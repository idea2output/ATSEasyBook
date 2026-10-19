import React from 'react';

interface AtsLogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const AtsLogo: React.FC<AtsLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showSubtitle = false,
  className = '',
}) => {
  const isDark = variant === 'dark'; // Dark theme: for black / dark background

  const sizeMap = {
    sm: { height: 26, fontSize: 16, badgeSize: 'text-[9px] px-1.5 py-0.5', crosshairSize: 12 },
    md: { height: 34, fontSize: 20, badgeSize: 'text-[11px] px-2 py-0.5', crosshairSize: 15 },
    lg: { height: 44, fontSize: 26, badgeSize: 'text-xs px-2.5 py-1', crosshairSize: 18 },
    xl: { height: 56, fontSize: 34, badgeSize: 'text-sm px-3 py-1.5', crosshairSize: 22 },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center space-x-2.5 select-none ${className}`}>
      {/* Precision Prepress Registration Icon */}
      <svg
        width={currentSize.crosshairSize * 1.6}
        height={currentSize.crosshairSize * 1.6}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Outer Registration Ring */}
        <circle
          cx="16"
          cy="16"
          r="12"
          stroke={isDark ? '#FFFFFF' : '#0F172A'}
          strokeWidth="1.75"
          strokeOpacity="0.85"
        />
        {/* Inner Target Ring */}
        <circle
          cx="16"
          cy="16"
          r="6"
          stroke="#E11D48"
          strokeWidth="1.75"
        />
        {/* Precision Crosshair Lines */}
        <line
          x1="16"
          y1="2"
          x2="16"
          y2="30"
          stroke={isDark ? '#FFFFFF' : '#0F172A'}
          strokeWidth="1.5"
          strokeOpacity="0.85"
        />
        <line
          x1="2"
          y1="16"
          x2="30"
          y2="16"
          stroke={isDark ? '#FFFFFF' : '#0F172A'}
          strokeWidth="1.5"
          strokeOpacity="0.85"
        />
        {/* Center Registration Core Point */}
        <circle cx="16" cy="16" r="2.25" fill="#E11D48" />
      </svg>

      {/* Typography: ATS TECH */}
      <div className="flex flex-col">
        <div className="flex items-center space-x-1.5">
          <span
            className={`font-black tracking-tighter leading-none ${
              isDark ? 'text-white' : 'text-slate-950'
            }`}
            style={{ fontSize: `${currentSize.fontSize}px` }}
          >
            ATS
          </span>
          <span
            className={`font-black tracking-wider uppercase rounded font-mono ${currentSize.badgeSize} bg-rose-600 text-white shadow-xs`}
          >
            TECH
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`text-[9px] uppercase tracking-widest font-semibold mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Print & Publishing Systems
          </span>
        )}
      </div>
    </div>
  );
};
