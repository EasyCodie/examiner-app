'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QuestionItem, QuestionSubmission, QuestionEvaluation } from '@/types/exam';
import { MarkCodeBadge } from './MarkCodeBadge';
import { MathRenderer } from '@/components/common/MathRenderer';

interface ExaminerReviewProps {
  questions: QuestionItem[];
  submissions: Record<string, QuestionSubmission>;
  evaluations: QuestionEvaluation[];
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
  paperId: string;
  /** Shown for questions without a Question Evaluation yet. */
  pendingLabel: string;
}

const stripNumber = (n: string) => n.replace(/^Question\s*/i, '').replace(/\.$/, '').trim();

export const findEvaluation = (
  evaluations: QuestionEvaluation[],
  question: QuestionItem,
  index: number
): QuestionEvaluation | undefined =>
  evaluations.find(
    (e) =>
      e.questionId === question.id ||
      e.questionNumber === question.number ||
      stripNumber(e.questionNumber ?? '') === stripNumber(question.number)
  ) ?? evaluations[index];

/** Outcome glyph for a question row: full, partial, none, or pending. */
const OutcomeGlyph: React.FC<{ ev?: QuestionEvaluation }> = ({ ev }) => {
  if (!ev) {
    return (
      <svg viewBox="0 0 12 12" className="w-3 h-3 text-ink-muted" aria-hidden="true">
        <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2" />
      </svg>
    );
  }
  if (ev.marksAwarded >= ev.maxMarks) {
    return (
      <svg viewBox="0 0 12 12" className="w-3 h-3 text-awarded" aria-hidden="true">
        <path d="M1.5 6.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (ev.marksAwarded > 0) {
    return (
      <svg viewBox="0 0 12 12" className="w-3 h-3 text-ink" aria-hidden="true">
        <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1" y="1" width="5" height="10" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 12 12" className="w-3 h-3 text-lost" aria-hidden="true">
      <path d="M2 2l8 8M10 2l-8 8" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
};

export const ExaminerReview: React.FC<ExaminerReviewProps> = ({
  questions,
  submissions,
  evaluations,
  selectedIndex,
  onSelectIndex,
  paperId,
  pendingLabel,
}) => {
  const [internalSelectedIndex, setInternalSelectedIndex] = useState(0);
  const activeIndex = selectedIndex ?? internalSelectedIndex;

  const handleSelectIndex = (idx: number) => {
    if (selectedIndex === undefined) setInternalSelectedIndex(idx);
    onSelectIndex?.(idx);
  };

  const currentQuestion = questions[activeIndex] || questions[0];
  const submission = submissions[currentQuestion.id];
  const evaluation = findEvaluation(evaluations, currentQuestion, activeIndex);
  const label = stripNumber(currentQuestion.number);

  return (
    <section aria-labelledby="review-heading" className="grid gap-8 lg:grid-cols-[260px_1fr]">
      {/* Marks table: every question and its mark */}
      <div className="lg:sticky lg:top-20 self-start">
        <h2 id="review-heading" className="font-serif text-[24px] font-semibold text-ink">
          Question by question
        </h2>
        <table className="mt-4 w-full border-collapse tabular">
          <thead>
            <tr className="border-t-2 border-b border-ink text-left text-[13px] text-ink-muted">
              <th scope="col" className="py-2 pl-2 font-semibold">Question</th>
              <th scope="col" className="py-2 pr-2 text-right font-semibold">Marks</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, idx) => {
              const ev = findEvaluation(evaluations, q, idx);
              const isSelected = idx === activeIndex;
              return (
                <tr key={q.id} className={`border-b border-paper-rule ${isSelected ? 'bg-ink text-paper' : 'text-ink'}`}>
                  <td colSpan={2} className="p-0">
                    <button
                      type="button"
                      onClick={() => handleSelectIndex(idx)}
                      aria-current={isSelected ? 'true' : undefined}
                      className="w-full min-h-11 px-2 flex items-center justify-between gap-3 text-left text-[15px] hover:bg-paper-tint aria-[current=true]:hover:bg-ink"
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <span className={isSelected ? '[&_svg]:text-paper' : ''}>
                          <OutcomeGlyph ev={ev} />
                        </span>
                        {stripNumber(q.number)}
                      </span>
                      <span className={isSelected ? '' : ev ? 'text-ink' : 'text-ink-muted'}>
                        {ev ? `${ev.marksAwarded} / ${ev.maxMarks}` : `– / ${q.totalMarks}`}
                      </span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* The selected question, marked */}
      <article aria-label={`Question ${label}`} className="min-w-0 space-y-8">
        <header className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-3">
          <h3 className="font-serif text-[28px] font-semibold text-ink tabular">Question {label}</h3>
          <p className="tabular text-[22px] font-semibold text-ink">
            {evaluation ? evaluation.marksAwarded : '–'}
            <span className="text-[15px] font-normal text-ink-muted"> / {currentQuestion.totalMarks}</span>
          </p>
        </header>

        <div className="font-serif text-[16px] leading-[1.65] text-ink max-w-[70ch]">
          <MathRenderer content={currentQuestion.promptText} lightMode={true} />
          {currentQuestion.diagram?.hasDiagram && currentQuestion.diagram.svgContent && (
            <div
              className="my-4 flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: currentQuestion.diagram.svgContent }}
            />
          )}
        </div>

        {currentQuestion.subparts && currentQuestion.subparts.length > 0 && (
          <table className="w-full border-collapse tabular">
            <caption className="text-left text-[13px] text-ink-muted pb-2">Marks by part</caption>
            <tbody>
              {currentQuestion.subparts.map((sp) => {
                const spScore =
                  evaluation?.subpartScores?.[sp.partLetter] ||
                  evaluation?.subpartScores?.[sp.partLetter.replace(/[()]/g, '')] ||
                  evaluation?.subpartScores?.[`(${sp.partLetter.replace(/[()]/g, '')})`];
                return (
                  <tr key={sp.id} className="border-t border-paper-rule align-baseline">
                    <th scope="row" className="py-2 pr-4 text-left font-serif text-[16px] font-semibold text-ink w-16">
                      {sp.partLetter}
                    </th>
                    <td className="py-2 pr-4 text-[14px] text-ink-muted">
                      {spScore?.reason ?? ''}
                      {spScore?.ecfApplied && <span className="ml-2 font-semibold text-ecf">ECF credited</span>}
                    </td>
                    <td className="py-2 text-right text-[15px] font-semibold text-ink whitespace-nowrap">
                      {spScore ? `${spScore.marksAwarded} / ${sp.totalMarks}` : `– / ${sp.totalMarks}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* The candidate's script */}
        <section aria-label="Your working" className="space-y-3">
          <h4 className="text-[15px] font-semibold text-ink">Your working</h4>
          {submission?.subpartImages && Object.keys(submission.subpartImages).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(submission.subpartImages).map(([partId, imgData]) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={partId}
                  src={imgData}
                  alt={`Your handwritten working for ${partId}`}
                  className="w-full h-auto border border-paper-rule-strong"
                />
              ))}
            </div>
          ) : submission?.canvasImageBase64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={submission.canvasImageBase64}
              alt={`Your handwritten working for question ${label}`}
              className="w-full h-auto border border-paper-rule-strong"
            />
          ) : submission?.textResponse ? (
            <div className="space-y-4">
              <p className="tabular text-[13px] text-ink-muted">
                {submission.textResponse.trim().split(/\s+/).length} words
              </p>
              <div className="whitespace-pre-wrap font-serif text-[17px] leading-[1.7] text-student max-w-[70ch]">
                {submission.textResponse}
              </div>
              {submission.diagramImageBase64 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={submission.diagramImageBase64}
                  alt="Your diagram"
                  className="max-w-md w-full h-auto border border-paper-rule-strong"
                />
              )}
            </div>
          ) : (
            <p className="text-[15px] text-ink-muted">No working was handed in for this question.</p>
          )}
        </section>

        {/* The examiner's marking, in examiner ink */}
        <section aria-label="Examiner's marking" className="space-y-5">
          <h4 className="text-[15px] font-semibold text-ink">Examiner&rsquo;s marks</h4>

          {evaluation?.markBreakdown && evaluation.markBreakdown.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-t-2 border-b border-ink text-left text-[13px] text-ink-muted">
                  <th scope="col" className="py-2 pr-4 font-semibold w-[11rem]">Mark</th>
                  <th scope="col" className="py-2 font-semibold">Examiner&rsquo;s reason</th>
                </tr>
              </thead>
              <tbody>
                {evaluation.markBreakdown.map((mb, mIdx) => (
                  <tr key={mIdx} className="border-b border-paper-rule align-baseline">
                    <td className="py-3 pr-4">
                      <MarkCodeBadge code={mb.code} type={mb.type} awarded={mb.awarded} isEcfApplied={mb.isEcfApplied} />
                    </td>
                    <td className="py-3 text-[15px] leading-relaxed text-examiner">
                      <MathRenderer content={mb.reason} lightMode={true} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[15px] text-ink-muted">{pendingLabel}</p>
          )}

          {evaluation?.ecfApplied && (
            <div className="border-t border-b border-ecf py-4 space-y-1.5">
              <p className="text-[15px] font-semibold text-ecf">Error carried forward</p>
              <p className="text-[15px] leading-relaxed text-ink max-w-[68ch]">
                {evaluation.ecfExplanation ||
                  'Your method was correct for the value you worked out earlier, so you kept those marks even though that earlier value was wrong.'}
              </p>
              <p className="text-[13px] text-ink-muted">
                Examiners never penalise the same slip twice: later marks are awarded for correct method on your own earlier
                answer.
              </p>
            </div>
          )}

          {evaluation?.marginAnnotations && evaluation.marginAnnotations.length > 0 && (
            <ul className="space-y-2" aria-label="Margin notes">
              {evaluation.marginAnnotations.map((ann, aIdx) => (
                <li key={aIdx} className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-4 text-[15px] leading-relaxed">
                  <span className="tabular font-bold text-examiner inline-flex items-baseline gap-1.5 whitespace-nowrap">
                    {(ann.type === 'tick' || ann.type === 'cross') && (
                      <svg viewBox="0 0 12 12" className="w-3 h-3 self-center" aria-label={ann.type === 'tick' ? 'Tick' : 'Cross'}>
                        <path
                          d={ann.type === 'tick' ? 'M1.5 6.5l3 3 6-7' : 'M2 2l8 8M10 2l-8 8'}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>
                    )}
                    {ann.label}
                  </span>
                  <span className="text-examiner">
                    <MathRenderer content={ann.text} lightMode={true} className="inline" />
                  </span>
                </li>
              ))}
            </ul>
          )}

          {evaluation?.examinerNotes && (
            <div className="space-y-1.5">
              <p className="text-[15px] font-semibold text-ink">Examiner&rsquo;s comment</p>
              <div className="font-serif italic text-[17px] leading-relaxed text-examiner max-w-[68ch]">
                <MathRenderer content={evaluation.examinerNotes} lightMode={true} />
              </div>
            </div>
          )}
        </section>

        {evaluation?.revisionRecommendation && (
          <section aria-label="What to practise" className="border-t border-paper-rule pt-5 space-y-3">
            <h4 className="text-[15px] font-semibold text-ink">What to practise: {evaluation.syllabusSubtopic}</h4>
            <div className="text-[15px] leading-relaxed text-ink max-w-[68ch]">
              <MathRenderer content={evaluation.revisionRecommendation} lightMode={true} />
            </div>
            {evaluation.marksAwarded < evaluation.maxMarks && (
              <Link href={`/learn/${paperId}?question=${activeIndex}`} className="btn btn-sm btn-quiet-paper">
                Work on question {label} with the tutor
              </Link>
            )}
          </section>
        )}
      </article>
    </section>
  );
};
