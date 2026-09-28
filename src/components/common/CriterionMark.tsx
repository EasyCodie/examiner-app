import React from 'react';

/**
 * Criterion mark: a margin bracket enclosing an examiner's tick, the way a
 * mark allocation "[ ]" is credited on a script.
 */
export const CriterionMark: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
    aria-hidden="true"
  >
    <path d="M8 3.5H4.5v17H8" />
    <path d="M16 3.5h3.5v17H16" />
    <path className="mark-tick" pathLength={1} d="M8.5 12.5l2.25 2.5L15.5 9" />
  </svg>
);
