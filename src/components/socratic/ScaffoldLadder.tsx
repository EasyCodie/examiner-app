'use client';

import React from 'react';
import { PedagogicalTier } from '@/types/exam';

interface ScaffoldLadderProps {
  currentTier: PedagogicalTier;
  /** Highest step the student has asked for on this question. */
  highestTierReached: PedagogicalTier | 0;
  isMarkschemeUnlocked: boolean;
  /** Subjects without a formula booklet (Economics) get a concept clue instead. */
  hasFormulaBooklet: boolean;
  disabled: boolean;
  onAskTier: (tier: 1 | 2 | 3) => void;
  onRequestReveal: () => void;
}

const STEPS: { tier: PedagogicalTier; title: string; detail: string }[] = [
  { tier: 1, title: 'Command term', detail: 'What the question is asking you to do' },
  { tier: 2, title: 'Formula clue', detail: 'The formula that applies' },
  { tier: 3, title: 'Check my working', detail: 'Where your working goes wrong, if it does' },
  { tier: 4, title: 'Markscheme', detail: 'The full mark breakdown for this question' },
];

/**
 * Pedagogical Scaffolding as a ladder: each rung asks the tutor for the next
 * level of help, and the markscheme stays locked until the first three are used.
 */
export const ScaffoldLadder: React.FC<ScaffoldLadderProps> = ({
  currentTier,
  highestTierReached,
  isMarkschemeUnlocked,
  hasFormulaBooklet,
  disabled,
  onAskTier,
  onRequestReveal,
}) => {
  const markschemeReady = highestTierReached >= 3;

  return (
    <ol aria-label="Steps of help" className="border-t-2 border-ink">
      {STEPS.map((step) => {
        const { tier, title, detail } =
          step.tier === 2 && !hasFormulaBooklet
            ? { ...step, title: 'Concept clue', detail: 'The concept or theory that applies' }
            : step;
        const reached = highestTierReached >= tier || (tier === 4 && isMarkschemeUnlocked);
        const isCurrent = currentTier === tier && reached;
        const locked = tier === 4 && !isMarkschemeUnlocked && !markschemeReady;

        return (
          <li key={tier} className="border-b border-paper-rule">
            <button
              type="button"
              disabled={disabled || locked || (tier === 4 && isMarkschemeUnlocked)}
              aria-current={isCurrent ? 'step' : undefined}
              onClick={() => (tier === 4 ? onRequestReveal() : onAskTier(tier as 1 | 2 | 3))}
              className={`w-full min-h-12 px-3 py-2 grid grid-cols-[1.75rem_1fr_auto] items-center gap-2 text-left transition-colors ${
                isCurrent ? 'bg-ink text-paper' : 'text-ink hover:bg-paper-tint disabled:hover:bg-transparent'
              } disabled:cursor-not-allowed`}
            >
              <span className="font-serif text-[18px] font-semibold tabular">{tier}</span>
              <span>
                <span className="block text-[14px] font-semibold">{title}</span>
                <span className={`block text-[13px] ${isCurrent ? 'text-paper/80' : 'text-ink-muted'}`}>
                  {locked ? 'Unlocks after step 3' : detail}
                </span>
              </span>
              <svg viewBox="0 0 12 12" className="w-3 h-3" aria-hidden="true">
                {reached ? (
                  <path d="M1.5 6.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" />
                ) : locked ? (
                  <>
                    <rect x="2" y="5.5" width="8" height="5.5" fill="currentColor" />
                    <path d="M3.75 5.5V4a2.25 2.25 0 014.5 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  </>
                ) : (
                  <rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
                )}
              </svg>
              <span className="sr-only">
                {reached ? '(used)' : locked ? '(locked)' : ''}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
};
