'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ExamManifest,
  InProgressExamSession,
  QuestionSubmission,
  CanvasStroke,
} from '@/types/exam';
import {
  getManifestById,
  saveExamSession,
  getInProgressSession,
  saveInProgressSession,
  clearInProgressSession,
} from '@/lib/storage';
import { useAppShell } from '@/components/common/AppShell';
import { StorageErrorNotice } from '@/components/common/StorageErrorNotice';
import { DrawingCanvas, DrawingCanvasRef } from '@/components/canvas/DrawingCanvas';
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar';
import { SplitScreenEditor } from '@/components/editor/SplitScreenEditor';
import { ReportDialog } from '@/components/common/ReportDialog';
import { ExamPageHead, ExamPhase, SaveStatus, formatClock } from '@/components/exam/ExamPageHead';
import { ContentsStrip, ContentsItem } from '@/components/exam/ContentsStrip';
import { ExamCover } from '@/components/exam/ExamCover';
import { compileMockSession } from '@/lib/session/submissionCompiler';
import { examClockReducer, initialExamClock, FINAL_PHASE_SECONDS } from '@/lib/session/examClock';

const AUTOSAVE_DEBOUNCE_MS = 1200;
const CLOCK_SAVE_INTERVAL_MS = 15000;

type LoadState = 'loading' | 'ready' | 'not-found' | 'storage-error';

export default function MockExamPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = params.paperId as string;

  const { setHeaderInfo } = useAppShell();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [manifest, setManifest] = useState<ExamManifest | null>(null);
  const [resumable, setResumable] = useState<InProgressExamSession | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  // Which way the last page turn went, so the next page comes in from the right edge
  const [turn, setTurn] = useState<'forward' | 'back' | undefined>(undefined);

  // Exam Session timing
  const [clock, dispatchClock] = useReducer(examClockReducer, initialExamClock);
  const { phase, readingRemainingSeconds, timeRemainingSeconds, announcement } = clock;
  const [startedAt, setStartedAt] = useState<string>('');
  const [clockHidden, setClockHidden] = useState(false);

  // Humanities vs STEM branch
  const isHumanities = manifest?.category === 'HUMANITIES';
  const [humanitiesQuestionIndex, setHumanitiesQuestionIndex] = useState<number>(0);
  const [humanitiesSubmissions, setHumanitiesSubmissions] = useState<Record<string, QuestionSubmission>>({});

  // Drawing state (STEM)
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState<string>('#1a2238');
  const [width, setWidth] = useState<number>(2.5);
  const [fingerDrawing, setFingerDrawing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [pageStrokes, setPageStrokes] = useState<Record<number, CanvasStroke[]>>({});
  const [pageBoxStrokes, setPageBoxStrokes] = useState<Record<number, Record<string, CanvasStroke[]>>>({});

  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: 'idle' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingProgress, setGradingProgress] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showStartAgainDialog, setShowStartAgainDialog] = useState(false);

  const canvasRef = useRef<DrawingCanvasRef>(null);

  const isActive = phase === 'reading' || phase === 'writing';
  const displayPhase: ExamPhase =
    phase === 'writing' && timeRemainingSeconds <= FINAL_PHASE_SECONDS ? 'final' : phase;

  // Load manifest and any unfinished session on mount
  useEffect(() => {
    let cancelled = false;
    Promise.all([getManifestById(paperId), getInProgressSession(paperId)]).then(([m, saved]) => {
      if (cancelled) return;
      if (!m) {
        setLoadState('not-found');
        return;
      }
      setManifest(m);
      setResumable(saved);
      dispatchClock({
        type: 'load',
        readingSeconds: (m.readingTimeMinutes ?? 0) * 60,
        writingSeconds: m.durationMinutes * 60,
      });
      setHeaderInfo({
        paperTitle: m.title,
        category: m.category,
        mode: 'TIMED_MOCK',
        paperId: m.id,
        subjectCode: m.subjectCode,
        examMode: true,
      });
      setLoadState('ready');
    }).catch(() => {
      if (!cancelled) setLoadState('storage-error');
    });
    return () => {
      cancelled = true;
    };
  }, [paperId, setHeaderInfo]);

  // Hand the header back when leaving the exam room
  useEffect(() => () => setHeaderInfo({}), [setHeaderInfo]);

  // The clock ticks once a second; at the last second of writing time, pens down hands the script in
  const clockRef = useRef(clock);
  const submitRef = useRef<((remainingOverride?: number) => void) | null>(null);
  useEffect(() => {
    clockRef.current = clock;
  });

  useEffect(() => {
    if (!isActive || isSubmitting) return;
    const interval = setInterval(() => {
      const before = clockRef.current;
      dispatchClock({ type: 'tick' });
      if (before.phase === 'writing' && before.timeRemainingSeconds <= 1) {
        submitRef.current?.(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, isSubmitting]);

  // Distinct pages containing actual questions (omits cover sheet, instructions, copyright)
  const distinctQuestionPages = useMemo(() => {
    if (!manifest || !manifest.questions.length) return [1];
    const pages = Array.from(new Set(manifest.questions.map((q) => q.pageNumber))).sort((a, b) => a - b);
    return pages.length > 0 ? pages : [1];
  }, [manifest]);

  const activePageNumber = distinctQuestionPages.includes(currentPage)
    ? currentPage
    : distinctQuestionPages[0];

  const questionsOnCurrentPage = manifest
    ? manifest.questions.filter((q) => q.pageNumber === activePageNumber)
    : [];

  const hasWorking = useCallback(
    (questionId: string, pageNumber: number) => {
      if (isHumanities) {
        const sub = humanitiesSubmissions[questionId];
        return Boolean(sub?.textResponse?.trim() || sub?.diagramImageBase64);
      }
      const boxed = pageBoxStrokes[pageNumber]?.[questionId]?.length ?? 0;
      return boxed > 0 || (pageStrokes[pageNumber] ?? []).some((s) => s.boxId === questionId);
    },
    [isHumanities, humanitiesSubmissions, pageBoxStrokes, pageStrokes]
  );

  const contentsItems: ContentsItem[] = useMemo(() => {
    if (!manifest) return [];
    return manifest.questions.map((q, idx) => ({
      key: q.id,
      label: q.number.replace(/^Question\s*/i, '').replace(/\.$/, ''),
      marks: q.totalMarks,
      hasWorking: hasWorking(q.id, q.pageNumber),
      isCurrent: isHumanities ? idx === humanitiesQuestionIndex : q.pageNumber === activePageNumber,
    }));
  }, [manifest, hasWorking, isHumanities, humanitiesQuestionIndex, activePageNumber]);

  const blankQuestions = contentsItems.filter((item) => !item.hasWorking);

  const handleSelectQuestion = (key: string) => {
    if (!manifest) return;
    const idx = manifest.questions.findIndex((q) => q.id === key);
    if (idx < 0) return;
    if (isHumanities) {
      if (idx !== humanitiesQuestionIndex) setTurn(idx > humanitiesQuestionIndex ? 'forward' : 'back');
      setHumanitiesQuestionIndex(idx);
    } else {
      const page = manifest.questions[idx].pageNumber;
      if (page !== activePageNumber) setTurn(page > activePageNumber ? 'forward' : 'back');
      setCurrentPage(page);
    }
    window.scrollTo({ top: 0 });
  };

  const handleUpdateHumanitiesSubmission = (questionId: string, text: string, diagramBase64?: string) => {
    setHumanitiesSubmissions((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {
          questionId,
          questionNumber: manifest?.questions.find((q) => q.id === questionId)?.number || '',
        }),
        textResponse: text,
        diagramImageBase64: diagramBase64,
        timeSpentSeconds: prev[questionId]?.timeSpentSeconds || 0,
      },
    }));
  };

  // ---------- Autosave ----------
  const snapshotRef = useRef<InProgressExamSession | null>(null);
  useEffect(() => {
    snapshotRef.current = isActive
      ? {
          paperId,
          startedAt,
          savedAt: new Date().toISOString(),
          phase: phase as 'reading' | 'writing',
          readingRemainingSeconds,
          timeRemainingSeconds,
          pageStrokes,
          pageBoxStrokes,
          humanitiesSubmissions,
        }
      : null;
  });

  const saveNow = useCallback(async () => {
    const snapshot = snapshotRef.current;
    if (!snapshot) return;
    setSaveStatus({ state: 'saving' });
    try {
      await saveInProgressSession({ ...snapshot, savedAt: new Date().toISOString() });
      setSaveStatus({ state: 'saved', at: new Date() });
    } catch (err) {
      console.error('Autosave failed', err);
      setSaveStatus({ state: 'error' });
    }
  }, []);

  // Save shortly after any change to the candidate's work
  useEffect(() => {
    if (!isActive) return;
    const timeout = setTimeout(saveNow, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [isActive, phase, pageStrokes, pageBoxStrokes, humanitiesSubmissions, saveNow]);

  // Keep the saved clock close to the real one
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(saveNow, CLOCK_SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isActive, saveNow]);

  // Warn before the tab closes mid-session
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isActive]);

  // ---------- Starting ----------
  const handleBegin = () => {
    if (!manifest) return;
    setStartedAt(new Date().toISOString());
    dispatchClock({ type: 'begin' });
    window.scrollTo({ top: 0 });
  };

  const handleResume = () => {
    if (!resumable) return;
    setStartedAt(resumable.startedAt);
    setPageStrokes(resumable.pageStrokes ?? {});
    setPageBoxStrokes(resumable.pageBoxStrokes ?? {});
    setHumanitiesSubmissions(resumable.humanitiesSubmissions ?? {});
    dispatchClock({
      type: 'resume',
      phase: resumable.phase,
      readingSeconds: resumable.readingRemainingSeconds,
      writingSeconds: resumable.timeRemainingSeconds,
    });
    window.scrollTo({ top: 0 });
  };

  const handleStartAgain = async () => {
    await clearInProgressSession(paperId);
    setResumable(null);
    setShowStartAgainDialog(false);
  };

  // ---------- Handing in ----------
  const handleConfirmSubmit = useCallback(async (remainingOverride?: number) => {
    if (!manifest) return;
    setShowSubmitDialog(false);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let livePageImage: string | undefined;
      let activeBoxImages: Record<string, string> = {};

      if (isHumanities) {
        setGradingProgress('Collecting your essays and diagrams');
      } else {
        setGradingProgress('Collecting your handwritten working');
        if (canvasRef.current) {
          try {
            const liveImg = await canvasRef.current.exportCompositeImage();
            if (liveImg) livePageImage = liveImg;
            activeBoxImages = await canvasRef.current.exportBoxImages();
          } catch {
            const liveImg = canvasRef.current.getCanvasSnapshot();
            if (liveImg) livePageImage = liveImg;
          }
        }
      }

      const { session } = compileMockSession({
        manifest,
        pageStrokes,
        pageBoxStrokes,
        activeBoxImages,
        livePageImage,
        activePageNumber,
        distinctQuestionPages,
        timeRemainingSeconds: remainingOverride ?? timeRemainingSeconds,
        startedAt,
        humanitiesSubmissions,
      });

      setGradingProgress('Handing your script to the examiner');
      await saveExamSession(session);
      await clearInProgressSession(paperId);
      dispatchClock({ type: 'close' });

      router.push(`/results/${session.id}?evaluating=true`);
    } catch (err: unknown) {
      console.error('Submission error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setSubmitError(`Your script could not be handed in (${msg}). Your work is still saved; try again.`);
      setIsSubmitting(false);
    }
  }, [
    manifest,
    isHumanities,
    pageStrokes,
    pageBoxStrokes,
    activePageNumber,
    distinctQuestionPages,
    timeRemainingSeconds,
    startedAt,
    humanitiesSubmissions,
    paperId,
    router,
  ]);

  useEffect(() => {
    submitRef.current = handleConfirmSubmit;
  }, [handleConfirmSubmit]);

  const handleLeave = () => {
    if (isActive) {
      setShowLeaveDialog(true);
    } else {
      router.push('/');
    }
  };

  // ---------- Render ----------
  if (loadState === 'storage-error') return <StorageErrorNotice />;

  if (loadState === 'not-found') {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="script-sheet paper-surface max-w-[560px] w-full px-8 py-10 space-y-4">
          <h1 className="font-serif text-[28px] font-semibold text-ink">Paper not found</h1>
          <p className="text-[16px] leading-relaxed text-ink-muted">
            There is no paper with the reference <span className="font-mono text-ink">{paperId}</span> on this device. It
            may have been added in another browser.
          </p>
          <Link href="/" className="btn btn-ink">
            Choose a paper
          </Link>
        </div>
      </div>
    );
  }

  if (loadState === 'loading' || !manifest) {
    return (
      <div className="flex-1 flex items-center justify-center p-8" role="status">
        <p className="text-[15px] text-shell-muted">Opening the paper…</p>
      </div>
    );
  }

  const clockSeconds =
    phase === 'reading' ? readingRemainingSeconds : phase === 'cover' ? null : timeRemainingSeconds;

  return (
    <div className="flex-1 flex flex-col select-text [--strip-top:52px]">
      <ExamPageHead
        paperTitle={`${manifest.title} · ${manifest.subtitle}`}
        phase={displayPhase}
        clockSeconds={clockSeconds}
        clockHidden={clockHidden}
        onToggleClock={() => setClockHidden((h) => !h)}
        saveStatus={saveStatus}
        onSubmit={phase === 'writing' ? () => setShowSubmitDialog(true) : undefined}
        onLeave={handleLeave}
        announcement={announcement}
      />

      {phase === 'cover' ? (
        <ExamCover
          manifest={manifest}
          resumable={resumable}
          onBegin={handleBegin}
          onResume={handleResume}
          onStartAgain={() => setShowStartAgainDialog(true)}
        />
      ) : (
        <>
          <ContentsStrip items={contentsItems} onSelect={handleSelectQuestion} />

          {submitError && (
            <div role="alert" className="mx-auto mt-4 w-full max-w-[816px] px-4">
              <p className="border border-lost-on-shell bg-shell-raised px-4 py-3 text-[15px] text-shell-ink">
                {submitError}
              </p>
            </div>
          )}

          {isHumanities ? (
            <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 py-6 sm:py-8">
              <SplitScreenEditor
                questions={manifest.questions}
                activeQuestionIndex={humanitiesQuestionIndex}
                submissions={humanitiesSubmissions}
                onUpdateSubmission={handleUpdateHumanitiesSubmission}
                readOnly={phase !== 'writing'}
                turn={turn}
              />
            </div>
          ) : (
            <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 pt-6 sm:pt-8 pb-32 xl:pb-12 xl:grid xl:grid-cols-[1fr_816px_1fr] xl:gap-8">
              <div className="hidden xl:block">
                <div className="sticky top-[120px] flex justify-end">
                  <CanvasToolbar
                    orientation="vertical"
                    tool={tool}
                    setTool={setTool}
                    color={color}
                    setColor={setColor}
                    width={width}
                    setWidth={setWidth}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onUndo={() => canvasRef.current?.undo()}
                    onRedo={() => canvasRef.current?.redo()}
                    onClear={() => canvasRef.current?.clear()}
                    fingerDrawing={fingerDrawing}
                    setFingerDrawing={setFingerDrawing}
                  />
                </div>
              </div>

              <div key={`page-${activePageNumber}`} data-turn={turn} className="w-full max-w-[816px] mx-auto">
                <DrawingCanvas
                  key={`canvas-page-${activePageNumber}`}
                  ref={canvasRef}
                  pageNumber={activePageNumber}
                  questionsOnPage={questionsOnCurrentPage}
                  paperTitle={manifest.title}
                  tool={tool}
                  color={color}
                  width={width}
                  readOnly={phase !== 'writing'}
                  fingerDrawing={fingerDrawing}
                  initialStrokes={pageStrokes[activePageNumber] || []}
                  boxStrokes={pageBoxStrokes[activePageNumber]}
                  onBoxStrokesChange={(boxes) => {
                    setPageBoxStrokes((prev) => ({ ...prev, [activePageNumber]: boxes }));
                  }}
                  onStrokesChange={(updated) => {
                    setPageStrokes((prev) => ({ ...prev, [activePageNumber]: updated }));
                  }}
                  onToolChange={(undoAvail, redoAvail) => {
                    setCanUndo(undoAvail);
                    setCanRedo(redoAvail);
                  }}
                />
              </div>

              {/* Docked tool bar below xl: sits in the page's reserved bottom space, never over the question */}
              <div className="xl:hidden fixed bottom-0 left-0 right-0 z-30 bg-shell border-t border-shell-line">
                <CanvasToolbar
                  orientation="horizontal"
                  tool={tool}
                  setTool={setTool}
                  color={color}
                  setColor={setColor}
                  width={width}
                  setWidth={setWidth}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onUndo={() => canvasRef.current?.undo()}
                  onRedo={() => canvasRef.current?.redo()}
                  onClear={() => canvasRef.current?.clear()}
                  fingerDrawing={fingerDrawing}
                  setFingerDrawing={setFingerDrawing}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Hand-in check */}
      <ReportDialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)} title="Hand in your script?">
        <p className="text-[16px] leading-relaxed text-ink">
          You have <span className="tabular font-semibold">{formatClock(timeRemainingSeconds)}</span> left. Once handed in,
          the script is marked and cannot be changed.
        </p>
        {blankQuestions.length > 0 ? (
          <div className="border-t border-b border-paper-rule py-3">
            <p className="text-[15px] font-semibold text-ink">
              {blankQuestions.length === 1 ? 'One question has' : `${blankQuestions.length} questions have`} no working:
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 tabular text-[15px] text-ink">
              {blankQuestions.map((q) => (
                <li key={q.key}>
                  Question {q.label} <span className="text-ink-muted">[{q.marks}]</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-[15px] text-ink-muted">Every question has some working.</p>
        )}
        <div className="flex flex-wrap justify-end gap-3 pt-1">
          <button type="button" onClick={() => setShowSubmitDialog(false)} className="btn btn-quiet-paper" autoFocus>
            Keep writing
          </button>
          <button type="button" onClick={() => handleConfirmSubmit()} className="btn btn-ink">
            Hand in script
          </button>
        </div>
      </ReportDialog>

      {/* Leaving mid-session */}
      <ReportDialog open={showLeaveDialog} onClose={() => setShowLeaveDialog(false)} title="Leave the exam?">
        <p className="text-[16px] leading-relaxed text-ink">
          Your working is saved on this device. The clock pauses while you are away, and you can resume from this
          paper&rsquo;s page.
        </p>
        <div className="flex flex-wrap justify-end gap-3 pt-1">
          <button type="button" onClick={() => setShowLeaveDialog(false)} className="btn btn-quiet-paper" autoFocus>
            Stay
          </button>
          <button
            type="button"
            onClick={async () => {
              await saveNow();
              setShowLeaveDialog(false);
              dispatchClock({ type: 'close' });
              router.push('/');
            }}
            className="btn btn-ink"
          >
            Save and leave
          </button>
        </div>
      </ReportDialog>

      {/* Discarding a saved session */}
      <ReportDialog
        open={showStartAgainDialog}
        onClose={() => setShowStartAgainDialog(false)}
        title="Discard your saved working?"
      >
        <p className="text-[16px] leading-relaxed text-ink">
          Starting again deletes the working saved for this paper. This cannot be undone.
        </p>
        <div className="flex flex-wrap justify-end gap-3 pt-1">
          <button type="button" onClick={() => setShowStartAgainDialog(false)} className="btn btn-quiet-paper" autoFocus>
            Keep it
          </button>
          <button type="button" onClick={handleStartAgain} className="btn btn-destructive">
            Discard and start again
          </button>
        </div>
      </ReportDialog>

      {/* Handing in */}
      <ReportDialog
        open={isSubmitting}
        onClose={() => undefined}
        dismissable={false}
        title={phase === 'pens-down' ? 'Pens down' : 'Handing in'}
      >
        <p key={gradingProgress} className="animate-ink-in text-[16px] leading-relaxed text-ink" role="status">
          {gradingProgress}…
        </p>
        <div className="rule-working bg-paper-rule text-ink" aria-hidden="true" />
      </ReportDialog>
    </div>
  );
}
