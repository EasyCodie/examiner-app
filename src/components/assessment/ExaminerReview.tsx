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
    <div className="bg-[#141517] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Question Selector Bar with Diagnostic Heatmap */}
      <div className="p-3 bg-[#0c0d0e] border-b border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-x-auto">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code transition-all flex items-center gap-1.5 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-[#f54e00] text-white font-semibold shadow-sm border-transparent'
                    : 'bg-[#1a1b1e] text-[#9b9a95] hover:text-[#f3f3f2] hover:bg-[#222428] border-white/[0.08]'
                }`}
              >
                {/* Diagnostic Heatmap Dot or Pending Loader */}
                {ev ? (
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      fullMarks
                        ? 'bg-emerald-400'
                        : isPartial
                        ? 'bg-[#dfa88f]'
                        : isZero && hasWork
                        ? 'bg-[#cf2d56]'
                        : 'bg-white/20'
                    }`}
                  />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f54e00] animate-pulse shrink-0" />
                )}
                <span>{q.number.replace(/^Question\s*/i, '')}</span>
                {ev ? (
                  <span
                    className={`text-[10px] font-mono-code px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-black/20 text-white'
                        : fullMarks
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : isPartial
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-white/[0.06] text-[#9b9a95]'
                    }`}
                  >
                    {ev.marksAwarded}/{ev.maxMarks}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono-code text-[#686763] italic">
                    Queued
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Filter Segmented Control */}
          <div className="flex items-center gap-0.5 bg-[#141517] p-0.5 rounded-lg border border-white/[0.08] text-[10px] font-mono-code">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2 py-1 rounded transition ${
                filter === 'ALL'
                  ? 'bg-white/[0.12] text-white font-semibold'
                  : 'text-[#9b9a95] hover:text-[#f3f3f2]'
              }`}
            >
              All ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('REVIEW')}
              className={`px-2 py-1 rounded transition ${
                filter === 'REVIEW'
                  ? 'bg-white/[0.12] text-white font-semibold'
                  : 'text-[#9b9a95] hover:text-[#f3f3f2]'
              }`}
            >
              Needs Review
            </button>
            <button
              type="button"
              onClick={() => setFilter('MASTERED')}
              className={`px-2 py-1 rounded transition ${
                filter === 'MASTERED'
                  ? 'bg-white/[0.12] text-white font-semibold'
                  : 'text-[#9b9a95] hover:text-[#f3f3f2]'
              }`}
            >
              Mastered
            </button>
          </div>

          {/* Chevrons */}
          <div className="flex items-center gap-1.5 text-[#9b9a95] text-xs font-mono-code">
            <button
              type="button"
              disabled={activeIndex <= 0}
              onClick={() => handleSelectIndex(activeIndex - 1)}
              className="p-1.5 rounded hover:text-white hover:bg-white/[0.06] disabled:opacity-30 transition"
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
              className="p-1.5 rounded hover:text-white hover:bg-white/[0.06] disabled:opacity-30 transition"
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
        <div className="lg:col-span-6 p-6 border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#141517] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#f3f3f2] font-mono-code">
                Student Work Submitted
              </span>
              <span className="text-[10px] font-mono-code text-[#686763]">
                ({submission?.timeSpentSeconds ? `${Math.round(submission.timeSpentSeconds / 60)} mins` : 'Timed session'})
              </span>
            </div>
            {evaluation?.ecfApplied && (
              <span className="text-[11px] font-mono-code text-[#dfa88f] bg-[#dfa88f]/10 border border-[#dfa88f]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> ECF Protected
              </span>
            )}
          </div>

          {/* Prompt Review */}
          <div className="bg-[#0c0d0e] p-3.5 rounded-xl border border-white/[0.08] mb-4 text-xs text-[#d6d5d1]">
            <div className="font-semibold text-white mb-1.5 font-mono-code flex items-center justify-between">
              <span>{currentQuestion.number.replace(/^Question\s*/i, '')}</span>
              <span className="text-[11px] text-[#9b9a95]">[{currentQuestion.totalMarks} Marks]</span>
            </div>
            <MathRenderer content={currentQuestion.promptText} />

            {/* Top-Level Mathematical Diagram / SVG Graph */}
            {currentQuestion.diagram?.hasDiagram && currentQuestion.diagram.svgContent && (
              <div className="my-3 p-3 bg-white rounded-lg border border-slate-300 shadow-sm flex flex-col items-center">
                {currentQuestion.diagram.title && (
                  <div className="text-xs font-mono-code font-bold text-slate-800 mb-1.5">
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
              <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-2.5">
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
                    <div key={sp.id} className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.05] space-y-1.5">
                      <div className="flex items-center justify-between gap-2 font-mono-code text-[11px]">
                        <div className="flex items-center gap-1.5 font-semibold text-[#f3f3f2]">
                          <span>Subquestion {sp.partLetter}</span>
                          <span className="text-[#9b9a95]">[{sp.totalMarks} marks]</span>
                        </div>
                        {spScore ? (
                          <div className="flex items-center gap-1.5">
                            {spScore.ecfApplied && (
                              <span className="text-[10px] font-mono-code text-[#dfa88f] bg-[#dfa88f]/10 border border-[#dfa88f]/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> ECF
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                spScore.marksAwarded === sp.totalMarks
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                  : spScore.marksAwarded > 0
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                                  : 'bg-[#cf2d56]/15 text-[#cf2d56] border border-[#cf2d56]/20'
                              }`}
                            >
                              {spScore.marksAwarded}/{sp.totalMarks} marks
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <MathRenderer content={sp.promptText} />
                      {spScore?.reason && (
                        <p className="text-[10px] font-mono-code text-[#9b9a95] italic pt-1 border-t border-white/[0.04]">
                          {spScore.reason}
                        </p>
                      )}
                      {spAnnotations && spAnnotations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {spAnnotations.map((ann, aIdx) => (
                            <span
                              key={aIdx}
                              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-mono-code ${
                                ann.type === 'tick'
                                  ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                                  : ann.type === 'ecf'
                                  ? 'bg-amber-950/40 border-amber-700/50 text-amber-300'
                                  : 'bg-rose-950/40 border-rose-700/50 text-rose-300'
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
          <div className="flex-1 bg-white rounded-xl border border-slate-300 p-4 overflow-y-auto text-slate-900 relative shadow-inner">
            {submission?.subpartImages && Object.keys(submission.subpartImages).length > 0 ? (
              <div className="space-y-4">
                <div className="text-[10px] font-mono-code uppercase text-slate-500 font-semibold border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>Handwritten Subquestion Scans • e-Marking Script</span>
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Captured</span>
                </div>
                {Object.entries(submission.subpartImages).map(([partId, imgData]) => (
                  <div key={partId} className="space-y-1">
                    <span className="text-[11px] font-mono-code text-slate-700 font-semibold uppercase">
                      Working: {partId}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgData}
                      alt={`Working for ${partId}`}
                      className="w-full h-auto rounded border border-slate-300 object-contain shadow-sm"
                    />
                  </div>
                ))}
              </div>
            ) : submission?.canvasImageBase64 ? (
              <div className="space-y-3">
                <div className="text-[10px] font-mono-code uppercase text-slate-500 font-semibold border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>Handwritten Canvas Scan • e-Marking Script</span>
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Captured</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={submission.canvasImageBase64}
                  alt={`Student working for ${currentQuestion.number}`}
                  className="w-full h-auto rounded border border-slate-300 object-contain shadow-sm"
                />
              </div>
            ) : submission?.textResponse ? (
              <div className="space-y-4">
                <div className="text-[10px] font-mono-code uppercase text-slate-500 font-semibold border-b border-slate-200 pb-1">
                  Written Response • Word count: {submission.textResponse.trim().split(/\s+/).length} words
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-serif text-slate-800">
                  {submission.textResponse}
                </div>
                {submission.diagramImageBase64 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-600 block mb-2 font-mono-code">
                      Student Economic Diagram:
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={submission.diagramImageBase64}
                      alt="Student diagram"
                      className="max-w-md w-full h-auto rounded border border-slate-300 shadow-sm"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 font-mono-code text-xs">
                No answer was recorded for this question during the exam.
              </div>
            )}
          </div>

          {/* Margin Annotations Callout (Red Examiner Marks) */}
          {evaluation?.marginAnnotations && evaluation.marginAnnotations.length > 0 && (
            <div className="mt-4 p-3 bg-[#cf2d56]/10 border border-[#cf2d56]/20 rounded-xl space-y-1.5">
              <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#cf2d56] font-semibold block">
                Examiner Margin Annotations (Red Pen):
              </span>
              <div className="flex flex-wrap gap-2">
                {evaluation.marginAnnotations.map((ann, aIdx) => (
                  <div
                    key={aIdx}
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-mono-code ${
                      ann.type === 'tick'
                        ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                        : ann.type === 'ecf'
                        ? 'bg-amber-950/40 border-amber-700/50 text-amber-300'
                        : 'bg-rose-950/40 border-rose-700/50 text-rose-300'
                    }`}
                  >
                    {ann.type === 'tick' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : ann.type === 'ecf' ? (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span className="font-semibold">{ann.label}:</span>
                    <MathRenderer content={ann.text} className="font-sans text-[11px] opacity-90 inline-block" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANE (Col 7-12): Authoritative Senior Examiner Mark Breakdown */}
        <div className="lg:col-span-6 p-6 bg-[#141517] flex flex-col space-y-5">
          {/* Score Header */}
          <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-code uppercase tracking-wider text-[#f54e00] font-semibold">
                  Mark Breakdown
                </span>
              </div>
              <h3 className="text-base font-normal text-[#f3f3f2] mt-0.5">
                Evaluation &amp; Mark Allocation
              </h3>
            </div>

            <div className="text-right">
              <div className="text-2xl font-semibold font-mono-code text-white">
                {evaluation?.marksAwarded ?? 0}{' '}
                <span className="text-sm font-normal text-[#686763]">/ {currentQuestion.totalMarks}</span>
              </div>
              <span className="text-[10px] font-mono-code text-emerald-400">
                {Math.round(((evaluation?.marksAwarded ?? 0) / currentQuestion.totalMarks) * 100)}% Awarded
              </span>
            </div>
          </div>

          {/* Examiner Notes */}
          {evaluation?.examinerNotes && (
            <div className="p-3.5 bg-[#0c0d0e] rounded-xl border border-white/[0.08] text-xs text-[#d6d5d1] leading-relaxed">
              <div className="font-semibold text-white mb-1 flex items-center gap-1.5 font-mono-code">
                <FileCheck className="w-3.5 h-3.5 text-[#f54e00]" />
                Senior Examiner Review Note:
              </div>
              <MathRenderer content={evaluation.examinerNotes} />
            </div>
          )}

          {/* Error Carried Forward Explanation Card */}
          {evaluation?.ecfApplied && evaluation.ecfExplanation && (
            <div className="p-3.5 bg-[#dfa88f]/10 border border-[#dfa88f]/30 rounded-xl text-xs text-[#dfa88f]">
              <div className="font-semibold text-[#dfa88f] flex items-center gap-1.5 mb-1 font-mono-code">
                <Sparkles className="w-4 h-4 text-[#dfa88f]" />
                IB Error Carried Forward (ECF) Protocol Triggered:
              </div>
              <MathRenderer content={evaluation.ecfExplanation} className="opacity-95" />
            </div>
          )}

          {/* Granular Mark Codes Breakdown Table */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9b9a95] block mb-2.5 font-mono-code">
              Official Markscheme Criteria:
            </span>
            <div className="space-y-2">
              {evaluation?.markBreakdown && evaluation.markBreakdown.length > 0 ? (
                evaluation.markBreakdown.map((mb, mIdx) => (
                  <div
                    key={mIdx}
                    className={`p-3 rounded-xl border transition-all text-xs ${
                      mb.awarded
                        ? 'bg-[#0c0d0e] border-white/[0.08] text-[#f3f3f2]'
                        : 'bg-[#cf2d56]/10 border-[#cf2d56]/20 text-[#f3f3f2]'
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
                        <span className="font-mono-code text-[11px] text-[#9b9a95]">
                          {mb.awarded ? `Awarded ${mb.marksAwarded}/${mb.maxMarks}m` : `Lost 0/${mb.maxMarks}m`}
                        </span>
                      </div>
                      {mb.awarded ? (
                        <span className="text-[10px] font-mono-code text-emerald-400 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> CREDITED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono-code text-[#cf2d56] font-semibold flex items-center gap-0.5">
                          <XCircle className="w-3 h-3" /> NOT SHOWN
                        </span>
                      )}
                    </div>
                    <div className="text-[#d6d5d1] leading-relaxed">
                      <MathRenderer content={mb.reason} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-5 bg-[#0c0d0e] border border-white/[0.08] rounded-xl text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs font-mono-code text-[#f3f3f2]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f54e00] animate-pulse" />
                    <span>Evaluation Queued in Background</span>
                  </div>
                  <p className="text-[11px] font-mono-code text-[#686763] max-w-sm mx-auto">
                    The Senior Examiner stream is currently grading earlier questions. This breakdown will populate automatically.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Targeted Revision Drill Advice */}
          {evaluation?.revisionRecommendation && (
            <div className="p-3.5 bg-[#0c0d0e] border border-white/[0.08] rounded-xl text-xs text-[#f3f3f2]">
              <div className="font-semibold text-[#f54e00] flex items-center gap-1.5 mb-1 font-mono-code">
                <Lightbulb className="w-3.5 h-3.5 text-[#f54e00]" />
                Targeted Syllabus Drill: {evaluation.syllabusSubtopic}
              </div>
              <MathRenderer content={evaluation.revisionRecommendation} className="text-[#9b9a95] mt-1" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
