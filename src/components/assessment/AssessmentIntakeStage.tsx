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
    label: 'Candidate Script Ingestion',
    detail: 'Reading handwritten stroke coordinates, high-res canvas buffers, and text responses',
    badge: 'READ',
    badgeClass: 'bg-[#9fbbe0]/10 border-[#9fbbe0]/20 text-[#9fbbe0]',
    icon: FileText,
  },
  {
    id: 'markscheme',
    label: 'Dual-Document Markscheme Alignment',
    detail: 'Indexing official M (Method), A (Accuracy), and R (Reasoning) mark criteria',
    badge: 'CODES',
    badgeClass: 'bg-[#c0a8dd]/10 border-[#c0a8dd]/20 text-[#c0a8dd]',
    icon: BookOpen,
  },
  {
    id: 'ocr',
    label: 'GLM-OCR Handwriting Transcription',
    detail: 'Transcribing mathematical notation, intermediate algebra, and calculus expressions',
    badge: 'INDEX',
    badgeClass: 'bg-[#9fc9a2]/10 border-[#9fc9a2]/20 text-[#9fc9a2]',
    icon: ScanLine,
  },
  {
    id: 'eval_q1',
    label: 'Question 1 Method & ECF Marking',
    detail: 'Senior Examiner evaluating Question 1 with Error Carried Forward protection',
    badge: 'THINKING',
    badgeClass: 'bg-[#dfa88f]/10 border-[#dfa88f]/20 text-[#dfa88f]',
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
      <div className="relative bg-[#141517] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl overflow-hidden">
        {/* Subtle radial ambient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#f54e00]/[0.05] rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Credentials */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-semibold tracking-wider uppercase bg-[#dfa88f]/10 border border-[#dfa88f]/20 text-[#dfa88f]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f54e00] animate-ping" />
                {isStreaming ? 'Senior Examiner Live Stream' : 'Senior Examiner Intake'}
              </span>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-[11px] font-mono-code text-[#9b9a95]">
                {session.id.slice(0, 16)}...
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl text-[#f3f3f2] font-normal tracking-tight">
              Initializing Method Evaluation
            </h2>
            <p className="text-xs text-[#9b9a95] font-mono-code">
              {manifest.title} • {manifest.category}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#0c0d0e] border border-white/[0.08] px-3 py-1.5 rounded-lg text-xs font-mono-code text-[#9b9a95] shrink-0">
            <Clock className="w-3.5 h-3.5 text-[#f54e00]" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Stream Error Notice if failed */}
        {streamError ? (
          <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-300">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{streamError}</span>
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 border border-rose-700/60 text-rose-100 rounded-lg font-mono-code transition text-xs"
            >
              Retry Ingestion
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
                      ? 'bg-[#1a1b1e]/60 border-emerald-500/20 text-[#f3f3f2]'
                      : isActive
                        ? 'bg-[#1a1b1e] border-[#f54e00]/40 shadow-sm shadow-[#f54e00]/5 text-white'
                        : 'bg-[#0c0d0e]/40 border-white/[0.04] text-[#686763] opacity-60'
                    }`}
                >
                  {/* Step Status Indicator */}
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : isActive ? (
                      <div className="w-6 h-6 rounded-full bg-[#f54e00]/15 border border-[#f54e00]/30 flex items-center justify-center text-[#f54e00]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#686763]">
                        <Icon className="w-3 h-3 text-[#686763]" />
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
                    <p className="text-[11px] font-mono-code text-[#9b9a95] leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live Status Bar & Completion Highlight */}
        <div className="relative z-10 pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono-code text-[11px] text-[#9b9a95]">
            {firstQuestionReady ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Question 1 graded • Transitioning to review workspace...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#f54e00]">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                {streamStatus || 'Senior Examiner parsing candidate solutions...'}
              </span>
            )}
          </div>

          {onSkip && !firstQuestionReady && (
            <button
              type="button"
              onClick={onSkip}
              className="text-[11px] font-mono-code text-[#686763] hover:text-[#9b9a95] transition flex items-center gap-1"
            >
              <span>Skip directly to workspace</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
