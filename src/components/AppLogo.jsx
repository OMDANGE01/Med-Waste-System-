import React from 'react';

/**
 * AppLogo Component
 * Renders the official MedWaste Guard emblem featuring:
 * - Biohazard containment trefoil arcs
 * - Medical cross intersection
 * - Protective security shield contour
 * - IoT telemetry waves and regulatory status node
 */
export default function AppLogo({ 
  size = 'md', 
  className = '', 
  showTelemetryPulse = false,
  withBadge = true,
  withGlow = false 
}) {
  const containerSizes = {
    xs: 'w-7 h-7 rounded-lg p-1',
    sm: 'w-8 h-8 rounded-xl p-1',
    md: 'w-10 h-10 rounded-xl p-1.5',
    lg: 'w-14 h-14 rounded-2xl p-2',
    xl: 'w-20 h-20 rounded-2xl p-3',
  };

  const starSizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-9 h-9',
    xl: 'w-13 h-13',
  };

  const selectedContainer = containerSizes[size] || containerSizes.md;
  const selectedStar = starSizes[size] || starSizes.md;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {withGlow && (
        <div 
          className="absolute inset-0 bg-rose-500/20 dark:bg-rose-500/30 rounded-2xl blur-lg pointer-events-none transform -scale-95" 
          aria-hidden="true" 
        />
      )}
      
      {withBadge ? (
        <div className={`${selectedContainer} bg-[#ded9d2] dark:bg-[#e2ded7] flex items-center justify-center shadow-sm transition-transform duration-200 hover:scale-105 select-none`}>
          <img
            src="/logo.svg"
            alt="App Logo"
            referrerPolicy="no-referrer"
            className={`${selectedStar} object-contain`}
          />
        </div>
      ) : (
        <img
          src="/logo.svg"
          alt="App Logo"
          referrerPolicy="no-referrer"
          className={`${selectedStar} object-contain transition-transform duration-200 hover:scale-105 select-none`}
        />
      )}

      {showTelemetryPulse && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-900"></span>
        </span>
      )}
    </div>
  );
}
