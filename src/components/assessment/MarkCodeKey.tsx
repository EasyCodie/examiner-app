'use client';

import React from 'react';
import { useRevealOnView } from '@/components/common/motion';

export const MARK_CODE_KEY: { code: string; short: string; meaning: string }[] = [
  { code: 'M', short: 'method', meaning: 'Method mark: a valid method, attempted. It can be earned even if the answer is wrong.' },
  { code: 'A', short: 'accuracy', meaning: 'Accuracy mark: a correct value or statement. Usually depends on the method mark before it.' },
  { code: 'R', short: 'reasoning', meaning: 'Reasoning mark: a clear justification, often for a command term such as Show that or Justify.' },
  { code: 'AG', short: 'answer given', meaning: 'Answer given: the result is printed in the question, so no mark is given for writing it down.' },
  {
    code: 'FT',
    short: 'follow through (ECF)',
    meaning: 'Follow through: error carried forward. A wrong value used correctly later keeps the later marks, so one slip is only penalised once.',
  },
];

/**
 * The Mark Code key, held level like a map legend. `full` defines every code
 * (home); `compact` is a one-line legend beside marking (results, tutor).
 */
export const MarkCodeKey: React.FC<{ variant: 'full' | 'compact'; className?: string }> = ({ variant, className = '' }) => {
  const revealOnView = useRevealOnView<HTMLDListElement>();

  if (variant === 'compact') {
    return (
      <dl aria-label="Mark code key" className={`flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-muted ${className}`}>
        {MARK_CODE_KEY.map(({ code, short }) => (
          <div key={code} className="flex gap-1.5">
            <dt className="tabular font-bold text-examiner">{code}</dt>
            <dd>{short}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl ref={revealOnView} className={`border-t-2 border-shell-ink ${className}`}>
      {/* As the key comes into view, the examiner writes each code into it */}
      {MARK_CODE_KEY.map(({ code, meaning }, i) => (
        <div key={code} className="grid grid-cols-[4rem_1fr] gap-4 py-3.5 border-b border-shell-line">
          <dt
            className="reveal-item tabular font-sans text-[17px] font-bold text-examiner-on-shell justify-self-start"
            style={{ '--i': i * 2 } as React.CSSProperties}
          >
            {code}
          </dt>
          <dd className="text-[16px] leading-relaxed text-shell-ink max-w-[70ch]">{meaning}</dd>
        </div>
      ))}
    </dl>
  );
};
