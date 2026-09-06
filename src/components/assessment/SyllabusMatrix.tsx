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
        badge: 'bg-[#1d6c5f]/15 text-[#1d6c5f] border-[#1d6c5f]/30',
        bar: 'bg-[#1d6c5f]',
        label: 'Strong (Grade 7 Standard)',
        icon: CheckCircle2,
      },
      developing: {
        badge: 'bg-[#8f530d]/15 text-[#8f530d] border-[#8f530d]/30',
        bar: 'bg-[#8f530d]',
        label: 'Making Progress (Grade 5-6)',
        icon: AlertCircle,
      },
      critical: {
        badge: 'bg-[#c64545]/15 text-[#c64545] border-[#c64545]/30',
        bar: 'bg-[#c64545]',
        label: 'Needs Practice',
        icon: AlertCircle,
      },
    }[itemStatus];
  };

  return (
    <div className="double-bezel-outer-cream">
      <div className="double-bezel-inner-cream p-6 transition-fluid">
        {/* Dynamic Header with Context & Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#e6dfd8] mb-6">
          <div>
            <h3 className="text-base font-normal text-[#141413] flex items-center gap-2">
              <Target className="w-4 h-4 text-[#a94e32]" />
              <span className="font-serif text-lg">
                Topic Strengths &amp; Recommended Practice
                {viewMode === 'focused' && activeQNum ? ` • Question ${activeQNum}` : ' • All Exam Topics'}
              </span>
            </h3>
            <p className="text-xs text-[#54524c] mt-0.5 font-mono-code">
              {viewMode === 'focused' && activeQuestion
                ? `Topic breakdown and practice tips for Question ${activeQNum} (${activeQuestion.totalMarks} marks)`
                : 'Summary of marks awarded across each official syllabus topic'}
            </p>
          </div>

          {/* View Mode Segmented Pill Control */}
          <div className="flex items-center gap-1 bg-[#faf9f5] p-1 rounded-xl border border-[#e6dfd8] text-xs font-mono-code shrink-0 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('focused')}
              className={`px-3 py-1.5 rounded-lg transition-fluid flex items-center gap-1.5 ${viewMode === 'focused'
                  ? 'bg-[#a94e32] text-white font-medium shadow-xs'
                  : 'text-[#54524c] hover:text-[#141413] hover:bg-[#efe9de]'
                }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Focus: Q{activeQNum ?? '1'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-fluid flex items-center gap-1.5 ${viewMode === 'all'
                  ? 'bg-[#a94e32] text-white font-medium shadow-xs'
                  : 'text-[#54524c] hover:text-[#141413] hover:bg-[#efe9de]'
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
                <div className="bg-[#faf9f5] border border-[#e6dfd8] rounded-xl p-5 space-y-4 shadow-2xs">
                  {/* Topic Title & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono-code uppercase px-2.5 py-0.5 rounded-full bg-[#a94e32]/10 text-[#a94e32] font-semibold border border-[#a94e32]/20">
                          Question {activeQNum} Syllabus Focus
                        </span>
                        {sharedQuestions.length > 0 && (
                          <span className="text-[10px] font-mono-code text-[#54524c] bg-[#efe9de] px-2 py-0.5 rounded border border-[#e6dfd8]">
                            Also tested in: {sharedQuestions.map((q) => `Q${q.number.replace(/^Question\s*/i, '')}`).join(', ')}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-[#141413] font-mono-code leading-snug">
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
                  <div className="space-y-1.5 bg-[#efe9de] p-3.5 rounded-xl border border-[#e6dfd8]">
                    <div className="flex justify-between text-xs font-mono-code text-[#54524c]">
                      <span>
                        Question Score: <strong className="text-[#141413]">{marksAwarded}</strong> / {totalMarks} marks
                      </span>
                      <span className="font-semibold text-[#141413]">{percentage}% Mastery</span>
                    </div>
                    <div className="w-full h-2 bg-[#e6dfd8] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusStyles.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Targeted Actionable Drill Recommendation */}
                  <div className="p-4 rounded-xl bg-[#efe9de] border border-[#e6dfd8] text-xs text-[#141413] leading-relaxed space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#a94e32] flex items-center gap-1.5 font-mono-code">
                        <BookOpen className="w-4 h-4 text-[#a94e32]" />
                        Practice Tip for Question {activeQNum}:
                      </span>
                      {activeEvaluation?.ecfApplied && (
                        <span className="text-[10px] font-mono-code text-[#8f530d] flex items-center gap-1 bg-[#8f530d]/15 border border-[#8f530d]/30 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3 text-[#8f530d]" /> Includes Follow-Through Notes
                        </span>
                      )}
                    </div>

                    <div className="text-[#54524c]">
                      <MathRenderer content={targetedDrill} />
                    </div>

                    {socraticLink && status !== 'mastered' && (
                      <div className="pt-2.5 border-t border-[#e6dfd8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[11px] font-mono-code text-[#54524c]">
                          Practice this type of question step by step with our tutor
                        </span>
                        <Link
                          href={socraticLink}
                          className="claude-btn-pill-primary text-xs px-3.5 py-1.5 shrink-0"
                        >
                          <span>Practice Question {activeQNum} with Tutor</span>
                          <span className="btn-icon-bubble">
                            <ArrowRight className="w-3.5 h-3.5 text-white" />
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            /* In-Flight State for Queued / Streaming Question */
            <div className="bg-[#faf9f5] border border-[#e6dfd8] rounded-xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-mono-code uppercase px-2.5 py-0.5 rounded-full bg-[#a94e32]/10 text-[#a94e32] font-semibold border border-[#a94e32]/20">
                  Question {activeQNum} • Topic Outline
                </span>
                <span className="text-[10px] font-mono-code px-2.5 py-0.5 rounded-full border border-[#8f530d]/30 bg-[#8f530d]/10 text-[#8f530d] flex items-center gap-1.5">
                  <Clock className="w-3 h-3 animate-spin" />
                  Examiner Marking in Progress
                </span>
              </div>
              <h4 className="text-sm font-medium text-[#141413] font-mono-code">
                {focusedSubtopic}
              </h4>
              <p className="text-xs text-[#54524c] font-mono-code">
                Your examiner is currently marking this question. Your score and practice tips will appear once it is ready.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. ALL TOPICS VIEW: Complete Exam Paper Matrix */}
      {viewMode === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono-code text-[#54524c]">
            <span>Showing all {syllabusBreakdown.length} topics on this exam paper</span>
            <button
              type="button"
              onClick={() => setViewMode('focused')}
              className="text-[#a94e32] hover:text-[#8f3f27] underline underline-offset-4 flex items-center gap-1"
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
                    className="bg-[#faf9f5] border border-[#e6dfd8] rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="text-xs font-semibold text-[#141413] font-mono-code leading-snug">
                          {item.subtopic}
                        </h4>
                        <span
                          className={`text-[10px] font-mono-code px-2.5 py-0.5 rounded-full border shrink-0 flex items-center gap-1 ${statusStyles.badge}`}
                        >
                          <Icon className="w-3 h-3" />
                          {statusStyles.label}
                        </span>
                      </div>

                      {/* Score and Bar */}
                      <div className="space-y-1.5 mt-2">
                        <div className="flex justify-between text-[11px] font-mono-code text-[#54524c]">
                          <span>
                            Score: <strong className="text-[#141413]">{item.marksAwarded}</strong> / {item.totalMarks} marks
                          </span>
                          <span className="font-semibold text-[#141413]">{item.percentage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#e6dfd8] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${statusStyles.bar} rounded-full transition-all duration-500`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actionable Drill Recommendation */}
                    <div className="p-3 rounded-lg bg-[#efe9de] border border-[#e6dfd8] text-[11px] text-[#141413] leading-relaxed">
                      <span className="font-semibold text-[#a94e32] block mb-1 flex items-center gap-1 font-mono-code">
                        <BookOpen className="w-3 h-3" /> Practice Tip:
                      </span>
                      <p className="line-clamp-2 text-[#54524c]">{item.targetedDrillPrompt}</p>

                      {paperId && item.status !== 'mastered' && (
                        <Link
                          href={`/learn/${paperId}`}
                          className="inline-flex items-center gap-1.5 text-[11px] font-mono-code text-[#a94e32] hover:text-[#8f3f27] mt-2 font-medium transition group"
                        >
                          <span>Practice with Tutor</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-spring" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 p-8 text-center bg-[#faf9f5] rounded-xl border border-[#e6dfd8] text-xs font-mono-code text-[#54524c]">
                Exam topics will appear here as each question is marked.
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
