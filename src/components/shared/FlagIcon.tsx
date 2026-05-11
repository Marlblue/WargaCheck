import React from 'react';

interface FlagIconProps {
  width?: number;
  style?: React.CSSProperties;
}

/** Mini Indonesian flag icon used as avatar / logo. */
export default function FlagIcon({ width = 22, style }: FlagIconProps) {
  const height = Math.round(width * 0.727);
  return (
    <div style={{
      width, height, borderRadius: 3, overflow: 'hidden',
      display: 'flex', flexDirection: 'column' as const,
      border: '1px solid #E8E8E8', flexShrink: 0,
      ...style,
    }}>
      <div style={{ flex: 1, background: '#CC0000' }} />
      <div style={{ flex: 1, background: '#F5F5F5' }} />
    </div>
  );
}
