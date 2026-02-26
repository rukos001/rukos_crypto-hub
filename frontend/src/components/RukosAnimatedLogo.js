import React from 'react';

/* ───────────────────────────────────────────────────────
   Golden wireframe isometric cube paths (reusable)
   Each cube: top diamond + left face + right face
   ─────────────────────────────────────────────────────── */
const CubePath = ({ cx, cy, size = 20, delay = 0, animate = false, className = '' }) => {
  const s = size;
  const h = s * 0.58;
  const top = `${cx},${cy - h} ${cx + s},${cy - h / 2} ${cx},${cy} ${cx - s},${cy - h / 2}`;
  const left = `${cx - s},${cy - h / 2} ${cx},${cy} ${cx},${cy + h} ${cx - s},${cy + h / 2}`;
  const right = `${cx},${cy} ${cx + s},${cy - h / 2} ${cx + s},${cy + h / 2} ${cx},${cy + h}`;

  const animStyle = animate ? {
    opacity: 0,
    animation: `cubeAppear 0.6s ease-out ${delay}s forwards`,
  } : {};

  return (
    <g className={className} style={animStyle}>
      <polygon points={top} fill="none" stroke="url(#goldGrad)" strokeWidth="1.8" strokeLinejoin="round" />
      <polygon points={left} fill="none" stroke="url(#goldGrad)" strokeWidth="1.8" strokeLinejoin="round" />
      <polygon points={right} fill="none" stroke="url(#goldGrad)" strokeWidth="1.8" strokeLinejoin="round" />
      {/* Inner glow */}
      <polygon points={top} fill="url(#goldGrad)" opacity="0.08" />
      <polygon points={right} fill="url(#goldGrad)" opacity="0.05" />
    </g>
  );
};

/* ── Animated full logo: 1 cube → 3 cubes + text ── */
export const RukosAnimatedLogo = ({ size = 200, className = '', animate = true }) => {
  const w = size * 2.4;
  const h = size * 1.1;
  const cubeSize = size * 0.18;
  const midY = h * 0.38;
  const midX = w / 2;
  const gap = cubeSize * 2.4;

  return (
    <div className={`inline-block ${className}`} data-testid="rukos-animated-logo">
      <style>{`
        @keyframes cubeAppear {
          0%   { opacity: 0; transform: scale(0.5) translateY(8px); }
          60%  { opacity: 1; transform: scale(1.05) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes textReveal {
          0%   { opacity: 0; letter-spacing: 12px; }
          100% { opacity: 1; letter-spacing: 4px; }
        }
        @keyframes lineGrow {
          0%   { stroke-dashoffset: 200; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes connectorGrow {
          0%   { opacity: 0; stroke-dashoffset: 30; }
          100% { opacity: 0.6; stroke-dashoffset: 0; }
        }
      `}</style>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#F7931A" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
          <linearGradient id="textGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F7931A" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#F7931A" />
          </linearGradient>
        </defs>

        {/* Left cube */}
        <CubePath cx={midX - gap} cy={midY} size={cubeSize} delay={animate ? 0.1 : 0} animate={animate} />

        {/* Connector left-center */}
        <line
          x1={midX - gap + cubeSize} y1={midY}
          x2={midX - cubeSize} y2={midY}
          stroke="url(#goldGrad)"
          strokeWidth="1.2"
          strokeDasharray="30"
          style={animate ? {
            opacity: 0,
            animation: 'connectorGrow 0.4s ease-out 0.5s forwards',
          } : { opacity: 0.6 }}
        />

        {/* Center cube */}
        <CubePath cx={midX} cy={midY} size={cubeSize} delay={animate ? 0 : 0} animate={animate} />

        {/* Connector center-right */}
        <line
          x1={midX + cubeSize} y1={midY}
          x2={midX + gap - cubeSize} y2={midY}
          stroke="url(#goldGrad)"
          strokeWidth="1.2"
          strokeDasharray="30"
          style={animate ? {
            opacity: 0,
            animation: 'connectorGrow 0.4s ease-out 0.6s forwards',
          } : { opacity: 0.6 }}
        />

        {/* Right cube */}
        <CubePath cx={midX + gap} cy={midY} size={cubeSize} delay={animate ? 0.2 : 0} animate={animate} />

        {/* Brand text */}
        <text
          x={midX}
          y={h * 0.78}
          textAnchor="middle"
          fill="url(#textGold)"
          fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
          fontWeight="700"
          fontSize={size * 0.115}
          letterSpacing="4"
          style={animate ? {
            opacity: 0,
            animation: 'textReveal 0.8s ease-out 0.7s forwards',
          } : {}}
        >
          RUKOS_CRYPTO | HUB
        </text>

        {/* Underline */}
        <line
          x1={midX - size * 0.7}
          y1={h * 0.86}
          x2={midX + size * 0.7}
          y2={h * 0.86}
          stroke="url(#goldGrad)"
          strokeWidth="1"
          strokeDasharray="200"
          style={animate ? {
            strokeDashoffset: 200,
            animation: 'lineGrow 0.6s ease-out 1.2s forwards',
          } : { strokeDashoffset: 0 }}
        />
      </svg>
    </div>
  );
};

/* ── Single cube icon (for sidebar, subtle branding) ── */
export const RukosCubeIcon = ({ size = 32, className = '', gold = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    data-testid="rukos-cube-icon"
  >
    {gold && (
      <defs>
        <linearGradient id="cubeGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#F7931A" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
      </defs>
    )}
    <g stroke={gold ? "url(#cubeGold)" : "currentColor"} strokeWidth="2" strokeLinejoin="round">
      <polygon points="6,16 20,8 34,16 20,24" fill="none" />
      <polygon points="6,16 20,24 20,38 6,30" fill="none" />
      <polygon points="20,24 34,16 34,30 20,38" fill="none" />
      {/* Top face subtle fill */}
      <polygon points="6,16 20,8 34,16 20,24" fill={gold ? "url(#cubeGold)" : "currentColor"} opacity="0.1" />
      <polygon points="20,24 34,16 34,30 20,38" fill={gold ? "url(#cubeGold)" : "currentColor"} opacity="0.06" />
    </g>
  </svg>
);

/* ── Sidebar logo: 3 cubes in a row + text (no animation, compact) ── */
export const RukosSidebarLogo = ({ collapsed = false, className = '' }) => {
  if (collapsed) {
    return <RukosCubeIcon size={32} className={className} />;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`} data-testid="rukos-sidebar-logo">
      <RukosCubeIcon size={28} />
      <div className="flex flex-col leading-none">
        <span className="text-[11px] font-bold tracking-[3px] text-transparent bg-clip-text bg-gradient-to-r from-[#F7931A] to-[#FFD700]">
          RUKOS_CRYPTO
        </span>
        <span className="text-[9px] font-medium tracking-[5px] text-white/40 mt-0.5">
          HUB
        </span>
      </div>
    </div>
  );
};
