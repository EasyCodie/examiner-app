'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ExamSession, ExamManifest, QuestionGrading } from '@/types/exam';
import { getExamSession, getManifestById, saveExamSession, getAiConfig } from '@/lib/storage';
import { useAppShell } from '@/components/common/AppShell';
import { GradeBoundaryCard } from '@/components/assessment/GradeBoundaryCard';
import { ExaminerReview } from '@/components/assessment/ExaminerReview';
import { SyllabusMatrix } from '@/components/assessment/SyllabusMatrix';
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

  // Live streaming evaluation state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string>('');
  const [liveEvaluations, setLiveEvaluations] = useState<QuestionGrading[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);

  const streamInitiatedRef = useRef(false);

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
              setLoading(false);
              return;
            }

            // Otherwise, if evaluating query param is set, trigger streaming evaluation
            if (isEvaluatingParam && !streamInitiatedRef.current) {
              streamInitiatedRef.current = true;
              setLoading(false);
              startEvaluationStream(m, s);
            } else {
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
  }, [sessionId, isEvaluatingParam, setHeaderInfo]);

  const startEvaluationStream = async (m: ExamManifest, s: ExamSession) => {
    setIsStreaming(true);
    setStreamStatus('Connecting to Senior Examiner assessment stream...');
    setStreamError(null);

    try {
      const cfg = await getAiConfig();
      const res = await fetch('/api/evaluate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { 'x-gemini-key': cfg.apiKey } : {}),
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
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            if (event.type === 'question_evaluated') {
              const evalItem: QuestionGrading = event.evaluation;
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
      console.error('Streaming assessment error:', err);
      const msg = err instanceof Error ? err.message : 'Error streaming exam evaluation.';
      setStreamError(msg);
      setIsStreaming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <Sparkles className="w-8 h-8 text-[#f54e00] animate-spin mx-auto" />
          <p className="text-sm font-mono-code text-slate-400">Loading examination session...</p>
        </div>
      </div>
    );
  }

  if (!session || !manifest) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Assessment Session Not Found</h2>
        <p className="text-xs text-slate-400 max-w-md">
          The requested exam evaluation could not be loaded from local storage.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white transition"
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

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8 select-none">
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
              <span className="text-[10px] font-mono-code font-semibold uppercase tracking-wider text-[#f54e00] bg-[#f54e00]/10 border border-[#f54e00]/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> Live Grading In Progress
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl text-[#f3f3f2] tracking-tight">
            {manifest.title}
          </h1>
          <p className="text-xs text-[#686763] font-mono-code mt-0.5">
            Submitted on {new Date(session.submittedAt || session.startedAt).toLocaleString()} • {session.subjectCategory}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/learn/${manifest.id}`}
            className="px-3 py-1.5 cursor-btn-secondary text-xs font-mono-code flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-[#f54e00]" />
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
        <div className="bg-[#141517] border border-[#f54e00]/30 rounded-xl p-4 sm:p-5 space-y-3 shadow-lg animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-[#f54e00] animate-spin shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Senior Examiner Live Evaluation
                </h3>
                <p className="text-xs text-[#9b9a95] font-mono-code mt-0.5">
                  {streamStatus}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono-code text-[#f54e00] font-bold">
                {effectiveEvaluations.length} of {totalQuestions} Questions Evaluated
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-[#0c0d0e] rounded-full overflow-hidden border border-white/[0.06]">
              <div
                className="h-full bg-[#f54e00] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(5, progressPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono-code text-[#686763]">
              <span>Immediate Reflection: Inspect completed questions below right now</span>
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
        <section className="bg-[#141517] border border-white/[0.08] rounded-2xl p-6 text-center space-y-2.5">
          <div className="flex items-center justify-center gap-2 text-[#9b9a95] font-mono-code text-xs">
            <Clock className="w-4 h-4 text-[#f54e00]" />
            <span>Predicted IB 1–7 Grade Boundaries and Syllabus Mastery Matrix calculate once all questions finalize</span>
          </div>
          <p className="text-[11px] text-[#686763] font-mono-code">
            Question-level examiner marking and Error Carried Forward notes are live below for immediate inspection.
          </p>
        </section>
      )}

      {/* 2. Side-by-Side Examiner Review (Instant feedback on Q1 while Q2..N stream) */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-normal text-[#f3f3f2] flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#f54e00]" />
            Examiner Question Review &amp; Mark Breakdown
          </h2>
          <p className="text-xs text-[#9b9a95] font-mono-code">
            Inspect each question attempt with red margin annotations and individual method/accuracy mark codes
          </p>
        </div>

        <ExaminerReview
          questions={manifest.questions}
          submissions={session.submissions || {}}
          evaluations={effectiveEvaluations}
        />
      </section>

      {/* 3. Syllabus Subtopic Weakness Matrix & Targeted Actionable Drills */}
      {isFinished && session.gradingResults && (
        <section>
          <SyllabusMatrix
            syllabusBreakdown={session.gradingResults.syllabusBreakdown}
            paperId={manifest.id}
          />
        </section>
      )}
    </div>
  );
}
