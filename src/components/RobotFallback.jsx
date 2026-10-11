import React from 'react';
import { THEME } from '../theme';

/** Flat SVG version of the hero robot, shown when 3D is unavailable or reduced motion is on. */
export default function RobotFallback({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 260"
      role="img"
      aria-label="Friendly robot illustration"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="110" cy="246" rx="62" ry="8" fill="#000" opacity="0.3" />
      <line x1="110" y1="22" x2="110" y2="48" stroke={THEME.deepForest} strokeWidth="5" strokeLinecap="round" />
      <circle cx="110" cy="16" r="9" fill={THEME.champagneGold} />
      <rect x="62" y="150" width="96" height="84" rx="34" fill={THEME.emeraldClay} />
      <rect x="84" y="172" width="52" height="30" rx="9" fill={THEME.deepForest} />
      <circle cx="98" cy="187" r="3.5" fill={THEME.champagneGold} opacity="0.7" />
      <circle cx="110" cy="187" r="3.5" fill={THEME.champagneGold} />
      <circle cx="122" cy="187" r="3.5" fill={THEME.champagneGold} opacity="0.7" />
      <rect x="36" y="46" width="148" height="108" rx="44" fill={THEME.emeraldClayLight} />
      <rect x="50" y="52" width="120" height="16" rx="8" fill={THEME.softChampagne} opacity="0.08" />
      <ellipse cx="34" cy="100" rx="9" ry="19" fill={THEME.champagneGold} />
      <ellipse cx="186" cy="100" rx="9" ry="19" fill={THEME.champagneGold} />
      <rect x="52" y="64" width="116" height="70" rx="26" fill={THEME.deepForest} />
      <g className="robot-blink" style={{ transformOrigin: '84px 96px' }}>
        <ellipse cx="84" cy="96" rx="14" ry="16" fill={THEME.softChampagne} />
        <circle cx="86" cy="98" r="7" fill={THEME.midnightInk} />
      </g>
      <g className="robot-blink" style={{ transformOrigin: '136px 96px' }}>
        <ellipse cx="136" cy="96" rx="14" ry="16" fill={THEME.softChampagne} />
        <circle cx="138" cy="98" r="7" fill={THEME.midnightInk} />
      </g>
      <path d="M99 118 Q110 128 121 118" fill="none" stroke={THEME.champagneGold} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
