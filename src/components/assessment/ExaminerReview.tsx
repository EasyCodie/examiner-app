'use client';

import React, { useState } from 'react';
import { QuestionItem, QuestionSubmission, QuestionEvaluation } from '@/types/exam';
import { MarkCodeBadge } from './MarkCodeBadge';
import { MathRenderer } from '@/components/common/MathRenderer';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Lightbulb,
} from 'lucide-react';

interface ExaminerReviewProps {
  questions: QuestionItem[];
  submissions: Record<string, QuestionSubmission>;
  evaluations: QuestionEvaluation[];
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
}

export const ExaminerReview: React.FC<ExaminerReviewProps> = ({
  questions,
  submissions,
  evaluations,
  selectedIndex,
  onSelectIndex,
}) => {
  const [internalSelectedIndex, setInternalSelectedIndex] = useState(0);
  const activeIndex = selectedIndex !== undefined ? selectedIndex : internalSelectedIndex;

  const handleSelectIndex = (idx: number) => {
    if (selectedIndex === undefined) {
      setInternalSelectedIndex(idx);
    }
    onSelectIndex?.(idx);
  };

  const [filter, setFilter] = useState<'ALL' | 'REVIEW' | 'MASTERED'>('ALL');

  const filteredQuestions = questions.filter((q) => {
    const ev = evaluations.find((e) => e.questionId === q.id);
    if (filter === 'REVIEW') {
      return !ev || ev.marksAwarded < ev.maxMarks;
    }
    if (filter === 'MASTERED') {
      return ev && ev.marksAwarded === ev.maxMarks;
    }
    return true;
  });

  const currentQuestion = questions[activeIndex] || questions[0];
  const submission = submissions[currentQuestion.id];
  const evaluation = evaluations.find(
    (e) =>
      e.questionId === currentQuestion.id ||
      e.questionNumber === currentQuestion.number ||
      e.questionNumber?.replace(/^Question\s*/i, '').trim() === currentQuestion.number.replace(/^Question\s*/i, '').trim()
  ) || evaluations[activeIndex];

  return (
    <div className="double-bezel-outer-dark">
      <div className="double-bezel-inner-dark overflow-hidden">
        {/* Top Question Selector Bar with Diagnostic Heatmap */}
        <div className="p-3 bg-[#181715] border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {questions.map((q, idx) => {
            const ev = evaluations.find(
              (e) =>
                e.questionId === q.id ||
                e.questionNumber === q.number ||
                e.questionNumber?.replace(/^Question\s*/i, '').trim() === q.number.replace(/^Question\s*/i, '').trim()
            ) || evaluations[idx];
            const isSelected = idx === activeIndex;
            const sub = submissions[q.id];
            const hasWork = Boolean(
              sub?.canvasImageBase64 ||
              sub?.textResponse ||
              (sub?.subpartImages && Object.values(sub.subpartImages).some((img) => img && img.length > 500))
            );
            const fullMarks = ev && ev.marksAwarded === ev.maxMarks;
            const isPartial = ev && ev.marksAwarded > 0 && ev.marksAwarded < ev.maxMarks;
            const isZero = ev && ev.marksAwarded === 0;

            const matchesFilter = filteredQuestions.some((fq) => fq.id === q.id);
            if (!matchesFilter) return null;

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => handleSelectIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code transition-all flex items-center gap-1.5 whitespace-nowrap border ${isSelected
                    ? 'bg-[#cc785c] text-white font-semibold shadow-sm border-transparent'
                    : 'bg-[#252320] text-[#a09d96] hover:text-[#faf9f5] hover:bg-[#2c2a26] border-white/10'
                  }`}
              >
                {/* Diagnostic Heatmap Dot or Pending Loader */}
                {ev ? (
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${fullMarks
                        ? 'bg-[#5db8a6]'
                        : isPartial
                          ? 'bg-[#e8a55a]'
                          : isZero && hasWork
                            ? 'bg-[#c64545]'
                            : 'bg-white/20'
                      }`}
                  />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#cc785c] animate-pulse shrink-0" />
                )}
                <span>{q.number.replace(/^Question\s*/i, '')}</span>
                {ev ? (
                  <span
                    className={`text-[10px] font-mono-code px-1.5 py-0.5 rounded ${isSelected
                        ? 'bg-black/30 text-white'
                        : fullMarks
                          ? 'bg-[#5db8a6]/15 text-[#5db8a6]'
                          : isPartial
                            ? 'bg-[#e8a55a]/15 text-[#e8a55a]'
                            : 'bg-white/10 text-[#a09d96]'
                      }`}
                  >
                    {ev.marksAwarded}/{ev.maxMarks}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono-code text-[#a09d96] italic">
                    Queued
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Filter Segmented Control */}
          <div className="flex items-center gap-0.5 bg-[#252320] p-1 rounded-lg border border-white/10 text-[10px] font-mono-code">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition ${filter === 'ALL'
                  ? 'bg-[#181715] text-[#faf9f5] font-semibold shadow-2xs'
                  : 'text-[#a09d96] hover:text-[#faf9f5]'
                }`}
            >
              All ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('REVIEW')}
              className={`px-2.5 py-1 rounded-md transition ${filter === 'REVIEW'
                  ? 'bg-[#181715] text-[#faf9f5] font-semibold shadow-2xs'
                  : 'text-[#a09d96] hover:text-[#faf9f5]'
                }`}
            >
              Review Needed
            </button>
            <button
              type="button"
              onClick={() => setFilter('MASTERED')}
              className={`px-2.5 py-1 rounded-md transition ${filter === 'MASTERED'
                  ? 'bg-[#181715] text-[#faf9f5] font-semibold shadow-2xs'
                  : 'text-[#a09d96] hover:text-[#faf9f5]'
                }`}
            >
              Full Marks
            </button>
          </div>

          {/* Chevrons */}
          <div className="flex items-center gap-1.5 text-[#a09d96] text-xs font-mono-code">
            <button
              type="button"
              disabled={activeIndex <= 0}
              onClick={() => handleSelectIndex(activeIndex - 1)}
              className="p-1.5 rounded-lg hover:text-[#faf9f5] hover:bg-[#252320] disabled:opacity-30 transition"
              title="Previous Question"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              {activeIndex + 1} of {questions.length}
            </span>
            <button
              type="button"
              disabled={activeIndex >= questions.length - 1}
              onClick={() => handleSelectIndex(activeIndex + 1)}
              className="p-1.5 rounded-lg hover:text-[#faf9f5] hover:bg-[#252320] disabled:opacity-30 transition"
              title="Next Question"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Side-by-Side Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* LEFT PANE (Col 1-6): Student's Submitted Work */}
        <div className="lg:col-span-6 p-6 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#1f1e1b] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#faf9f5] font-mono-code">
                Your Answer
              </span>
              <span className="text-[10px] font-mono-code text-[#a09d96]">
                ({submission?.timeSpentSeconds ? `${Math.round(submission.timeSpentSeconds / 60)} mins` : 'Timed session'})
              </span>
            </div>
            {evaluation?.ecfApplied && (
              <span className="text-[11px] font-mono-code text-[#e8a55a] bg-[#e8a55a]/15 border border-[#e8a55a]/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Method Protected (ECF)
              </span>
            )}
          </div>

          {/* Prompt Review */}
          <div className="bg-[#252320] p-4 rounded-xl border border-white/10 mb-4 text-xs text-[#faf9f5] shadow-2xs">
            <div className="font-semibold text-[#faf9f5] mb-1.5 font-mono-code flex items-center justify-between">
              <span>{currentQuestion.number.replace(/^Question\s*/i, '')}</span>
              <span className="text-[11px] text-[#a09d96]">[{currentQuestion.totalMarks} Marks]</span>
            </div>
            <MathRenderer content={currentQuestion.promptText} lightMode={false} />

            {/* Top-Level Mathematical Diagram / SVG Graph */}
            {currentQuestion.diagram?.hasDiagram && currentQuestion.diagram.svgContent && (
              <div className="my-3 p-3 bg-[#181715] rounded-lg border border-white/10 shadow-sm flex flex-col items-center">
                {currentQuestion.diagram.title && (
                  <div className="text-xs font-mono-code font-bold text-[#faf9f5] mb-1.5">
                    {currentQuestion.diagram.title}
                  </div>
                )}
                <div
                  className="w-full max-w-sm overflow-x-auto flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: currentQuestion.diagram.svgContent }}
                />
              </div>
            )}

            {/* Subparts Breakdown with Discrete Scores & Annotations */}
            {currentQuestion.subparts && currentQuestion.subparts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5">
                {currentQuestion.subparts.map((sp) => {
                  const spScore =
                    evaluation?.subpartScores?.[sp.partLetter] ||
                    evaluation?.subpartScores?.[sp.partLetter.replace(/[()]/g, '')] ||
                    evaluation?.subpartScores?.[`(${sp.partLetter.replace(/[()]/g, '')})`];
                  const spAnnotations = evaluation?.marginAnnotations?.filter(
                    (a) =>
                      a.subpartPartLetter === sp.partLetter ||
                      a.subpartPartLetter === sp.partLetter.replace(/[()]/g, '')
                  );

                  return (
                    <div key={sp.id} className="bg-[#181715] p-3 rounded-lg border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 font-mono-code text-[11px]">
                        <div className="flex items-center gap-1.5 font-semibold text-[#faf9f5]">
                          <span>Part {sp.partLetter}</span>
                          <span className="text-[#a09d96]">[{sp.totalMarks} marks]</span>
                        </div>
                        {spScore ? (
                          <div className="flex items-center gap-1.5">
                            {spScore.ecfApplied && (
                              <span className="text-[10px] font-mono-code text-[#e8a55a] bg-[#e8a55a]/15 border border-[#e8a55a]/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> ECF
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${spScore.marksAwarded === sp.totalMarks
                                  ? 'bg-[#5db8a6]/15 text-[#5db8a6] border border-[#5db8a6]/30'
                                  : spScore.marksAwarded > 0
                                    ? 'bg-[#e8a55a]/15 text-[#e8a55a] border border-[#e8a55a]/30'
                                    : 'bg-[#c64545]/15 text-[#fca5a5] border border-[#c64545]/30'
                                }`}
                            >
                              {spScore.marksAwarded}/{sp.totalMarks} marks
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <MathRenderer content={sp.promptText} lightMode={false} />
                      {spScore?.reason && (
                        <p className="text-[10px] font-mono-code text-[#a09d96] italic pt-1 border-t border-white/10">
                          {spScore.reason}
                        </p>
                      )}
                      {spAnnotations && spAnnotations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {spAnnotations.map((ann, aIdx) => (
                            <span
                              key={aIdx}
                              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-mono-code ${ann.type === 'tick'
                                  ? 'bg-[#5db8a6]/15 border-[#5db8a6]/35 text-[#5db8a6]'
                                  : ann.type === 'ecf'
                                    ? 'bg-[#e8a55a]/15 border-[#e8a55a]/35 text-[#e8a55a]'
                                    : 'bg-[#c64545]/15 border-[#c64545]/35 text-[#fca5a5]'
                                }`}
                            >
                              <span className="font-semibold">{ann.label}:</span> {ann.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submission Preview */}
          <div className="flex-1 bg-[#181715] rounded-xl border border-white/10 p-4 overflow-y-auto text-[#faf9f5] relative shadow-inner">
            {submission?.subpartImages && Object.keys(submission.subpartImages).length > 0 ? (
              <div className="space-y-4">
                <div className="text-[10px] font-mono-code uppercase text-[#a09d96] font-semibold border-b border-white/10 pb-1 flex items-center justify-between">
                  <span>Your Handwritten Working</span>
                  <span className="text-[#5db8a6] bg-[#5db8a6]/15 px-1.5 py-0.5 rounded border border-[#5db8a6]/30">Captured</span>
                </div>
                {Object.entries(submission.subpartImages).map(([partId, imgData]) => (
                  <div key={partId} className="space-y-1">
                    <span className="text-[11px] font-mono-code text-[#d6cfc5] font-semibold uppercase">
                      Working: {partId}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgData}
                      alt={`Working for ${partId}`}
                      className="w-full h-auto rounded border border-white/10 object-contain shadow-sm"
                    />
                  </div>
                ))}
              </div>
            ) : submission?.canvasImageBase64 ? (
              <div className="space-y-3">
                <div className="text-[10px] font-mono-code uppercase text-[#a09d96] font-semibold border-b border-white/10 pb-1 flex items-center justify-between">
                  <span>Your Handwritten Working</span>
                  <span className="text-[#5db8a6] bg-[#5db8a6]/15 px-1.5 py-0.5 rounded border border-[#5db8a6]/30">Captured</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={submission.canvasImageBase64}
                  alt={`Student working for ${currentQuestion.number}`}
                  className="w-full h-auto rounded border border-white/10 object-contain shadow-sm"
                />
              </div>
            ) : submission?.textResponse ? (
              <div className="space-y-4">
                <div className="text-[10px] font-mono-code uppercase text-[#a09d96] font-semibold border-b border-white/10 pb-1">
                  Your Written Response • Word count: {submission.textResponse.trim().split(/\s+/).length} words
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-serif text-[#faf9f5]">
                  {submission.textResponse}
                </div>
                {submission.diagramImageBase64 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="text-xs font-bold text-[#d6cfc5] block mb-2 font-mono-code">
                      Your Diagram:
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={submission.diagramImageBase64}
                      alt="Student diagram"
                      className="max-w-md w-full h-auto rounded border border-white/10 shadow-sm"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-[#a09d96] font-mono-code text-xs">
                No answer was recorded for this question during the exam.
              </div>
            )}
          </div>

          {/* Margin Annotations Callout (Red Examiner Marks) */}
          {evaluation?.marginAnnotations && evaluation.marginAnnotations.length > 0 && (
            <div className="mt-4 p-3.5 bg-[#c64545]/10 border border-[#c64545]/25 rounded-xl space-y-2">
              <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#fca5a5] font-semibold block">
                Examiner Margin Notes:
              </span>
              <div className="flex flex-wrap gap-2">
                {evaluation.marginAnnotations.map((ann, aIdx) => (
                  <div
                    key={aIdx}
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-mono-code animate-stamp-reveal ${ann.type === 'tick'
                        ? 'bg-[#5db8a6]/15 border-[#5db8a6]/35 text-[#5db8a6]'
                        : ann.type === 'ecf'
                          ? 'bg-[#e8a55a]/15 border-[#e8a55a]/35 text-[#e8a55a]'
                          : 'bg-[#c64545]/15 border-[#c64545]/35 text-[#fca5a5]'
                      }`}
                  >
                    {ann.type === 'tick' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5db8a6]" />
                    ) : ann.type === 'ecf' ? (
                      <Sparkles className="w-3.5 h-3.5 text-[#e8a55a]" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-[#fca5a5]" />
                    )}
                    <span className="font-semibold">{ann.label}:</span>
                    <MathRenderer content={ann.text} lightMode={false} className="font-sans text-[11px] opacity-90 inline-block" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANE (Col 7-12): Authoritative Senior Examiner Mark Breakdown */}
        <div className="lg:col-span-6 p-6 bg-[#181715] flex flex-col space-y-5 text-[#faf9f5]">
          {/* Score Header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-code uppercase tracking-wider text-[#cc785c] font-semibold">
                  Mark Breakdown
                </span>
              </div>
              <h3 className="text-lg font-serif font-normal text-[#faf9f5] mt-0.5">
                Marks &amp; Examiner Feedback
              </h3>
            </div>

            <div className="text-right">
              <div className="text-2xl font-semibold font-mono-code text-[#faf9f5]">
                {evaluation?.marksAwarded ?? 0}{' '}
                <span className="text-sm font-normal text-[#a09d96]">/ {currentQuestion.totalMarks}</span>
              </div>
              <span className="text-[10px] font-mono-code text-[#5db8a6]">
                {Math.round(((evaluation?.marksAwarded ?? 0) / currentQuestion.totalMarks) * 100)}% Awarded
              </span>
            </div>
          </div>

          {/* Examiner Notes */}
          {evaluation?.examinerNotes && (
            <div className="p-4 bg-[#252320] rounded-xl border border-white/10 text-xs text-[#faf9f5] leading-relaxed">
              <div className="font-semibold text-[#faf9f5] mb-1 flex items-center gap-1.5 font-mono-code">
                <FileCheck className="w-3.5 h-3.5 text-[#cc785c]" />
                Examiner Feedback:
              </div>
              <MathRenderer content={evaluation.examinerNotes} />
            </div>
          )}

          {/* Error Carried Forward Explanation Card */}
          {evaluation?.ecfApplied && (
            <div className="p-4 bg-[#e8a55a]/15 border border-[#e8a55a]/35 rounded-xl text-xs space-y-1 text-[#faf9f5]">
              <div className="flex items-center gap-1.5 font-semibold text-[#e8a55a] font-mono-code">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Follow-Through Applied:</span>
              </div>
              <p className="text-[11px] text-[#e8a55a]/90 leading-relaxed font-mono-code">
                {evaluation.ecfExplanation ||
                  'Your method was correct based on an earlier calculated value, so you received follow-through marks despite an earlier arithmetic error.'}
              </p>
            </div>
          )}

          {/* Granular Mark Codes Breakdown Table */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#a09d96] block mb-2.5 font-mono-code">
              Mark Breakdown:
            </span>
            <div className="space-y-2">
              {evaluation?.markBreakdown && evaluation.markBreakdown.length > 0 ? (
                evaluation.markBreakdown.map((mb, mIdx) => (
                  <div
                    key={mIdx}
                    className={`p-3.5 rounded-xl border transition-all text-xs animate-message-enter ${mb.awarded
                        ? 'bg-[#252320] border-white/10 text-[#faf9f5]'
                        : 'bg-[#c64545]/15 border-[#c64545]/30 text-[#faf9f5]'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <MarkCodeBadge
                          code={mb.code}
                          type={mb.type}
                          awarded={mb.awarded}
                          marks={mb.marksAwarded}
                          isEcfApplied={mb.isEcfApplied}
                        />
                        <span className="font-mono-code text-[11px] text-[#a09d96]">
                          {mb.awarded ? `Awarded ${mb.marksAwarded}/${mb.maxMarks}m` : `Lost 0/${mb.maxMarks}m`}
                        </span>
                      </div>
                      {mb.awarded ? (
                        <span className="text-[10px] font-mono-code text-[#5db8a6] font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> AWARDED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono-code text-[#c64545] font-semibold flex items-center gap-0.5">
                          <XCircle className="w-3 h-3" /> NOT SHOWN
                        </span>
                      )}
                    </div>
                    <div className="text-[#a09d96] leading-relaxed">
                      <MathRenderer content={mb.reason} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-5 bg-[#252320] border border-white/10 rounded-xl text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs font-mono-code text-[#faf9f5]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#cc785c] animate-pulse" />
                    <span>Marking in Progress</span>
                  </div>
                  <p className="text-[11px] font-mono-code text-[#a09d96] max-w-sm mx-auto">
                    Your examiner is currently marking earlier questions. This feedback will appear as soon as it is ready.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Targeted Revision Drill Advice */}
          {evaluation?.revisionRecommendation && (
            <div className="p-4 bg-[#252320] border border-white/10 rounded-xl text-xs text-[#faf9f5]">
              <div className="font-semibold text-[#cc785c] flex items-center gap-1.5 mb-1 font-mono-code">
                <Lightbulb className="w-3.5 h-3.5 text-[#cc785c]" />
                Recommended Practice: {evaluation.syllabusSubtopic}
              </div>
              <MathRenderer content={evaluation.revisionRecommendation} className="text-[#a09d96] mt-1" />
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};
