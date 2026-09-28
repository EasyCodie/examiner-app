'use client';

import React from 'react';
import { ExamManifest, InProgressExamSession } from '@/types/exam';
import { formatClock } from './ExamPageHead';

interface ExamCoverProps {
  manifest: ExamManifest;
  resumable: InProgressExamSession | null;
  onBegin: () => void;
  onResume: () => void;
  onStartAgain: () => void;
}

const minutesLabel = (m: number) => `${m} minute${m === 1 ? '' : 's'}`;

/** The rubric sheet: everything a candidate reads before the clock starts. */
export const ExamCover: React.FC<ExamCoverProps> = ({ manifest, resumable, onBegin, onResume, onStartAgain }) => {
  const readingMinutes = manifest.readingTimeMinutes ?? 0;
  const facts: [string, string][] = [
    ['Writing time', minutesLabel(manifest.durationMinutes)],
    ['Reading time', readingMinutes > 0 ? minutesLabel(readingMinutes) : 'None'],
    ['Total marks', String(manifest.totalMarks)],
    ['Questions', String(manifest.questions.length)],
  ];

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-14 flex justify-center">
      <article className="script-sheet paper-surface w-full max-w-[816px] px-6 sm:px-14 py-10 sm:py-14">
        <h1 className="font-serif text-[32px] sm:text-[40px] leading-[1.1] font-semibold text-ink text-balance">
          {manifest.title}
        </h1>
        <p className="mt-3 text-[16px] text-ink-muted">{manifest.subtitle}</p>

        <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-px bg-paper-rule border-t border-b border-ink">
          {facts.map(([term, value]) => (
            <div key={term} className="bg-paper p-4">
              <dt className="text-[13px] text-ink-muted">{term}</dt>
              <dd className="mt-1 tabular text-[18px] sm:text-[22px] font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        {manifest.instructions.length > 0 && (
          <section className="mt-10" aria-labelledby="cover-instructions">
            <h2 id="cover-instructions" className="font-serif text-[20px] font-semibold text-ink">
              Instructions to candidates
            </h2>
            <ol className="mt-4 space-y-3 list-decimal pl-6 marker:tabular marker:text-ink-muted font-serif text-[17px] leading-relaxed text-ink max-w-[65ch]">
              {manifest.instructions.map((line, idx) => (
                <li key={idx} className="pl-1">
                  {line}
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="mt-12 pt-8 border-t border-paper-rule">
          {resumable ? (
            <div className="space-y-5">
              <p className="text-[16px] leading-relaxed text-ink max-w-[60ch]">
                You have an unfinished session on this paper, saved at{' '}
                <span className="tabular font-semibold">
                  {new Date(resumable.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>{' '}
                with <span className="tabular font-semibold">{formatClock(resumable.timeRemainingSeconds)}</span> left. The
                clock was paused while you were away.
              </p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={onResume} className="btn btn-ink">
                  Resume session
                </button>
                <button type="button" onClick={onStartAgain} className="btn btn-quiet-paper">
                  Start again
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-[16px] leading-relaxed text-ink max-w-[60ch]">
                {readingMinutes > 0
                  ? `The session opens with ${minutesLabel(readingMinutes)} of reading time: you can read the paper but not write. Writing starts automatically.`
                  : 'The clock starts as soon as you begin.'}{' '}
                Your working is saved on this device as you go.
              </p>
              <button type="button" onClick={onBegin} className="btn btn-ink">
                {readingMinutes > 0 ? 'Begin reading time' : 'Start writing'}
              </button>
            </div>
          )}
        </div>
      </article>
    </div>
  );
};
