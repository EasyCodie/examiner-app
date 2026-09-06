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
    setStreamStatus('Your examiner is reviewing your exam...');
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
        throw new Error(errorText || 'Could not start grading stream.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (controller.signal.aborted) {
          await reader.cancel().catch(() => { });
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
                `Question ${event.questionNumber} is marked (${event.questionIndex + 1}/${event.totalQuestions}). Read your feedback below while the remaining questions are reviewed.`
              );
            } else if (event.type === 'session_complete') {
              const completedSession: ExamSession = event.session;
              setSession(completedSession);
              await saveExamSession(completedSession);
              setIsStreaming(false);
              setStreamStatus('Grading complete!');

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
              throw new Error(event.message || 'There was an issue grading this question.');
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
      const msg = err instanceof Error ? err.message : 'There was an issue marking your exam.';
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
      <div className="flex-1 flex items-center justify-center p-8 bg-[#faf9f5]">
        <div className="text-center space-y-3">
          <Sparkles className="w-8 h-8 text-[#cc785c] animate-spin mx-auto" />
          <p className="text-sm font-mono-code text-[#6b6963]">Loading your exam results...</p>
        </div>
      </div>
    );
  }

  if (!session || !manifest) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-[#faf9f5]">
        <AlertCircle className="w-12 h-12 text-[#c64545] mx-auto" />
        <h2 className="text-xl font-serif text-[#141413]">Exam Session Not Found</h2>
        <p className="text-xs text-[#6b6963] max-w-md">
          We couldn&apos;t find this completed exam in your browser storage.
        </p>
        <Link
          href="/"
          className="px-4 py-2 claude-btn-primary rounded-xl text-xs font-medium text-white transition"
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
          className={`w-full transition-all duration-400 ease-out ${intakeTransitioningOut
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e6dfd8] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/"
              className="text-xs text-[#54524c] hover:text-[#141413] flex items-center gap-1 font-mono-code transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
            <span className="text-[#e6dfd8]">•</span>
            {isFinished ? (
              <span className="text-[10px] font-mono-code font-semibold uppercase tracking-wider text-[#1d6c5f] bg-[#1d6c5f]/15 border border-[#1d6c5f]/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#1d6c5f]" /> Grading Complete
              </span>
            ) : (
              <span className="text-[10px] font-mono-code font-semibold uppercase tracking-wider text-[#a94e32] bg-[#a94e32]/10 border border-[#a94e32]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> Marking in Progress
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif text-[#141413] tracking-tight">
            {manifest.title}
          </h1>
          <p className="text-xs text-[#54524c] font-mono-code mt-1">
            Submitted on {new Date(session.submittedAt || session.startedAt).toLocaleString()} • {session.subjectCategory}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/learn/${manifest.id}`}
            className="claude-btn-pill-secondary text-xs px-4 py-2"
          >
            <span className="btn-icon-bubble bg-[#efe9de] text-[#a94e32]">
              <Compass className="w-3.5 h-3.5 text-[#a94e32]" />
            </span>
            <span>Socratic Revision</span>
          </Link>

          <Link
            href={`/mock/${manifest.id}`}
            className="claude-btn-pill-primary text-xs px-4 py-2"
          >
            <span>Retake Exam</span>
            <span className="btn-icon-bubble">
              <RotateCcw className="w-3.5 h-3.5 text-white" />
            </span>
          </Link>
        </div>
      </div>

      {/* Live Stream Progress HUD (when evaluating) */}
      {isStreaming && (
        <div className="double-bezel-outer-dark">
          <div className="double-bezel-inner-dark p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-[#cc785c] animate-spin shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-white tracking-tight flex items-center gap-2">
                    <span>Examiner Marking in Progress</span>
                    {effectiveEvaluations.length >= 1 && (
                      <span className="eyebrow-pill text-[#5db8a6] bg-[#5db8a6]/15 border border-[#5db8a6]/30 px-2 py-0.5">
                        Question 1 Ready
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#a09d96] font-mono-code mt-0.5">
                    {streamStatus}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="eyebrow-pill bg-[#cc785c]/15 text-[#cc785c] border border-[#cc785c]/30 px-3 py-1">
                  {effectiveEvaluations.length} of {totalQuestions} Questions Marked
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2 bg-[#252320] rounded-full overflow-hidden border border-white/10 p-0.5 relative">
                <div
                  className="h-full bg-linear-to-r from-[#cc785c] to-[#e8a55a] rounded-full transition-fluid duration-500 shadow-[0_0_10px_rgba(204,120,92,0.4)] relative overflow-hidden"
                  style={{ width: `${Math.max(5, progressPct)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-beam-scan pointer-events-none" />
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-mono-code text-[#a09d96]">
                <span>Read your Question 1 feedback below while the remaining questions are reviewed</span>
                <span>{progressPct}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stream Error Notice */}
      {streamError && (
        <div className="bg-[#c64545]/15 border border-[#c64545]/30 rounded-xl p-4 flex items-center gap-3 text-xs text-[#c64545]">
          <AlertCircle className="w-4 h-4 text-[#c64545] shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Marking Notice:</span> {streamError}
          </div>
          <button
            type="button"
            onClick={() => startEvaluationStream(manifest, session)}
            className="px-3 py-1 bg-[#c64545]/20 hover:bg-[#c64545]/30 border border-[#c64545]/40 rounded-lg text-white font-mono-code text-[11px]"
          >
            Try Again
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
        <section className="double-bezel-outer-cream">
          <div className="double-bezel-inner-cream p-6 text-center space-y-2 text-[#141413]">
            <div className="flex items-center justify-center gap-2 text-[#54524c] font-mono-code text-xs">
              <Clock className="w-4 h-4 text-[#a94e32]" />
              <span>Your predicted 1-7 grade and topic strengths will calculate once all questions are marked</span>
            </div>
            <p className="text-[11px] text-[#54524c] font-mono-code">
              Examiner feedback and method marks are ready below for you to review.
            </p>
          </div>
        </section>
      )}

      {/* 2. Side-by-Side Examiner Review (Instant feedback on Q1 while Q2..N stream) */}
      <section>
        <div className="mb-3">
          <h2 className="text-xl font-serif font-normal text-[#141413] flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#a94e32]" />
            Question Review &amp; Examiner Marks
          </h2>
          <p className="text-xs text-[#54524c] font-mono-code">
            See where marks were awarded, with examiner margin notes and method marks
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
