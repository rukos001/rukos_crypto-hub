import React, { useId } from 'react';

/* ── Golden wireframe isometric cube SVG paths ── */
const CubeFace = ({ cx, cy, size, gradId, delay, animate }) => {
  const s = size;
  const h = s * 0.58;
  const top = `${cx},${cy - h} ${cx + s},${cy - h / 2} ${cx},${cy} ${cx - s},${cy - h / 2}`;
  const left = `${cx - s},${cy - h / 2} ${cx},${cy} ${cx},${cy + h} ${cx - s},${cy + h / 2}`;
  const right = `${cx},${cy} ${cx + s},${cy - h / 2} ${cx + s},${cy + h / 2} ${cx},${cy + h}`;

  return (
    <g style={animate ? {
      opacity: 0,
      transformOrigin: `${cx}px ${cy}px`,
      animation: `rukos-cube-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s forwards`,
    } : {}}>
      <polygon points={top} fill={`url(#${gradId})`} fillOpacity="0.12" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinejoin="round" />
      <polygon points={left} fill="none" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinejoin="round" />
      <polygon points={right} fill={`url(#${gradId})`} fillOpacity="0.06" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinejoin="round" />
    </g>
  );
};

/* ─────────────────────────────────────────────────
   RukosAnimatedLogo
   3 golden wireframe cubes connected by lines
   with text "RUKOS_CRYPTO | HUB" below
   Animation: cubes appear one by one, then text reveals
   ───────────────────────────────────────────────── */
export const RukosAnimatedLogo = ({ width = 420, className = '', animate = true }) => {
  const uid = useId().replace(/:/g, '');
  const gId = `rg${uid}`;
  const tId = `tg${uid}`;

  const vw = 420;
  const vh = 180;
  const cubeS = 38;
  const cy = 65;
  const gap = 105;

  return (
    <div className={`inline-block ${className}`} data-testid="rukos-animated-logo">
      <style>{`
        @keyframes rukos-cube-in {
          0%   { opacity: 0; transform: scale(0.3); }
          70%  { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes rukos-text-in {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes rukos-line-in {
          0%   { stroke-dashoffset: 60; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 0.5; }
        }
        @keyframes rukos-underline {
          0%   { stroke-dashoffset: 260; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
      <svg
        width={width}
        height={width * (vh / vw)}
        viewBox={`0 0 ${vw} ${vh}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#F7931A" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
          <linearGradient id={tId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F7931A" />
            <stop offset="40%" stopColor="#FFD700" />
            <stop offset="60%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#F7931A" />
          </linearGradient>
        </defs>

        {/* Left cube */}
        <CubeFace cx={vw / 2 - gap} cy={cy} size={cubeS} gradId={gId} delay={animate ? 0.15 : 0} animate={animate} />

        {/* Connector: left → center */}
        <line
          x1={vw / 2 - gap + cubeS + 2} y1={cy}
          x2={vw / 2 - cubeS - 2} y2={cy}
          stroke={`url(#${gId})`} strokeWidth="1.5" strokeDasharray="60"
          style={animate ? { opacity: 0, animation: 'rukos-line-in 0.4s ease 0.55s forwards' } : { opacity: 0.5 }}
        />

        {/* Center cube */}
        <CubeFace cx={vw / 2} cy={cy} size={cubeS} gradId={gId} delay={animate ? 0 : 0} animate={animate} />

        {/* Connector: center → right */}
        <line
          x1={vw / 2 + cubeS + 2} y1={cy}
          x2={vw / 2 + gap - cubeS - 2} y2={cy}
          stroke={`url(#${gId})`} strokeWidth="1.5" strokeDasharray="60"
          style={animate ? { opacity: 0, animation: 'rukos-line-in 0.4s ease 0.65s forwards' } : { opacity: 0.5 }}
        />

        {/* Right cube */}
        <CubeFace cx={vw / 2 + gap} cy={cy} size={cubeS} gradId={gId} delay={animate ? 0.3 : 0} animate={animate} />

        {/* Brand text */}
        <text
          x={vw / 2} y={142}
          textAnchor="middle"
          fill={`url(#${tId})`}
          fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
          fontWeight="800"
          fontSize="22"
          letterSpacing="4"
          style={animate ? {
            opacity: 0,
            transformOrigin: `${vw / 2}px 142px`,
            animation: 'rukos-text-in 0.6s ease-out 0.85s forwards',
          } : {}}
        >
          RUKOS_CRYPTO | HUB
        </text>

        {/* Decorative underline */}
        <line
          x1={70} y1={158} x2={350} y2={158}
          stroke={`url(#${gId})`} strokeWidth="1" opacity="0.4"
          strokeDasharray="260"
          style={animate ? { strokeDashoffset: 260, animation: 'rukos-underline 0.8s ease-out 1.3s forwards' } : {}}
        />
      </svg>
    </div>
  );
};

/* ── Single golden cube icon ── */
export const RukosCubeIcon = ({ size = 32, className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const gId = `ci${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid="rukos-cube-icon"
    >
      <defs>
        <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#F7931A" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${gId})`} strokeWidth="2" strokeLinejoin="round">
        <polygon points="6,16 20,8 34,16 20,24" fill={`url(#${gId})`} fillOpacity="0.12" />
        <polygon points="6,16 20,24 20,38 6,30" fill="none" />
        <polygon points="20,24 34,16 34,30 20,38" fill={`url(#${gId})`} fillOpacity="0.06" />
      </g>
    </svg>
  );
};

/* ── Sidebar logo: cube + text row (compact) ── */
export const RukosSidebarLogo = ({ collapsed = false, className = '' }) => {
  if (collapsed) {
    return <RukosCubeIcon size={30} className={className} />;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`} data-testid="rukos-sidebar-logo">
      <RukosCubeIcon size={26} />
      <div className="flex flex-col leading-none select-none">
        <span className="text-[11px] font-bold tracking-[2.5px] text-transparent bg-clip-text bg-gradient-to-r from-[#F7931A] to-[#FFD700]">
          RUKOS_CRYPTO
        </span>
        <span className="text-[8px] font-semibold tracking-[4px] text-white/30 mt-0.5">
          HUB
        </span>
      </div>
    </div>
  );
};
