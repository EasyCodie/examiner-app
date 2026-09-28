'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

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

/** Where the now-marker sits under the current question, in the row's own coordinates. */
interface MarkerSpot {
  left: number;
  width: number;
  /** False for the first placement, which draws in rather than travelling. */
  travels: boolean;
}

/**
 * The paper's contents as one unbroken row: every question with its mark
 * allocation, a working mark, and a single rule under the current question
 * that travels along the row as the candidate moves through the paper.
 */
export const ContentsStrip: React.FC<ContentsStripProps> = ({ items, onSelect }) => {
  const listRef = useRef<HTMLOListElement>(null);
  const currentRef = useRef<HTMLButtonElement>(null);
  const currentKey = items.find((i) => i.isCurrent)?.key;
  const [marker, setMarker] = useState<MarkerSpot | null>(null);

  // Keep the current question in view when the row is wider than the screen
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [currentKey]);

  // Measure the current question; re-measure when the row reflows
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const place = () => {
      const button = currentRef.current;
      if (!button) return;
      setMarker((prev) => ({ left: button.offsetLeft + 8, width: button.offsetWidth - 16, travels: prev !== null }));
    };
    // Observing reports once straight away, so this also places the marker for a new current question
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => observer.disconnect();
  }, [currentKey]);

  return (
  <nav aria-label="Questions" className="shell-surface sticky top-[var(--strip-top,56px)] z-30 bg-shell border-b border-shell-line">
    <ol ref={listRef} className="relative mx-auto max-w-[1440px] px-3 sm:px-5 flex items-stretch overflow-x-auto">
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
              <rect x="0.75" y="0.75" width="6.5" height="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              {/* The first stroke of working inks the square in */}
              {item.hasWorking && <rect className="animate-ink-in" x="0" y="0" width="8" height="8" fill="currentColor" />}
            </svg>
            <span className="font-semibold">{item.label}</span>
            <span className="hidden sm:inline text-[12px] text-shell-muted">[{item.marks}]</span>
          </button>
        </li>
      ))}
      {marker && (
        // One now-marker for the whole row: it draws in once, then travels to each question the candidate turns to
        <li aria-hidden="true" className="absolute left-0 bottom-0 h-0.5 w-px pointer-events-none">
          <span
            className={`block h-full w-full origin-left ${marker.travels ? 'transition-transform duration-[420ms] ease-[var(--ease-out-expo)]' : ''}`}
            style={{ transform: `translateX(${marker.left}px) scaleX(${marker.width})` }}
          >
            <span className={`block h-full w-full bg-shell-ink ${marker.travels ? '' : 'animate-rule-draw'}`} />
          </span>
        </li>
      )}
    </ol>
  </nav>
  );
};
