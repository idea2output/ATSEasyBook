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
  const isDark = variant === 'dark';

  const heightClasses = {
    sm: 'h-7 sm:h-8',
    md: 'h-9 sm:h-11',
    lg: 'h-12 sm:h-14',
    xl: 'h-16 sm:h-20',
  };

  const logoSrc = isDark ? '/brand/ats-tech-logo-dark.png' : '/brand/ats-tech-logo-light.jpg';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* Exact uploaded ATS Tech Logo - Not regenerated */}
      <img
        src={logoSrc}
        alt="ATS Tech | Make Life Easy"
        className={`${heightClasses[size]} w-auto object-contain transition-transform`}
        loading="eager"
      />
    </div>
  );
};
