'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  FileText,
  BookOpen,
  ScanLine,
  ShieldCheck,
  Clock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { ExamManifest, ExamSession } from '@/types/exam';

interface AssessmentIntakeStageProps {
  manifest: ExamManifest;
  session: ExamSession;
  isStreaming: boolean;
  streamStatus: string;
  streamError: string | null;
  firstQuestionReady: boolean;
  onRetry: () => void;
  onSkip?: () => void;
}

interface IntakeStep {
  id: string;
  label: string;
  detail: string;
  badge: string;
  badgeClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

const INTAKE_STEPS: IntakeStep[] = [
  {
    id: 'ingest',
    label: 'Opening your exam paper',
    detail: 'Checking your answers, sketches, and written steps',
    badge: 'READY',
    badgeClass: 'bg-[#5db8a6]/15 border-[#5db8a6]/30 text-[#5db8a6]',
    icon: FileText,
  },
  {
    id: 'markscheme',
    label: 'Loading official markscheme',
    detail: 'Matching question parts and mark allocations',
    badge: 'CRITERIA',
    badgeClass: 'bg-[#cc785c]/15 border-[#cc785c]/30 text-[#cc785c]',
    icon: BookOpen,
  },
  {
    id: 'ocr',
    label: 'Reading your handwriting',
    detail: 'Transcribing math formulas, working, and diagrams',
    badge: 'SCAN',
    badgeClass: 'bg-[#e8a55a]/15 border-[#e8a55a]/30 text-[#e8a55a]',
    icon: ScanLine,
  },
  {
    id: 'eval_q1',
    label: 'Marking Question 1',
    detail: 'Reviewing your method and checking follow-through marks',
    badge: 'MARKING',
    badgeClass: 'bg-[#cc785c]/15 border-[#cc785c]/30 text-[#cc785c]',
    icon: ShieldCheck,
  },
];

export const AssessmentIntakeStage: React.FC<AssessmentIntakeStageProps> = ({
  manifest,
  session,
  isStreaming,
  streamStatus,
  streamError,
  firstQuestionReady,
  onRetry,
  onSkip,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Live stopwatch timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 0.1);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Progressive milestone index derived purely from timer & readiness
  const activeStepIndex = firstQuestionReady
    ? 4
    : elapsedSeconds > 3.2
      ? 3
      : elapsedSeconds > 2.0
        ? 2
        : elapsedSeconds > 0.8
          ? 1
          : 0;

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = (secs % 60).toFixed(1);
    return `${mins.toString().padStart(2, '0')}:${parseFloat(s) < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8 sm:py-16 px-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="relative bg-[#181715] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl overflow-hidden">
        {/* Subtle radial ambient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#cc785c]/[0.05] rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Credentials */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-semibold tracking-wider uppercase bg-[#cc785c]/10 border border-[#cc785c]/20 text-[#cc785c]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#cc785c] animate-ping" />
                {isStreaming ? 'Examiner Review in Progress' : 'Preparing Examiner Review'}
              </span>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-[11px] font-mono-code text-[#a09d96]">
                {session.id.slice(0, 16)}...
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl text-[#faf9f5] font-serif font-normal tracking-tight">
              Reviewing Your Exam Paper
            </h2>
            <p className="text-xs text-[#a09d96] font-mono-code">
              {manifest.title} • {manifest.category}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#252320] border border-white/10 px-3 py-1.5 rounded-lg text-xs font-mono-code text-[#a09d96] shrink-0">
            <Clock className="w-3.5 h-3.5 text-[#cc785c]" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Stream Error Notice if failed */}
        {streamError ? (
          <div className="bg-[#c64545]/15 border border-[#c64545]/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#c64545]">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#c64545] shrink-0" />
              <span>{streamError}</span>
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1.5 bg-[#c64545]/20 hover:bg-[#c64545]/30 border border-[#c64545]/40 text-white rounded-lg font-mono-code transition text-xs"
            >
              Try Again
            </button>
          </div>
        ) : (
          /* Intake Pipeline Milestones */
          <div className="space-y-3 relative z-10">
            {INTAKE_STEPS.map((step, idx) => {
              const isCompleted = activeStepIndex > idx || firstQuestionReady;
              const isActive = activeStepIndex === idx && !firstQuestionReady;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-300 ${isCompleted
                      ? 'bg-[#252320]/60 border-[#5db8a6]/25 text-[#faf9f5]'
                      : isActive
                        ? 'bg-[#252320] border-[#cc785c]/50 shadow-sm text-white'
                        : 'bg-[#181715]/40 border-white/5 text-[#a09d96] opacity-50'
                    }`}
                >
                  {/* Step Status Indicator */}
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-[#5db8a6]/15 border border-[#5db8a6]/30 flex items-center justify-center text-[#5db8a6]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : isActive ? (
                      <div className="w-6 h-6 rounded-full bg-[#cc785c]/15 border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#a09d96]">
                        <Icon className="w-3.5 h-3.5 text-[#a09d96]" />
                      </div>
                    )}
                  </div>

                  {/* Step Description */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium tracking-tight">
                        {step.label}
                      </span>
                      <span
                        className={`text-[9px] font-mono-code uppercase font-semibold px-1.5 py-0.5 rounded border ${step.badgeClass}`}
                      >
                        {step.badge}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono-code text-[#a09d96] leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live Status Bar & Completion Highlight */}
        <div className="relative z-10 pt-2 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono-code text-[11px] text-[#a09d96]">
            {firstQuestionReady ? (
              <span className="text-[#5db8a6] flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Question 1 is marked. Opening your review...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#cc785c]">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                {streamStatus || 'Reading your answers...'}
              </span>
            )}
          </div>

          {onSkip && !firstQuestionReady && (
            <button
              type="button"
              onClick={onSkip}
              className="text-[11px] font-mono-code text-[#a09d96] hover:text-[#faf9f5] transition flex items-center gap-1"
            >
              <span>Skip directly to results</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
