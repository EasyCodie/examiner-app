'use client';

import React from 'react';

interface SpikeMarkProps {
  className?: string;
  size?: number;
  color?: string;
}

export const SpikeMark: React.FC<SpikeMarkProps> = ({
  className = 'w-4 h-4',
  size,
  color = 'currentColor',
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={color}
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* 4-spoke radial Anthropic asterisk mark */}
      <path d="M12 1.5C12.4 7.2 16.8 11.6 22.5 12C16.8 12.4 12.4 16.8 12 22.5C11.6 16.8 7.2 12.4 1.5 12C7.2 11.6 11.6 7.2 12 1.5Z" />
    </svg>
  );
};
