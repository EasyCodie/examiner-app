'use client';

import React, { useEffect, useRef } from 'react';

export interface ContentsItem {
  key: string;
  label: string;
  marks: number;
  hasWorking: boolean;
  isCurrent: boolean;
}

interface ContentsStripProps {
  items: ContentsItem[];
  onSelect: (key: string) => void;
}

/**
 * The paper's contents as one unbroken row: every question with its mark
 * allocation, a working mark, and a single rule under the current question.
 */
export const ContentsStrip: React.FC<ContentsStripProps> = ({ items, onSelect }) => {
  const currentRef = useRef<HTMLButtonElement>(null);
  const currentKey = items.find((i) => i.isCurrent)?.key;

  // Keep the current question in view when the row is wider than the screen
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [currentKey]);

  return (
  <nav aria-label="Questions" className="shell-surface sticky top-14 z-30 bg-shell border-b border-shell-line">
    <ol className="mx-auto max-w-[1440px] px-3 sm:px-5 flex items-stretch overflow-x-auto">
      {items.map((item) => (
        <li key={item.key} className="shrink-0">
          <button
            type="button"
            ref={item.isCurrent ? currentRef : undefined}
            onClick={() => onSelect(item.key)}
            aria-current={item.isCurrent ? 'step' : undefined}
            aria-label={`Question ${item.label}, ${item.marks} marks, ${item.hasWorking ? 'has working' : 'no working yet'}`}
            className={`relative min-h-11 min-w-11 px-2 sm:px-3 flex items-center gap-1.5 sm:gap-2 tabular text-[14px] transition-colors ${
              item.isCurrent ? 'text-shell-ink' : 'text-shell-muted hover:text-shell-ink'
            }`}
          >
            <svg viewBox="0 0 8 8" className="w-2 h-2 shrink-0" aria-hidden="true">
              {item.hasWorking ? (
                <rect x="0" y="0" width="8" height="8" fill="currentColor" />
              ) : (
                <rect x="0.75" y="0.75" width="6.5" height="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              )}
            </svg>
            <span className="font-semibold">{item.label}</span>
            <span className="hidden sm:inline text-[12px] text-shell-muted">[{item.marks}]</span>
            {item.isCurrent && (
              <span aria-hidden="true" className="animate-rule-draw absolute left-2 right-2 bottom-0 h-0.5 bg-shell-ink" />
            )}
          </button>
        </li>
      ))}
    </ol>
  </nav>
  );
};
