'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ExamSession, ExamManifest, QuestionEvaluation, QuestionItem } from '@/types/exam';
import { getExamSession, getManifestById, saveExamSession, getAiConfig } from '@/lib/storage';
import { useAppShell } from '@/components/common/AppShell';
import { StorageErrorNotice } from '@/components/common/StorageErrorNotice';
import { GradeBoundaryCard } from '@/components/assessment/GradeBoundaryCard';
import { ExaminerReview, findEvaluation } from '@/components/assessment/ExaminerReview';
import { SyllabusMatrix } from '@/components/assessment/SyllabusMatrix';
import { gradePaper } from '@/lib/assessment/aggregate';
import { markScript } from '@/lib/assessment/markScript';
import { INVALID_KEY, MissingKeyError, NO_KEY } from '@/lib/aiKey';

const questionLabel = (q: QuestionItem) => q.number.replace(/^Question\s*/i, '').replace(/\.$/, '');

interface MarkingError {
  /** The question marking stopped at, when a question failed. */
  question?: QuestionItem;
  message: string;
  needsKey: boolean;
}

export default function ResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const isEvaluatingParam = searchParams.get('evaluating') === 'true';

  const { setHeaderInfo, openAiStudio, onAiKeySaved } = useAppShell();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [manifest, setManifest] = useState<ExamManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  const [isMarking, setIsMarking] = useState(false);
  const [markingError, setMarkingError] = useState<MarkingError | null>(null);

  const markingStartedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // One question per request, in paper order; each evaluation is saved as it arrives, so a reload resumes
  const startMarking = useCallback(async (m: ExamManifest, s: ExamSession) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsMarking(true);
    setMarkingError(null);

    try {
      const cfg = await getAiConfig();
      const thinkingBudget = cfg.thinkingBudgetGrading || 8192;
      let current = s;

      const { evaluations, failure } = await markScript({
        questions: m.questions,
        submissions: s.submissions || {},
        evaluations: s.questionEvaluations ?? [],
        gradeQuestion: async (question, submission, previousEvaluations) => {
          if (!cfg.apiKey) throw new MissingKeyError();
          const res = await fetch('/api/grade', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'x-gemini-key': cfg.apiKey,
              ...(cfg.zaiApiKey ? { 'x-zai-key': cfg.zaiApiKey } : {}),
            },
            body: JSON.stringify({ question, submission, previousEvaluations, thinkingBudget }),
          });
          const data = await res.json().catch(() => ({}));
          if (data.code === NO_KEY || data.code === INVALID_KEY) throw new MissingKeyError();
          if (res.status === 413) throw new Error('The working for this question is too large to send for marking.');
          if (!res.ok || !data.evaluation) throw new Error(data.error || 'The marking service did not respond.');
          return data.evaluation as QuestionEvaluation;
        },
        onEvaluated: async (all) => {
          if (controller.signal.aborted) return;
          current = { ...current, questionEvaluations: all };
          setSession(current);
          await saveExamSession(current);
        },
      });

      if (controller.signal.aborted) return;
      if (failure) {
        const { error } = failure;
        setMarkingError({
          question: failure.question,
          message: error instanceof Error ? error.message : 'Marking stopped unexpectedly.',
          needsKey: error instanceof MissingKeyError,
        });
        setIsMarking(false);
        return;
      }

      // Every question is marked: only now is there a paper grade and a Syllabus Weakness Matrix
      const finished: ExamSession = { ...current, gradingResults: gradePaper(m, evaluations, thinkingBudget) };
      setSession(finished);
      await saveExamSession(finished);
      setIsMarking(false);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      console.error('Marking error:', err);
      setMarkingError({ message: err instanceof Error ? err.message : 'Marking stopped unexpectedly.', needsKey: false });
      setIsMarking(false);
    }
  }, []);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  // A key saved in Settings picks marking up where it stopped
  useEffect(() => {
    if (!markingError?.needsKey || !manifest || !session) return;
    return onAiKeySaved(() => startMarking(manifest, session));
  }, [onAiKeySaved, markingError, manifest, session, startMarking]);

  useEffect(() => {
    getExamSession(sessionId).then((s) => {
      if (!s) {
        setLoading(false);
        return;
      }
      setSession(s);
      return getManifestById(s.paperId).then((m) => {
        if (!m) {
          setLoading(false);
          return;
        }
        setManifest(m);
        setHeaderInfo({ paperTitle: m.title, category: m.category, paperId: m.id });
        setLoading(false);

        const alreadyMarked = Boolean(s.gradingResults && s.gradingResults.evaluations.length > 0);
        if (!alreadyMarked && isEvaluatingParam && !markingStartedRef.current) {
          markingStartedRef.current = true;
          startMarking(m, s);
        }
      });
    }).catch(() => {
      setStorageError(true);
      setLoading(false);
    });
  }, [sessionId, isEvaluatingParam, setHeaderInfo, startMarking]);

  if (storageError) return <StorageErrorNotice />;

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
  const evaluations = session.gradingResults?.evaluations ?? session.questionEvaluations ?? [];
  const ecfCount = evaluations.filter((e) => e.ecfApplied).length;
  const totalQuestions = manifest.questions.length;
  const markedCount = evaluations.length;

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
  const costliestLabel = costliestIndex >= 0 ? questionLabel(manifest.questions[costliestIndex]) : '';

  const handedIn = new Date(session.submittedAt || session.startedAt);
  const failedLabel = markingError?.question ? questionLabel(markingError.question) : '';
  const pendingLabel =
    markingError?.question && markingError.question.id === manifest.questions[selectedQuestionIndex]?.id
      ? `Not marked. Retry question ${failedLabel} from the notice at the top of the report.`
      : isMarking
        ? 'Waiting for the examiner to reach this question.'
        : markingError
          ? 'Not marked yet. Questions are marked in order, so this one waits for the questions before it.'
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
        {markingError ? (
          <section role="alert" className="border border-lost p-5 sm:p-6 space-y-4">
            <h2 className="font-serif text-[22px] font-semibold text-ink">
              {markingError.question && !markingError.needsKey ? `Question ${failedLabel} was not marked` : 'Marking stopped'}
            </h2>
            <p className="text-[16px] leading-relaxed text-ink max-w-[65ch]">
              {markingError.needsKey
                ? 'The examiner needs a valid Gemini API key to mark this script. Add or check your key in Settings, then try again. Your script is saved.'
                : markingError.question
                  ? `${markingError.message} No marks have been given for question ${failedLabel}, and the questions after it wait until it is marked. Your script is saved.`
                  : `The examiner could not finish marking (${markingError.message}). Your script is saved, so you can try again.`}
            </p>
            {markedCount > 0 && (
              <p className="text-[15px] text-ink-muted tabular">
                {markedCount} of {totalQuestions} questions marked so far.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {markingError.needsKey && (
                <button type="button" onClick={() => openAiStudio('apiKey')} className="btn btn-ink">
                  Add an API key
                </button>
              )}
              <button
                type="button"
                onClick={() => startMarking(manifest, session)}
                className={`btn ${markingError.needsKey ? 'btn-quiet-paper' : 'btn-ink'}`}
              >
                {markingError.question && !markingError.needsKey ? `Retry question ${failedLabel}` : 'Try marking again'}
              </button>
            </div>
          </section>
        ) : !isFinished ? (
          <section role="status" aria-live="polite" className="space-y-3">
            <h2 className="font-serif text-[22px] font-semibold text-ink">
              {isMarking ? 'Marking your script' : 'Not yet marked'}
            </h2>
            <p className="tabular text-[16px] text-ink">
              {markedCount} of {totalQuestions} questions marked.
              {isMarking && markedCount > 0 && ' Read each question below as soon as it is marked.'}
            </p>
            <div className="h-px bg-paper-rule" aria-hidden="true">
              <div
                className="h-0.5 -mt-[0.5px] bg-ink transition-[width] duration-700 ease-[var(--ease-out-expo)]"
                style={{ width: `${totalQuestions ? (markedCount / totalQuestions) * 100 : 0}%` }}
              />
            </div>
            {!isMarking && (
              <button type="button" onClick={() => startMarking(manifest, session)} className="btn btn-ink">
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

        {isFinished && session.gradingResults && (
          <SyllabusMatrix
            syllabusBreakdown={session.gradingResults.syllabusBreakdown}
            paperId={manifest.id}
            allQuestions={manifest.questions}
          />
        )}
      </article>
    </div>
  );
}
