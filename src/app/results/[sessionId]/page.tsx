'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ExamSession, ExamManifest, QuestionEvaluation } from '@/types/exam';
import { getExamSession, getManifestById, saveExamSession, getAiConfig } from '@/lib/storage';
import { useAppShell } from '@/components/common/AppShell';
import { GradeBoundaryCard } from '@/components/assessment/GradeBoundaryCard';
import { ExaminerReview, findEvaluation } from '@/components/assessment/ExaminerReview';
import { SyllabusMatrix } from '@/components/assessment/SyllabusMatrix';
import { synthesizeSyllabusBreakdown } from '@/lib/assessment/evaluator';

type StreamEvent =
  | { type: 'question_evaluated'; evaluation: QuestionEvaluation }
  | { type: 'session_complete'; session: ExamSession }
  | { type: 'error'; message?: string }
  | { type: string };

const looksLikeMissingKey = (msg: string) => /api[\s_-]?key|GEMINI|unauthori[sz]ed|401|403/i.test(msg);

export default function ResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const isEvaluatingParam = searchParams.get('evaluating') === 'true';

  const { setHeaderInfo, openAiStudio } = useAppShell();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [manifest, setManifest] = useState<ExamManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  // Live streaming evaluation state
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveEvaluations, setLiveEvaluations] = useState<QuestionEvaluation[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);

  const streamInitiatedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startEvaluationStream = useCallback(async (m: ExamManifest, s: ExamSession) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsStreaming(true);
    setStreamError(null);
    setLiveEvaluations([]);

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
        throw new Error(errorText || 'The marking service did not respond.');
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

          // Parse failures are skipped; event errors must reach the student
          let event: StreamEvent;
          try {
            event = JSON.parse(line);
          } catch (jsonErr) {
            console.warn('Skipping unreadable stream line:', line, jsonErr);
            continue;
          }

          if (event.type === 'question_evaluated' && 'evaluation' in event) {
            setLiveEvaluations((prev) => [...prev, event.evaluation]);
          } else if (event.type === 'session_complete' && 'session' in event) {
            setSession(event.session);
            await saveExamSession(event.session);
            setIsStreaming(false);
          } else if (event.type === 'error') {
            throw new Error(('message' in event && event.message) || 'A question could not be marked.');
          }
        }
      }
    } catch (err: unknown) {
      if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
        return;
      }
      console.error('Streaming assessment error:', err);
      setStreamError(err instanceof Error ? err.message : 'Marking stopped unexpectedly.');
      setIsStreaming(false);
    }
  }, []);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  useEffect(() => {
    getExamSession(sessionId).then((s) => {
      if (!s) {
        setLoading(false);
        return;
      }
      setSession(s);
      getManifestById(s.paperId).then((m) => {
        if (!m) {
          setLoading(false);
          return;
        }
        setManifest(m);
        setHeaderInfo({ paperTitle: m.title, category: m.category, paperId: m.id });
        setLoading(false);

        const alreadyMarked = Boolean(s.gradingResults && s.gradingResults.evaluations.length > 0);
        if (!alreadyMarked && isEvaluatingParam && !streamInitiatedRef.current) {
          streamInitiatedRef.current = true;
          startEvaluationStream(m, s);
        }
      });
    });
  }, [sessionId, isEvaluatingParam, setHeaderInfo, startEvaluationStream]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8" role="status">
        <p className="text-[15px] text-shell-muted">Opening the report…</p>
      </div>
    );
  }

  if (!session || !manifest) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="script-sheet paper-surface max-w-[560px] w-full px-8 py-10 space-y-4">
          <h1 className="font-serif text-[28px] font-semibold text-ink">Report not found</h1>
          <p className="text-[16px] leading-relaxed text-ink-muted">
            This exam session isn&rsquo;t stored in this browser. Sessions are saved on the device where you sat the paper.
          </p>
          <Link href="/" className="btn btn-ink">
            Back to your papers
          </Link>
        </div>
      </div>
    );
  }

  const isFinished = Boolean(session.gradingResults && session.gradingResults.evaluations.length > 0);
  const evaluations = session.gradingResults?.evaluations || liveEvaluations;
  const ecfCount = evaluations.filter((e) => e.ecfApplied).length;
  const totalQuestions = manifest.questions.length;
  const markedCount = evaluations.length;
  const syllabusBreakdown = session.gradingResults?.syllabusBreakdown || synthesizeSyllabusBreakdown(evaluations);

  // The question that cost the most marks leads the next step
  let costliestIndex = -1;
  let costliestLost = 0;
  manifest.questions.forEach((q, idx) => {
    const ev = findEvaluation(evaluations, q, idx);
    const lost = ev ? ev.maxMarks - ev.marksAwarded : 0;
    if (lost > costliestLost) {
      costliestLost = lost;
      costliestIndex = idx;
    }
  });
  const costliestLabel =
    costliestIndex >= 0 ? manifest.questions[costliestIndex].number.replace(/^Question\s*/i, '').replace(/\.$/, '') : '';

  const handedIn = new Date(session.submittedAt || session.startedAt);
  const pendingLabel = streamError
    ? 'This question was not marked.'
    : isStreaming
      ? 'Waiting for the examiner to reach this question.'
      : 'This question has not been marked.';

  return (
    <div className="flex-1 px-3 sm:px-5 py-6 sm:py-12">
      <article className="script-sheet paper-surface mx-auto max-w-[1080px] px-5 sm:px-12 py-8 sm:py-12 space-y-12 select-text">
        <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3">
          <p className="font-serif text-[16px] font-semibold text-ink">Examiner&rsquo;s report</p>
          <p className="tabular text-[13px] text-ink-muted">
            Handed in {handedIn.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <header className="space-y-2">
          <h1 className="font-serif text-[32px] sm:text-[44px] leading-[1.08] font-semibold text-ink text-balance">
            {manifest.title}
          </h1>
          <p className="text-[16px] text-ink-muted">{manifest.subtitle}</p>
        </header>

        {/* Marking progress, error, or the verdict */}
        {streamError ? (
          <section role="alert" className="border border-lost p-5 sm:p-6 space-y-4">
            <h2 className="font-serif text-[22px] font-semibold text-ink">Marking stopped</h2>
            <p className="text-[16px] leading-relaxed text-ink max-w-[65ch]">
              {looksLikeMissingKey(streamError)
                ? 'The examiner needs a Gemini API key to mark this script. Add one, then try again. Your script is saved.'
                : `The examiner could not finish marking (${streamError}). Your script is saved, so you can try again.`}
            </p>
            {markedCount > 0 && (
              <p className="text-[15px] text-ink-muted tabular">
                {markedCount} of {totalQuestions} questions were marked before it stopped.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {looksLikeMissingKey(streamError) && (
                <button type="button" onClick={() => openAiStudio('apiKey')} className="btn btn-ink">
                  Add an API key
                </button>
              )}
              <button
                type="button"
                onClick={() => startEvaluationStream(manifest, session)}
                className={`btn ${looksLikeMissingKey(streamError) ? 'btn-quiet-paper' : 'btn-ink'}`}
              >
                Try marking again
              </button>
            </div>
          </section>
        ) : !isFinished ? (
          <section role="status" aria-live="polite" className="space-y-3">
            <h2 className="font-serif text-[22px] font-semibold text-ink">
              {isStreaming ? 'Marking your script' : 'Not yet marked'}
            </h2>
            <p className="tabular text-[16px] text-ink">
              {markedCount} of {totalQuestions} questions marked.
              {isStreaming && markedCount > 0 && ' Read each question below as soon as it is marked.'}
            </p>
            <div className="h-px bg-paper-rule" aria-hidden="true">
              <div
                className="h-0.5 -mt-[0.5px] bg-ink transition-[width] duration-700 ease-[var(--ease-out-expo)]"
                style={{ width: `${totalQuestions ? (markedCount / totalQuestions) * 100 : 0}%` }}
              />
            </div>
            {!isStreaming && (
              <button type="button" onClick={() => startEvaluationStream(manifest, session)} className="btn btn-ink">
                Mark this script
              </button>
            )}
          </section>
        ) : (
          session.gradingResults && (
            <div className="space-y-8">
              <GradeBoundaryCard
                totalAwarded={session.gradingResults.totalMarksAwarded}
                totalPossible={session.gradingResults.totalPossibleMarks}
                percentage={session.gradingResults.percentage}
                predictedGrade={session.gradingResults.predictedGrade}
                boundaries={manifest.gradeBoundaries}
                ecfCount={ecfCount}
              />
              <div className="flex flex-wrap items-center gap-3 border-t border-paper-rule pt-6">
                {costliestIndex >= 0 ? (
                  <>
                    <p className="w-full text-[16px] text-ink">
                      Question {costliestLabel} cost you the most:{' '}
                      <span className="tabular font-semibold">
                        {costliestLost} {costliestLost === 1 ? 'mark' : 'marks'}
                      </span>
                      .
                    </p>
                    <Link href={`/learn/${manifest.id}?question=${costliestIndex}`} className="btn btn-ink">
                      Work on question {costliestLabel} with the tutor
                    </Link>
                  </>
                ) : (
                  <p className="w-full text-[16px] text-ink">Full marks on every question.</p>
                )}
                <Link href={`/mock/${manifest.id}`} className="btn btn-quiet-paper">
                  Sit this paper again
                </Link>
              </div>
            </div>
          )
        )}

        <ExaminerReview
          questions={manifest.questions}
          submissions={session.submissions || {}}
          evaluations={evaluations}
          selectedIndex={selectedQuestionIndex}
          onSelectIndex={setSelectedQuestionIndex}
          paperId={manifest.id}
          pendingLabel={pendingLabel}
        />

        {evaluations.length > 0 && (
          <SyllabusMatrix syllabusBreakdown={syllabusBreakdown} paperId={manifest.id} allQuestions={manifest.questions} />
        )}
      </article>
    </div>
  );
}
