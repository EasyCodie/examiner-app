'use client';

import React from 'react';
import Link from 'next/link';
import { QuestionItem } from '@/types/exam';
import { useRevealOnView } from '@/components/common/motion';

export interface SyllabusBreakdownItem {
  subtopic: string;
  marksAwarded: number;
  totalMarks: number;
  percentage: number;
  status: 'mastered' | 'developing' | 'critical';
  targetedDrillPrompt: string;
}

interface SyllabusMatrixProps {
  syllabusBreakdown: SyllabusBreakdownItem[];
  paperId: string;
  allQuestions: QuestionItem[];
}

const STANDING: Record<SyllabusBreakdownItem['status'], { label: string; tone: string; glyph: React.ReactNode }> = {
  mastered: {
    label: 'Secure',
    tone: 'text-awarded',
    glyph: <path d="M1.5 6.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" />,
  },
  developing: {
    label: 'Developing',
    tone: 'text-ink',
    glyph: (
      <>
        <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1" y="1" width="5" height="10" fill="currentColor" />
      </>
    ),
  },
  critical: {
    label: 'Needs work',
    tone: 'text-lost',
    glyph: <path d="M2 2l8 8M10 2l-8 8" fill="none" stroke="currentColor" strokeWidth="1.8" />,
  },
};

const ORDER = { critical: 0, developing: 1, mastered: 2 } as const;

/**
 * Syllabus Weakness Matrix: every subtopic on the paper as one ruled table,
 * weakest first, each with the question to practise it on.
 */
export const SyllabusMatrix: React.FC<SyllabusMatrixProps> = ({ syllabusBreakdown, paperId, allQuestions }) => {
  const revealOnView = useRevealOnView<HTMLTableSectionElement>();
  if (syllabusBreakdown.length === 0) return null;

  const rows = [...syllabusBreakdown].sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.percentage - b.percentage);

  const practiceIndex = (subtopic: string) => {
    const needle = subtopic.toLowerCase();
    return allQuestions.findIndex((q) => {
      const hay = (q.syllabusSubtopic || '').toLowerCase();
      return hay && (hay === needle || hay.includes(needle) || needle.includes(hay));
    });
  };

  return (
    <section aria-labelledby="topics-heading" className="space-y-4">
      <h2 id="topics-heading" className="font-serif text-[24px] font-semibold text-ink">
        Topics on this paper
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-t-2 border-b border-ink text-left text-[13px] text-ink-muted">
              <th scope="col" className="py-2 pr-4 font-semibold">Topic</th>
              <th scope="col" className="py-2 pr-4 font-semibold text-right">Marks</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Standing</th>
              <th scope="col" className="py-2 font-semibold"><span className="sr-only">Practise</span></th>
            </tr>
          </thead>
          <tbody ref={revealOnView}>
            {rows.map((row, i) => {
              const standing = STANDING[row.status];
              const idx = practiceIndex(row.subtopic);
              return (
                <tr
                  key={row.subtopic}
                  className="reveal-item border-b border-paper-rule align-top"
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <th scope="row" className="py-3 pr-4 text-left">
                    <span className="block text-[15px] font-semibold text-ink">{row.subtopic}</span>
                    {row.status !== 'mastered' && row.targetedDrillPrompt && (
                      <span className="mt-1 block text-[14px] font-normal leading-relaxed text-ink-muted max-w-[60ch]">
                        {row.targetedDrillPrompt}
                      </span>
                    )}
                  </th>
                  <td className="py-3 pr-4 text-right tabular text-[15px] text-ink whitespace-nowrap">
                    {row.marksAwarded} / {row.totalMarks}
                    <span className="block text-[13px] text-ink-muted">{row.percentage}%</span>
                  </td>
                  <td className={`py-3 pr-4 text-[14px] font-semibold whitespace-nowrap ${standing.tone}`}>
                    <span className="inline-flex items-center gap-1.5">
                      <svg viewBox="0 0 12 12" className="w-3 h-3" aria-hidden="true">
                        {standing.glyph}
                      </svg>
                      {standing.label}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {row.status !== 'mastered' && idx >= 0 && (
                      <Link href={`/learn/${paperId}?question=${idx}`} className="btn btn-sm btn-quiet-paper">
                        Practise
                        <span className="sr-only"> {row.subtopic}</span>
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
