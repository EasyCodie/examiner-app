'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ExamManifest,
  QuestionSubmission,
  CanvasStroke,
} from '@/types/exam';
import {
  getManifestById,
  saveExamSession,
} from '@/lib/storage';
import { useAppShell } from '@/components/common/AppShell';
import { DrawingCanvas, DrawingCanvasRef } from '@/components/canvas/DrawingCanvas';
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar';
import { SplitScreenEditor } from '@/components/editor/SplitScreenEditor';
import { compileMockSession } from '@/lib/session/submissionCompiler';
import {
  Send,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

export default function MockExamPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = params.paperId as string;

  const { setHeaderInfo } = useAppShell();

  const [manifest, setManifest] = useState<ExamManifest | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Humanities vs STEM branch
  const isHumanities = manifest?.category === 'HUMANITIES';
  const [humanitiesQuestionIndex, setHumanitiesQuestionIndex] = useState<number>(0);
  const [humanitiesSubmissions, setHumanitiesSubmissions] = useState<Record<string, QuestionSubmission>>({});

  const handleUpdateHumanitiesSubmission = (
    questionId: string,
    text: string,
    diagramBase64?: string
  ) => {
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

  // Drawing state (STEM)
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState<string>('#0f172a');
  const [width, setWidth] = useState<number>(2.5);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [pageStrokes, setPageStrokes] = useState<Record<number, CanvasStroke[]>>({});
  const [pageBoxStrokes, setPageBoxStrokes] = useState<Record<number, Record<string, CanvasStroke[]>>>({});

  // Submissions mapping (STEM)
  const [submissions] = useState<Record<string, QuestionSubmission>>({});

  // Background timer (for completion tracking without visual pressure)
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(120 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingProgress, setGradingProgress] = useState<string>('');
  const [gradingPercentage, setGradingPercentage] = useState<number>(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const canvasRef = useRef<DrawingCanvasRef>(null);

  // Load manifest on mount
  useEffect(() => {
    getManifestById(paperId).then((m) => {
      if (m) {
        setManifest(m);
        setTimeRemainingSeconds(m.durationMinutes * 60);
        setHeaderInfo({
          paperTitle: m.title,
          category: m.category,
          mode: 'TIMED_MOCK',
          paperId: m.id,
          subjectCode: m.subjectCode,
        });
      }
    });
  }, [paperId, setHeaderInfo]);

  // Background timer (tracking total elapsed time without visual HUD timer)
  useEffect(() => {
    if (timeRemainingSeconds <= 0 || isSubmitting) return;
    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemainingSeconds, isSubmitting]);

  // Distinct pages containing actual questions (omits cover sheet, instructions, copyright)
  const distinctQuestionPages = useMemo(() => {
    if (!manifest || !manifest.questions.length) return [1];
    const pages = Array.from(new Set(manifest.questions.map((q) => q.pageNumber))).sort((a, b) => a - b);
    return pages.length > 0 ? pages : [1];
  }, [manifest]);

  // Pure derivation of active page without triggering cascading renders
  const activePageNumber = distinctQuestionPages.includes(currentPage)
    ? currentPage
    : distinctQuestionPages[0];

  const totalQuestionPages = distinctQuestionPages.length;
  const currentQuestionPageIndex = Math.max(1, distinctQuestionPages.indexOf(activePageNumber) + 1);

  // Questions on current page for canvas mode
  const questionsOnCurrentPage = manifest
    ? manifest.questions.filter((q) => q.pageNumber === activePageNumber)
    : [];

  const handlePageChange = (newPageIdx: number) => {
    const targetPage = distinctQuestionPages[newPageIdx - 1];
    if (targetPage !== undefined) {
      setCurrentPage(targetPage);
    }
  };

  // Final submission and Senior Examiner Assessment pass
  const handleConfirmSubmit = async () => {
    if (!manifest) return;
    setShowSubmitModal(false);
    setIsSubmitting(true);

    try {
      let livePageImage: string | undefined;
      let activeBoxImages: Record<string, string> = {};

      if (isHumanities) {
        setGradingProgress('Preparing your essay responses and diagrams...');
        setGradingPercentage(30);
      } else {
        setGradingProgress('Saving your handwritten working and steps...');
        setGradingPercentage(5);

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

      setGradingPercentage(60);
      setGradingProgress('Scanning your pages for examiner review...');

      const { session } = compileMockSession({
        manifest,
        pageStrokes,
        pageBoxStrokes,
        activeBoxImages,
        livePageImage,
        activePageNumber,
        distinctQuestionPages,
        timeRemainingSeconds,
        humanitiesSubmissions,
        existingSubmissions: submissions,
      });

      setGradingPercentage(100);
      setGradingProgress('Handing over to your examiner for marking...');

      await saveExamSession(session);

      // Transition immediately to the live results evaluation stream
      router.push(`/results/${session.id}?evaluating=true`);
    } catch (err: unknown) {
      console.error('Submission error:', err);
      const msg = err instanceof Error ? err.message : 'Error submitting exam.';
      setGradingProgress(`Submission error: ${msg}`);
      setIsSubmitting(false);
    }
  };

  if (!manifest) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#faf9f5]">
        <div className="text-center space-y-3">
          <Sparkles className="w-8 h-8 text-[#cc785c] animate-spin mx-auto" />
          <p className="text-sm font-mono-code text-[#6b6963]">Opening your exam paper...</p>
        </div>
      </div>
    );
  }

  const formatTimer = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex-1 flex flex-col p-4 sm:p-6 mx-auto w-full select-text ${isHumanities ? 'max-w-7xl pb-12' : 'max-w-5xl pb-28'
        }`}
    >
      {/* 1. TOP EXAM HUD (Double-Bezel Dark Island) */}
      <div className="double-bezel-outer-dark mb-6">
        <div className="double-bezel-inner-dark p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left: Paper Badge */}
            <div className="flex items-center gap-2">
              <span className="eyebrow-pill bg-[#252320] border border-white/10 text-[#a09d96] px-3 py-1">
                {isHumanities ? 'Humanities • Extended Response' : 'Practice Exam'}
              </span>
            </div>

            {/* Centered Exam Title */}
            <div className="text-center md:text-left">
              <h1 className="text-lg font-serif font-normal text-[#faf9f5] tracking-tight">{manifest.title}</h1>
              <p className="text-[11px] text-[#a09d96] font-mono-code">{manifest.subtitle}</p>
            </div>

            {/* Right: Submit Button */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                disabled={isSubmitting}
                className="claude-btn-pill-primary text-xs px-4 py-2 disabled:opacity-40"
              >
                <span>Submit Exam</span>
                <span className="btn-icon-bubble">
                  <Send className="w-3.5 h-3.5 text-white" />
                </span>
              </button>
            </div>
          </div>

          {/* Question Navigator & Page Jumper Row (Only for STEM multi-page paper) */}
          {!isHumanities && (
            <div className="flex items-center justify-between pt-3 border-t border-white/10 gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] font-mono-code uppercase text-[#a09d96] font-semibold px-1">Q:</span>
                {manifest.questions.map((q) => {
                  const isActive = q.pageNumber === currentPage;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentPage(q.pageNumber)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono-code transition-fluid flex items-center justify-center ${isActive
                          ? 'bg-[#cc785c] text-white font-medium shadow-sm ring-1 ring-white/20'
                          : 'bg-[#252320] text-[#a09d96] hover:text-[#faf9f5] border border-white/5'
                        }`}
                    >
                      <span>{q.number.replace(/^Question\s*/i, '')}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1 text-xs text-[#a09d96] font-mono-code shrink-0 pl-2">
                <button
                  type="button"
                  disabled={currentQuestionPageIndex <= 1}
                  onClick={() => handlePageChange(Math.max(1, currentQuestionPageIndex - 1))}
                  className="p-1 hover:text-[#faf9f5] disabled:opacity-30 transition"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-1 text-[11px]">
                  Page {currentQuestionPageIndex} / {totalQuestionPages}
                </span>
                <button
                  type="button"
                  disabled={currentQuestionPageIndex >= totalQuestionPages}
                  onClick={() => handlePageChange(Math.min(totalQuestionPages, currentQuestionPageIndex + 1))}
                  className="p-1 hover:text-[#faf9f5] disabled:opacity-30 transition"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      {isHumanities ? (
        /* Humanities: Split-Screen Essay & Diagram Composer */
        <div className="w-full">
          <SplitScreenEditor
            questions={manifest.questions}
            activeQuestionIndex={humanitiesQuestionIndex}
            onSelectQuestion={setHumanitiesQuestionIndex}
            submissions={humanitiesSubmissions}
            onUpdateSubmission={handleUpdateHumanitiesSubmission}
          />
        </div>
      ) : (
        /* STEM: Authentic Drawing Canvas Sheet */
        <div className="w-full flex flex-col items-center">
          {/* Official Exam Instructions Drawer */}
          {manifest.instructions && manifest.instructions.length > 0 && (
            <div className="w-full max-w-4xl bg-[#181715] border border-white/10 rounded-xl overflow-hidden mb-4 shadow-sm">
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition"
              >
                <div className="flex items-center gap-2 text-xs font-mono-code text-[#faf9f5]">
                  <Info className="w-3.5 h-3.5 text-[#cc785c]" />
                  <span className="font-semibold">Exam Instructions</span>
                  <span className="text-[10px] text-[#a09d96]">({manifest.instructions.length} rules)</span>
                </div>
                <span className="text-xs text-[#a09d96] font-mono-code">
                  {showInstructions ? 'Hide ▲' : 'View ▼'}
                </span>
              </button>
              {showInstructions && (
                <div className="px-4 py-3 bg-[#252320] border-t border-white/10 text-xs text-[#a09d96] space-y-1.5 font-mono-code">
                  {manifest.instructions.map((inst, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-[#cc785c] font-bold">•</span>
                      <span className="leading-relaxed">{inst}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="w-full max-w-4xl">
            <DrawingCanvas
              key={`canvas-page-${activePageNumber}`}
              ref={canvasRef}
              pageNumber={activePageNumber}
              questionsOnPage={questionsOnCurrentPage}
              paperTitle={manifest.title}
              tool={tool}
              color={color}
              width={width}
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
        </div>
      )}

      {/* 3. FLOATING GLASSMORPHIC TOOL DOCK (Only for STEM handwritten canvas) */}
      {!isHumanities && (
        <div className="fixed bottom-5 left-0 right-0 z-30 px-4 pointer-events-none flex justify-center">
          <div className="pointer-events-auto">
            <CanvasToolbar
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
              currentPage={currentQuestionPageIndex}
              totalPages={totalQuestionPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="double-bezel-outer-dark max-w-sm w-full">
            <div className="double-bezel-inner-dark p-6 space-y-4">
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-serif font-normal text-[#faf9f5] tracking-tight">
                  Submit your exam?
                </h3>
                <p className="text-xs text-[#a09d96] leading-relaxed">
                  Your paper will be marked against the official markscheme, with full credit for your method and follow-through working.
                </p>
              </div>

              <div className="bg-[#141413] p-3 rounded-xl border border-white/10 text-xs text-[#a09d96] flex items-center justify-between font-mono-code shadow-inner">
                <span>Time remaining:</span>
                <span className="font-medium text-[#cc785c]">{formatTimer(timeRemainingSeconds)}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2.5 claude-btn-pill-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="flex-1 py-2.5 claude-btn-pill-primary text-xs justify-between"
                >
                  <span>Submit Exam</span>
                  <span className="btn-icon-bubble">
                    <Send className="w-3 h-3 text-white" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="double-bezel-outer-dark max-w-md w-full">
            <div className="double-bezel-inner-dark p-6 space-y-4 text-center">
              <div className="space-y-1">
                <h2 className="text-lg font-serif font-normal text-[#faf9f5] tracking-tight">
                  Marking in progress
                </h2>
                <p className="text-xs text-[#a09d96] font-mono-code">{gradingProgress}</p>
              </div>

              <div className="space-y-1.5">
                <div className="w-full h-2 bg-[#141413] rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div
                    className="h-full bg-linear-to-r from-[#cc785c] to-[#e8a55a] rounded-full transition-fluid duration-300 shadow-[0_0_8px_rgba(204,120,92,0.4)]"
                    style={{ width: `${gradingPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono-code text-[#a09d96]">
                  <span>Checking your steps and calculating marks</span>
                  <span>{gradingPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
