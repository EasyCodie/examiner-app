'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QuestionItem, QuestionEvaluation } from '@/types/exam';
import { MathRenderer } from '@/components/common/MathRenderer';
import {
  Target,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Layers,
  Sparkles,
  Clock,
  ExternalLink,
} from 'lucide-react';

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
  paperId?: string;
  activeQuestion?: QuestionItem;
  activeEvaluation?: QuestionEvaluation;
  activeQuestionIndex?: number;
  allQuestions?: QuestionItem[];
}

export const SyllabusMatrix: React.FC<SyllabusMatrixProps> = ({
  syllabusBreakdown,
  paperId,
  activeQuestion,
  activeEvaluation,
  activeQuestionIndex,
  allQuestions,
}) => {
  const [viewMode, setViewMode] = useState<'focused' | 'all'>('focused');

  const activeQNum = activeQuestion
    ? activeQuestion.number.replace(/^Question\s*/i, '').trim()
    : undefined;

  // Find other questions on the paper that share this active subtopic
  const sharedQuestions =
    activeQuestion && allQuestions
      ? allQuestions.filter(
          (q, idx) =>
            idx !== activeQuestionIndex &&
            activeQuestion.syllabusSubtopic &&
            q.syllabusSubtopic &&
            (q.syllabusSubtopic.toLowerCase() === activeQuestion.syllabusSubtopic.toLowerCase() ||
              q.syllabusSubtopic.toLowerCase().includes(activeQuestion.syllabusSubtopic.toLowerCase()) ||
              activeQuestion.syllabusSubtopic.toLowerCase().includes(q.syllabusSubtopic.toLowerCase()))
        )
      : [];

  // Question-specific derived metrics for focused view
  const focusedSubtopic =
    activeEvaluation?.syllabusSubtopic ||
    activeQuestion?.syllabusSubtopic ||
    'General IB Syllabus';

  const isEvaluated = Boolean(activeEvaluation);
  const marksAwarded = activeEvaluation?.marksAwarded ?? 0;
  const totalMarks = activeEvaluation?.maxMarks ?? activeQuestion?.totalMarks ?? 1;
  const percentage = totalMarks > 0 ? Math.round((marksAwarded / totalMarks) * 100) : 0;
  const status: 'mastered' | 'developing' | 'critical' =
    percentage >= 80 ? 'mastered' : percentage >= 50 ? 'developing' : 'critical';

  const targetedDrill =
    activeEvaluation?.revisionRecommendation ||
    `Review key syllabus principles and standard question archetypes in ${focusedSubtopic}.`;

  const socraticLink = paperId
    ? `/learn/${paperId}?question=${activeQuestionIndex ?? 0}`
    : undefined;

  const getStatusStyles = (itemStatus: 'mastered' | 'developing' | 'critical') => {
    return {
      mastered: {
        badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        bar: 'bg-emerald-500',
        label: 'Mastered (Level 7)',
        icon: CheckCircle2,
      },
      developing: {
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        bar: 'bg-amber-500',
        label: 'Developing (Level 5-6)',
        icon: AlertCircle,
      },
      critical: {
        badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        bar: 'bg-[#cf2d56]',
        label: 'Critical Revision Needed',
        icon: AlertCircle,
      },
    }[itemStatus];
  };

  return (
    <div className="bg-[#141517] border border-white/[0.08] rounded-2xl p-6 shadow-2xl transition-all">
      {/* Dynamic Header with Context & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] mb-6">
        <div>
          <h3 className="text-base font-normal text-[#f3f3f2] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#f54e00]" />
            <span>
              Syllabus Subtopic Weakness Matrix &amp; Actionable Drills
              {viewMode === 'focused' && activeQNum ? ` • Question ${activeQNum}` : ' • All Exam Topics'}
            </span>
          </h3>
          <p className="text-xs text-[#9b9a95] mt-0.5 font-mono-code">
            {viewMode === 'focused' && activeQuestion
              ? `Examiner-grade curriculum diagnosis focused on Question ${activeQNum} (${activeQuestion.totalMarks} marks)`
              : 'Examiner-grade diagnosis mapping points awarded across all official IB curriculum subtopics'}
          </p>
        </div>

        {/* View Mode Segmented Pill Control */}
        <div className="flex items-center gap-1 bg-[#0c0d0e] p-1 rounded-xl border border-white/[0.08] text-xs font-mono-code shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('focused')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'focused'
                ? 'bg-[#f54e00] text-white font-semibold shadow-sm'
                : 'text-[#9b9a95] hover:text-[#f3f3f2] hover:bg-white/[0.04]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Focus: Q{activeQNum ?? '1'}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'all'
                ? 'bg-[#f54e00] text-white font-semibold shadow-sm'
                : 'text-[#9b9a95] hover:text-[#f3f3f2] hover:bg-white/[0.04]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Exam Topics ({syllabusBreakdown.length || '...'})</span>
          </button>
        </div>
      </div>

      {/* 1. FOCUSED VIEW: Question-Specific Diagnosis Card */}
      {viewMode === 'focused' && (
        <div>
          {isEvaluated ? (
            (() => {
              const statusStyles = getStatusStyles(status);
              const Icon = statusStyles.icon;

              return (
                <div className="bg-[#0c0d0e] border border-white/[0.08] rounded-xl p-5 space-y-4">
                  {/* Topic Title & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded bg-white/[0.06] text-[#f54e00] font-semibold border border-white/[0.06]">
                          Question {activeQNum} Syllabus Focus
                        </span>
                        {sharedQuestions.length > 0 && (
                          <span className="text-[10px] font-mono-code text-[#9b9a95] bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                            Also tested in: {sharedQuestions.map((q) => `Q${q.number.replace(/^Question\s*/i, '')}`).join(', ')}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-[#f3f3f2] font-mono-code leading-snug">
                        {focusedSubtopic}
                      </h4>
                    </div>

                    <span
                      className={`text-[11px] font-mono-code px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1.5 self-start ${statusStyles.badge}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {statusStyles.label}
                    </span>
                  </div>

                  {/* Score Breakdown & Progress Bar */}
                  <div className="space-y-1.5 bg-[#141517] p-3.5 rounded-lg border border-white/[0.04]">
                    <div className="flex justify-between text-xs font-mono-code text-[#9b9a95]">
                      <span>
                        Question Score: <strong className="text-white">{marksAwarded}</strong> / {totalMarks} marks
                      </span>
                      <span className="font-semibold text-white">{percentage}% Mastery</span>
                    </div>
                    <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusStyles.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Targeted Actionable Drill Recommendation */}
                  <div className="p-4 rounded-lg bg-[#141517] border border-white/[0.06] text-xs text-[#d6d5d1] leading-relaxed space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#f54e00] flex items-center gap-1.5 font-mono-code">
                        <BookOpen className="w-4 h-4 text-[#f54e00]" />
                        Targeted Practice Drill for Question {activeQNum}:
                      </span>
                      {activeEvaluation?.ecfApplied && (
                        <span className="text-[10px] font-mono-code text-[#dfa88f] flex items-center gap-1 bg-[#dfa88f]/10 border border-[#dfa88f]/20 px-2 py-0.5 rounded">
                          <Sparkles className="w-3 h-3" /> ECF Context Included
                        </span>
                      )}
                    </div>

                    <div className="text-[#9b9a95]">
                      <MathRenderer content={targetedDrill} />
                    </div>

                    {socraticLink && status !== 'mastered' && (
                      <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[11px] font-mono-code text-[#686763]">
                          Practice step-by-step guidance on this specific problem archetype
                        </span>
                        <Link
                          href={socraticLink}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f54e00]/10 hover:bg-[#f54e00]/20 border border-[#f54e00]/30 text-xs font-mono-code text-[#f54e00] font-medium transition shrink-0"
                        >
                          <span>Launch Targeted Socratic Practice on Q{activeQNum}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            /* In-Flight State for Queued / Streaming Question */
            <div className="bg-[#0c0d0e] border border-white/[0.08] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded bg-white/[0.06] text-[#9b9a95] font-semibold border border-white/[0.06]">
                  Question {activeQNum} • Topic Outline
                </span>
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 animate-spin" />
                  Examiner Marking in Progress
                </span>
              </div>
              <h4 className="text-sm font-medium text-[#f3f3f2] font-mono-code">
                {focusedSubtopic}
              </h4>
              <p className="text-xs text-[#686763] font-mono-code">
                The Senior Examiner is currently evaluating this question attempt. The diagnostic score and targeted syllabus drill will populate automatically upon completion.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. ALL TOPICS VIEW: Complete Exam Paper Matrix */}
      {viewMode === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono-code text-[#9b9a95]">
            <span>Showing all {syllabusBreakdown.length} syllabus subtopics evaluated across the paper</span>
            <button
              type="button"
              onClick={() => setViewMode('focused')}
              className="text-[#f54e00] hover:text-[#ff6a24] underline underline-offset-4 flex items-center gap-1"
            >
              <span>Return to Question {activeQNum ?? '1'} Focus</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {syllabusBreakdown.length > 0 ? (
              syllabusBreakdown.map((item, idx) => {
                const statusStyles = getStatusStyles(item.status);
                const Icon = statusStyles.icon;

                return (
                  <div
                    key={idx}
                    className="bg-[#0c0d0e] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="text-xs font-semibold text-[#f3f3f2] font-mono-code leading-snug">
                          {item.subtopic}
                        </h4>
                        <span
                          className={`text-[10px] font-mono-code px-2 py-0.5 rounded-full border shrink-0 flex items-center gap-1 ${statusStyles.badge}`}
                        >
                          <Icon className="w-3 h-3" />
                          {statusStyles.label}
                        </span>
                      </div>

                      {/* Score and Bar */}
                      <div className="space-y-1.5 mt-2">
                        <div className="flex justify-between text-[11px] font-mono-code text-[#9b9a95]">
                          <span>
                            Score: <strong className="text-white">{item.marksAwarded}</strong> / {item.totalMarks} marks
                          </span>
                          <span className="font-semibold text-white">{item.percentage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${statusStyles.bar} rounded-full transition-all duration-500`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actionable Drill Recommendation */}
                    <div className="p-3 rounded-lg bg-[#141517] border border-white/[0.06] text-[11px] text-[#d6d5d1] leading-relaxed">
                      <span className="font-semibold text-[#f54e00] block mb-1 flex items-center gap-1 font-mono-code">
                        <BookOpen className="w-3 h-3" /> Targeted Practice Drill:
                      </span>
                      <p className="line-clamp-2 text-[#9b9a95]">{item.targetedDrillPrompt}</p>

                      {paperId && item.status !== 'mastered' && (
                        <Link
                          href={`/learn/${paperId}`}
                          className="inline-flex items-center gap-1 text-[11px] font-mono-code text-[#f54e00] hover:text-[#ff6a24] mt-2 font-medium transition"
                        >
                          <span>Launch Targeted Socratic Practice</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 p-8 text-center bg-[#0c0d0e] rounded-xl border border-white/[0.08] text-xs font-mono-code text-[#686763]">
                Exam topics are currently being aggregated by the Senior Examiner stream.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
