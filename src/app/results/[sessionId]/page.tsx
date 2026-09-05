'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ExamSession, ExamManifest, QuestionEvaluation } from '@/types/exam';
import { getExamSession, getManifestById, saveExamSession, getAiConfig } from '@/lib/storage';
import { useAppShell } from '@/components/common/AppShell';
import { GradeBoundaryCard } from '@/components/assessment/GradeBoundaryCard';
import { ExaminerReview } from '@/components/assessment/ExaminerReview';
import { SyllabusMatrix } from '@/components/assessment/SyllabusMatrix';
import { AssessmentIntakeStage } from '@/components/assessment/AssessmentIntakeStage';
import { synthesizeSyllabusBreakdown } from '@/lib/assessment/evaluator';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Compass,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';

export default function ResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const isEvaluatingParam = searchParams.get('evaluating') === 'true';

  const { setHeaderInfo } = useAppShell();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [manifest, setManifest] = useState<ExamManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  // Satisfying animated intake stage until Question 1 is graded
  const [intakeStageActive, setIntakeStageActive] = useState<boolean>(isEvaluatingParam);
  const [intakeTransitioningOut, setIntakeTransitioningOut] = useState<boolean>(false);
  const [skipIntake, setSkipIntake] = useState<boolean>(false);

  // Live streaming evaluation state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string>('');
  const [liveEvaluations, setLiveEvaluations] = useState<QuestionEvaluation[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);

  const streamInitiatedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startEvaluationStream = useCallback(async (m: ExamManifest, s: ExamSession) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsStreaming(true);
    setStreamStatus('Connecting to Senior Examiner assessment stream...');
    setStreamError(null);

    try {
      const cfg = await getAiConfig();
      const res = await fetch('/api/evaluate-session', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { 'x-gemini-key': cfg.apiKey } : {}),
          ...(cfg.zaiApiKey ? { 'x-zai-key': cfg.zaiApiKey } : {}),
        },
        body: JSON.stringify({
          manifest: m,
          submissions: s.submissions || {},
          sessionId: s.id,
          timeRemainingSeconds: s.timeRemainingSeconds,
          thinkingBudget: cfg.thinkingBudgetGrading || 8192,
        }),
      });

      if (!res.ok || !res.body) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to initiate assessment stream.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (controller.signal.aborted) {
          await reader.cancel().catch(() => {});
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || controller.signal.aborted) continue;
          try {
            const event = JSON.parse(line);

            if (event.type === 'question_evaluated') {
              const evalItem: QuestionEvaluation = event.evaluation;
              setLiveEvaluations((prev) => {
                const next = [...prev, evalItem];
                return next;
              });

              setStreamStatus(
                `Question ${event.questionNumber} graded (${event.questionIndex + 1}/${event.totalQuestions}) • Review feedback below while remaining questions mark...`
              );
            } else if (event.type === 'session_complete') {
              const completedSession: ExamSession = event.session;
              setSession(completedSession);
              await saveExamSession(completedSession);
              setIsStreaming(false);
              setStreamStatus('Assessment complete!');

              try {
                confetti({
                  particleCount: 90,
                  spread: 70,
                  origin: { y: 0.6 },
                });
              } catch {
                // ignore
              }
            } else if (event.type === 'error') {
              throw new Error(event.message || 'Stream reported evaluation failure.');
            }
          } catch (jsonErr) {
            console.warn('Failed parsing stream chunk:', line, jsonErr);
          }
        }
      }
    } catch (err: unknown) {
      if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
        return;
      }
      console.error('Streaming assessment error:', err);
      const msg = err instanceof Error ? err.message : 'Error streaming exam evaluation.';
      setStreamError(msg);
      setIsStreaming(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    getExamSession(sessionId).then((s) => {
      if (s) {
        setSession(s);
        getManifestById(s.paperId).then((m) => {
          if (m) {
            setManifest(m);
            setHeaderInfo({
              paperTitle: m.title,
              category: m.category,
              paperId: m.id,
            });

            // If session is already finalized with grading results, display immediately
            if (s.gradingResults && s.gradingResults.evaluations.length > 0) {
              setIntakeStageActive(false);
              setLoading(false);
              return;
            }

            // Otherwise, if evaluating query param is set, trigger streaming evaluation
            if (isEvaluatingParam && !streamInitiatedRef.current) {
              streamInitiatedRef.current = true;
              setIntakeStageActive(true);
              setLoading(false);
              startEvaluationStream(m, s);
            } else {
              setIntakeStageActive(false);
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });
  }, [sessionId, isEvaluatingParam, setHeaderInfo, startEvaluationStream]);

  // Satisfying exit animation once Question 1 is evaluated
  useEffect(() => {
    if (liveEvaluations.length >= 1 && intakeStageActive && !intakeTransitioningOut) {
      // 700ms grace period so the user sees the Q1 checkmark and celebration
      const timer = setTimeout(() => {
        setIntakeTransitioningOut(true);
        // 400ms transition exit
        const exitTimer = setTimeout(() => {
          setIntakeStageActive(false);
        }, 400);
        return () => clearTimeout(exitTimer);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [liveEvaluations.length, intakeStageActive, intakeTransitioningOut]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <Sparkles className="w-8 h-8 text-[var(--cursor-primary)] animate-spin mx-auto" />
          <p className="text-sm font-mono-code text-[var(--cursor-text-muted)]">Loading examination session...</p>
        </div>
      </div>
    );
  }

  if (!session || !manifest) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-[#cf2d56] mx-auto" />
        <h2 className="text-xl font-medium text-[var(--cursor-text-strong)]">Assessment Session Not Found</h2>
        <p className="text-xs text-[var(--cursor-text-muted)] max-w-md">
          The requested exam evaluation could not be loaded from local storage.
        </p>
        <Link
          href="/"
          className="px-4 py-2 cursor-btn-primary rounded-xl text-xs font-medium text-white transition"
        >
          Return to Exam Library
        </Link>
      </div>
    );
  }

  const effectiveEvaluations = session.gradingResults?.evaluations || liveEvaluations;
  const isFinished = Boolean(session.gradingResults && session.gradingResults.evaluations.length > 0);
  const ecfCount = effectiveEvaluations.filter((e) => e.ecfApplied).length;
  const totalQuestions = manifest.questions.length;
  const progressPct = totalQuestions > 0 ? Math.round((effectiveEvaluations.length / totalQuestions) * 100) : 0;
  const firstQuestionReady = liveEvaluations.length >= 1;

  const activeQuestion = manifest.questions[selectedQuestionIndex] || manifest.questions[0];
  const activeEvaluation = effectiveEvaluations.find(
    (e) =>
      e.questionId === activeQuestion?.id ||
      e.questionNumber === activeQuestion?.number ||
      e.questionNumber?.replace(/^Question\s*/i, '').trim() === activeQuestion?.number.replace(/^Question\s*/i, '').trim()
  ) || effectiveEvaluations[selectedQuestionIndex];

  const syllabusBreakdown =
    session.gradingResults?.syllabusBreakdown ||
    synthesizeSyllabusBreakdown(effectiveEvaluations);

  // Satisfying Senior Examiner Intake Stage until Question 1 is ready
  if (intakeStageActive && !skipIntake) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 min-h-[75vh]">
        <div
          className={`w-full transition-all duration-400 ease-out ${
            intakeTransitioningOut
              ? 'opacity-0 scale-[0.97] -translate-y-3 pointer-events-none'
              : 'opacity-100 scale-100 translate-y-0'
          }`}
        >
          <AssessmentIntakeStage
            manifest={manifest}
            session={session}
            isStreaming={isStreaming}
            streamStatus={streamStatus}
            streamError={streamError}
            firstQuestionReady={firstQuestionReady}
            onRetry={() => startEvaluationStream(manifest, session)}
            onSkip={() => setSkipIntake(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8 select-text animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/"
              className="text-xs text-[#9b9a95] hover:text-[#f3f3f2] flex items-center gap-1 font-mono-code transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
            <span className="text-white/20">•</span>
            {isFinished ? (
              <span className="text-[10px] font-mono-code font-semibold uppercase tracking-wider text-[#9fc9a2] bg-[#9fc9a2]/10 border border-[#9fc9a2]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Senior Examiner Grading Complete
              </span>
            ) : (
              <span className="text-[10px] font-mono-code font-semibold uppercase tracking-wider text-[var(--cursor-primary)] bg-[var(--cursor-primary-soft)] border border-[var(--cursor-primary)]/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> Live Grading In Progress
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl text-[var(--cursor-text-strong)] tracking-tight">
            {manifest.title}
          </h1>
          <p className="text-xs text-[var(--cursor-text-faint)] font-mono-code mt-0.5">
            Submitted on {new Date(session.submittedAt || session.startedAt).toLocaleString()} • {session.subjectCategory}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/learn/${manifest.id}`}
            className="px-3 py-1.5 cursor-btn-secondary text-xs font-mono-code flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-[var(--diplomatic-azure)]" />
            <span>Socratic Revision</span>
          </Link>

          <Link
            href={`/mock/${manifest.id}`}
            className="px-3.5 py-1.5 cursor-btn-primary text-xs font-mono-code flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Exam</span>
          </Link>
        </div>
      </div>

      {/* Live Stream Progress HUD (when evaluating) */}
      {isStreaming && (
        <div className="bg-[var(--cursor-surface-card)] border border-[var(--cursor-primary)]/30 rounded-xl p-4 sm:p-5 space-y-3 shadow-lg animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-[var(--cursor-primary)] animate-spin shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                  <span>Senior Examiner Live Evaluation</span>
                  {effectiveEvaluations.length >= 1 && (
                    <span className="text-[10px] font-mono-code font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Question 1 Unlocked
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[var(--cursor-text-muted)] font-mono-code mt-0.5">
                  {streamStatus}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono-code text-[var(--cursor-primary)] font-bold">
                {effectiveEvaluations.length} of {totalQuestions} Questions Evaluated
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-[var(--cursor-canvas)] rounded-full overflow-hidden border border-white/[0.06]">
              <div
                className="h-full bg-[var(--cursor-primary)] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(5, progressPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono-code text-[var(--cursor-text-faint)]">
              <span>Review Question 1 below while remaining questions stream in background</span>
              <span>{progressPct}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Stream Error Notice */}
      {streamError && (
        <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-4 flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Evaluation Stream Notice:</span> {streamError}
          </div>
          <button
            type="button"
            onClick={() => startEvaluationStream(manifest, session)}
            className="px-3 py-1 bg-rose-900/50 hover:bg-rose-900 border border-rose-700/50 rounded text-rose-200 font-mono-code text-[11px]"
          >
            Retry Stream
          </button>
        </div>
      )}

      {/* 1. IB 1-7 Predicted Grade & Score Card (Unlocked when completed) */}
      {isFinished && session.gradingResults ? (
        <section>
          <GradeBoundaryCard
            totalAwarded={session.gradingResults.totalMarksAwarded}
            totalPossible={session.gradingResults.totalPossibleMarks}
            percentage={session.gradingResults.percentage}
            predictedGrade={session.gradingResults.predictedGrade}
            boundaries={manifest.gradeBoundaries}
            ecfCount={ecfCount}
          />
        </section>
      ) : (
        <section className="bg-[var(--cursor-surface-card)] border border-white/[0.08] rounded-2xl p-6 text-center space-y-2.5">
          <div className="flex items-center justify-center gap-2 text-[var(--cursor-text-muted)] font-mono-code text-xs">
            <Clock className="w-4 h-4 text-[var(--cursor-primary)]" />
            <span>Predicted IB 1–7 Grade Boundaries and Syllabus Mastery Matrix calculate once all questions finalize</span>
          </div>
          <p className="text-[11px] text-[var(--cursor-text-faint)] font-mono-code">
            Question-level examiner marking and Error Carried Forward notes are live below for immediate inspection.
          </p>
        </section>
      )}

      {/* 2. Side-by-Side Examiner Review (Instant feedback on Q1 while Q2..N stream) */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-normal text-[var(--cursor-text-strong)] flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[var(--cursor-primary)]" />
            Examiner Question Review &amp; Mark Breakdown
          </h2>
          <p className="text-xs text-[var(--cursor-text-muted)] font-mono-code">
            Inspect each question attempt with red margin annotations and individual method/accuracy mark codes
          </p>
        </div>

        <ExaminerReview
          questions={manifest.questions}
          submissions={session.submissions || {}}
          evaluations={effectiveEvaluations}
          selectedIndex={selectedQuestionIndex}
          onSelectIndex={setSelectedQuestionIndex}
        />
      </section>

      {/* 3. Syllabus Subtopic Weakness Matrix & Targeted Actionable Drills */}
      <section>
        <SyllabusMatrix
          syllabusBreakdown={syllabusBreakdown}
          paperId={manifest.id}
          activeQuestion={activeQuestion}
          activeEvaluation={activeEvaluation}
          activeQuestionIndex={selectedQuestionIndex}
          allQuestions={manifest.questions}
        />
      </section>
    </div>
  );
}
