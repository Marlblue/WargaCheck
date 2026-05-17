import React from 'react';

interface LogoIconProps {
  size?: number;
  style?: React.CSSProperties;
  variant?: 'full' | 'mark';
}

/**
 * WargaCheck custom logo — rounded square with stylized checkmark + document motif.
 * Used as avatar in chat, navbar branding, and favicon-style icon.
 */
export default function LogoIcon({ size = 22, style, variant = 'mark' }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, ...style }}
    >
      {/* Background rounded square */}
      <rect width="40" height="40" rx="10" fill="var(--primary, #E63946)" />

      {/* Document shape (subtle, background) */}
      <rect x="11" y="7" width="18" height="24" rx="3" fill="rgba(255,255,255,0.15)" />
      <rect x="11" y="7" width="18" height="24" rx="3" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />

      {/* Document lines */}
      <line x1="15" y1="14" x2="25" y2="14" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="18" x2="22" y2="18" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />

      {/* Checkmark circle */}
      <circle cx="26" cy="26" r="9" fill="white" />
      <circle cx="26" cy="26" r="9" stroke="var(--primary, #E63946)" strokeWidth="0.5" opacity="0.3" />

      {/* Checkmark */}
      <path
        d="M22 26.5L24.5 29L30 23.5"
        stroke="var(--primary, #E63946)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
