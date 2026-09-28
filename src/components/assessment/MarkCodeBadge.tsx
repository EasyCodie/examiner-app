import React from 'react';
import { MarkType } from '@/types/exam';

interface MarkCodeBadgeProps {
  code: string;
  type: MarkType;
  awarded?: boolean;
  marks?: number;
  isEcfApplied?: boolean;
}

const TYPE_LABEL: Record<MarkType, string> = {
  M: 'Method mark',
  A: 'Accuracy mark',
  R: 'Reasoning mark',
  AG: 'Answer given',
  N: 'Mark for a correct answer with no working',
  FT: 'Follow-through mark',
};

/**
 * A Mark Code as an examiner writes it in the margin: the code in examiner
 * ink, with its outcome spelled out so colour is never the only signal.
 */
export const MarkCodeBadge: React.FC<MarkCodeBadgeProps> = ({ code, type, awarded = true, isEcfApplied = false }) => {
  const outcome = isEcfApplied ? 'ECF' : awarded ? 'Awarded' : 'Not shown';
  const outcomeTone = isEcfApplied ? 'text-ecf' : awarded ? 'text-awarded' : 'text-lost';

  return (
    <span className="inline-flex items-baseline gap-2 whitespace-nowrap" title={TYPE_LABEL[type] ?? 'Mark'}>
      <span className="tabular font-sans text-[15px] font-bold text-examiner min-w-[2.5ch]">{code}</span>
      <span className={`inline-flex items-center gap-1 text-[13px] font-semibold ${outcomeTone}`}>
        {/* The outcome glyph is stroked by the examiner's pen just after the code is written */}
        <svg viewBox="0 0 12 12" className="draw-stroke w-3 h-3 [&_path]:[animation-delay:calc(var(--d,0ms)+180ms)]" aria-hidden="true">
          {isEcfApplied ? (
            <path d="M1 6h7M5.5 3L8.5 6 5.5 9" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.6" />
          ) : awarded ? (
            <path d="M1.5 6.5l3 3 6-7" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.8" />
          ) : (
            <path d="M2 2l8 8M10 2l-8 8" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.8" />
          )}
        </svg>
        {outcome}
      </span>
    </span>
  );
};
