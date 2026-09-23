'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { CriterionMark } from '@/components/common/CriterionMark';
import { useAppShell } from '@/components/common/AppShell';

export type ExamPhase = 'cover' | 'reading' | 'writing' | 'final' | 'pens-down';

export type SaveStatus =
  | { state: 'idle' }
  | { state: 'saving' }
  | { state: 'saved'; at: Date }
  | { state: 'error' };

const PHASE_LABEL: Record<ExamPhase, string> = {
  cover: 'Before you begin',
  reading: 'Reading time',
  writing: 'Writing',
  final: 'Final five minutes',
  'pens-down': 'Pens down',
};

/** Each phase has its own glyph so state never relies on colour alone. */
const PhaseGlyph: React.FC<{ phase: ExamPhase }> = ({ phase }) => (
  <svg viewBox="0 0 12 12" className="w-3 h-3 shrink-0" aria-hidden="true">
    {phase === 'cover' && <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />}
    {phase === 'reading' && <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" />}
    {phase === 'writing' && <rect x="1" y="1" width="10" height="10" fill="currentColor" />}
    {phase === 'final' && (
      <>
        <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="1" width="5" height="10" fill="currentColor" />
      </>
    )}
    {phase === 'pens-down' && (
      <>
        <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" />
      </>
    )}
  </svg>
);

export const formatClock = (sec: number) => {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = r.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

/** The full-width rule under the page head: one pattern per phase. */
const PHASE_RULE: Record<ExamPhase, string> = {
  cover: 'border-b-2 border-dotted border-shell-muted',
  reading: 'border-b-2 border-dashed border-shell-ink',
  writing: 'border-b-2 border-solid border-shell-ink',
  final: 'border-b-[4px] border-double border-ecf-on-shell',
  'pens-down': 'h-[2px] bg-[repeating-linear-gradient(90deg,var(--color-lost-on-shell)_0_24px,transparent_24px_36px)]',
};

const formatSavedAt = (d: Date) =>
  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

interface ExamPageHeadProps {
  paperTitle: string;
  phase: ExamPhase;
  /** Seconds on the clock for the current phase; null before the session starts. */
  clockSeconds: number | null;
  clockHidden: boolean;
  onToggleClock: () => void;
  saveStatus: SaveStatus;
  onSubmit?: () => void;
  onLeave: () => void;
  announcement: string;
}

export const ExamPageHead: React.FC<ExamPageHeadProps> = ({
  paperTitle,
  phase,
  clockSeconds,
  clockHidden,
  onToggleClock,
  saveStatus,
  onSubmit,
  onLeave,
  announcement,
}) => {
  const { hasFormulaBooklet, toggleFormulaBooklet, isFormulaBookletOpen } = useAppShell();
  const isLastMinute = phase === 'final' && clockSeconds !== null && clockSeconds <= 60;
  const clockTone = isLastMinute
    ? 'text-lost-on-shell'
    : phase === 'final'
      ? 'text-ecf-on-shell'
      : 'text-shell-ink';

  return (
    <header className="shell-surface sticky top-0 z-40 bg-shell">
      <div className="relative mx-auto max-w-[1440px] h-12 px-3 sm:px-5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
        {/* Left: mark and paper */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onLeave}
            className="flex items-center gap-2 min-h-11 px-1 text-shell-ink"
            aria-label="Leave the exam and return to Criterion"
          >
            <CriterionMark className="w-5 h-5" />
            <span className="hidden sm:inline font-sans text-[15px] font-semibold tracking-tight">Criterion</span>
          </button>
          <span className="hidden lg:block h-5 w-px bg-shell-line" aria-hidden="true" />
          <span className="hidden lg:block truncate text-[14px] text-shell-muted max-w-[28ch]" title={paperTitle}>
            {paperTitle}
          </span>
        </div>

        {/* Centre: phase */}
        <div className="flex justify-center min-w-0">
          <div className="flex items-center gap-2 px-1 py-2 text-shell-ink">
            <PhaseGlyph phase={phase} />
            <span className="report-label whitespace-nowrap">{PHASE_LABEL[phase]}</span>
          </div>
        </div>

        {/* Right: clock, save state, booklet, submit */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-3">
          {clockSeconds !== null && (
            <div className="flex items-center gap-1">
              {clockHidden ? (
                <span className="hidden sm:inline text-[13px] text-shell-muted">Clock hidden</span>
              ) : (
                <span
                  className={`tabular font-sans text-[20px] font-semibold leading-none ${clockTone}`}
                  aria-label={`${formatClock(clockSeconds)} remaining`}
                >
                  {formatClock(clockSeconds)}
                </span>
              )}
              <button
                type="button"
                onClick={onToggleClock}
                aria-pressed={clockHidden}
                className="min-h-11 px-2 text-[13px] font-medium text-shell-muted hover:text-shell-ink underline underline-offset-4 decoration-shell-line"
              >
                {clockHidden ? 'Show' : 'Hide'}
                <span className="sr-only"> clock</span>
              </button>
            </div>
          )}

          <span className="hidden md:inline text-[13px] tabular whitespace-nowrap" aria-hidden={saveStatus.state === 'idle'}>
            {saveStatus.state === 'saving' && <span className="text-shell-muted">Saving…</span>}
            {saveStatus.state === 'saved' && (
              <span className="text-shell-muted">Saved {formatSavedAt(saveStatus.at)}</span>
            )}
            {saveStatus.state === 'error' && <span className="text-lost-on-shell">Not saved, retrying</span>}
          </span>

          {hasFormulaBooklet && (
            <button
              type="button"
              onClick={() => toggleFormulaBooklet()}
              aria-pressed={isFormulaBookletOpen}
              title="Formula booklet (Ctrl+B)"
              className="btn btn-sm btn-quiet-shell"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span className="hidden xl:inline">Formula booklet</span>
              <span className="sr-only xl:hidden">Formula booklet</span>
            </button>
          )}

          {onSubmit && (
            <button
              type="button"
              onClick={onSubmit}
              className={`btn btn-sm ${phase === 'final' ? 'btn-slip' : 'btn-quiet-shell'}`}
            >
              Hand in
            </button>
          )}
        </div>
      </div>

      {/* Signature moment: at each phase change one rule draws across the whole head */}
      <div className="relative h-[4px]" aria-hidden="true">
        <div className="absolute inset-x-0 bottom-0 border-b border-shell-line" />
        <div key={phase} className={`animate-rule-draw absolute inset-x-0 bottom-0 ${PHASE_RULE[phase]}`} />
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </header>
  );
};
