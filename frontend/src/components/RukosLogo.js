import React from 'react';

// Full logo with text: 3 connected cubes + RUKOS CRYPTO + underline
export const RukosLogo = ({ size = 32, className = '' }) => {
  const scale = size / 100;
  return (
    <div className={`inline-flex flex-col items-center ${className}`} data-testid="rukos-logo">
      <svg width={size * 2.5} height={size} viewBox="0 0 250 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Three connected blockchain cubes */}
        <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Left cube */}
          <polygon points="30,35 50,25 70,35 50,45" fill="none" />
          <polygon points="30,35 50,45 50,65 30,55" fill="none" />
          <polygon points="50,45 70,35 70,55 50,65" fill="none" />
          {/* Connector 1 */}
          <line x1="70" y1="45" x2="90" y2="45" />
          {/* Middle cube */}
          <polygon points="90,35 110,25 130,35 110,45" fill="none" />
          <polygon points="90,35 110,45 110,65 90,55" fill="none" />
          <polygon points="110,45 130,35 130,55 110,65" fill="none" />
          {/* Connector 2 */}
          <line x1="130" y1="45" x2="150" y2="45" />
          {/* Right cube */}
          <polygon points="150,35 170,25 190,35 170,45" fill="none" />
          <polygon points="150,35 170,45 170,65 150,55" fill="none" />
          <polygon points="170,45 190,35 190,55 170,65" fill="none" />
        </g>
        {/* Text */}
        <text x="110" y="84" textAnchor="middle" fill="currentColor" fontFamily="'Inter', system-ui, sans-serif" fontWeight="700" fontSize="14" letterSpacing="3">RUKOS CRYPTO</text>
        {/* Underline */}
        <line x1="45" y1="92" x2="175" y2="92" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

// Icon-only logo (single cube) - for watermarks and subtle placements
export const RukosIcon = ({ size = 24, className = '', opacity = 1 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 40 40" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ opacity }}
    data-testid="rukos-icon"
  >
    <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="8,16 20,9 32,16 20,23" fill="none" />
      <polygon points="8,16 20,23 20,35 8,28" fill="none" />
      <polygon points="20,23 32,16 32,28 20,35" fill="none" />
    </g>
  </svg>
);

// Watermark logo - very subtle, positioned absolutely
export const RukosWatermark = ({ position = 'bottom-right', size = 40 }) => {
  const posClass = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'center-right': 'top-1/2 -translate-y-1/2 right-4',
    'center-left': 'top-1/2 -translate-y-1/2 left-4',
  }[position] || 'bottom-4 right-4';

  return (
    <div className={`absolute ${posClass} pointer-events-none text-white/[0.03]`} data-testid="rukos-watermark">
      <RukosIcon size={size} opacity={1} />
    </div>
  );
};

// Logo button shape - cube-shaped button
export const RukosButton = ({ onClick, children, className = '', size = 36 }) => (
  <button
    onClick={onClick}
    className={`relative group transition-all duration-300 hover:scale-105 ${className}`}
    data-testid="rukos-button"
  >
    <div className="absolute inset-0 flex items-center justify-center text-[#F7931A]/20 group-hover:text-[#F7931A]/40 transition-colors">
      <RukosIcon size={size} />
    </div>
    <div className="relative z-10">{children}</div>
  </button>
);
