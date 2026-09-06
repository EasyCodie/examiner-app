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
        setGradingProgress('Compiling essay responses and economic diagram attachments...');
        setGradingPercentage(30);
      } else {
        setGradingProgress('Compiling submission and capturing canvas working...');
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
      setGradingProgress('Rasterizing handwritten pages into high-res examiner scans...');

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
      setGradingProgress('Handing over to Senior Examiner evaluation stream...');

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
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <Sparkles className="w-8 h-8 text-[#f54e00] animate-spin mx-auto" />
          <p className="text-sm font-mono-code text-[#9b9a95]">Loading authentic IB examination paper...</p>
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
      {/* 1. TOP EXAM HUD (Cursor Dark Mode) */}
      <div className="bg-[#141517] border border-white/[0.08] rounded-xl p-4 sm:p-5 mb-6 space-y-3.5 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left: Paper Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono-code uppercase bg-[#1a1b1e] border border-white/[0.08] px-2.5 py-1 rounded text-[#9b9a95]">
              {isHumanities ? 'Humanities • Extended Response' : 'Authentic Exam Paper'}
            </span>
          </div>

          {/* Centered Exam Title */}
          <div className="text-center md:text-left">
            <h1 className="text-base font-normal text-[#f3f3f2] tracking-tight">{manifest.title}</h1>
            <p className="text-[11px] text-[#686763] font-mono-code">{manifest.subtitle}</p>
          </div>

          {/* Right: Submit Button */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg cursor-btn-primary text-xs font-medium disabled:opacity-40 transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Exam</span>
            </button>
          </div>
        </div>

        {/* Question Navigator & Page Jumper Row (Only for STEM multi-page paper) */}
        {!isHumanities && (
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] font-mono-code uppercase text-[#686763] font-semibold px-1">Q:</span>
              {manifest.questions.map((q) => {
                const isActive = q.pageNumber === currentPage;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentPage(q.pageNumber)}
                    className={`px-3 py-1 rounded-md text-xs font-mono-code transition flex items-center justify-center ${isActive
                        ? 'bg-[#f54e00] text-white font-semibold shadow-sm'
                        : 'bg-[#0c0d0e] text-[#9b9a95] hover:text-white border border-white/[0.06]'
                      }`}
                  >
                    <span>{q.number.replace(/^Question\s*/i, '')}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 text-xs text-[#9b9a95] font-mono-code shrink-0 pl-2">
              <button
                type="button"
                disabled={currentQuestionPageIndex <= 1}
                onClick={() => handlePageChange(Math.max(1, currentQuestionPageIndex - 1))}
                className="p-1 hover:text-white disabled:opacity-30 transition"
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
                className="p-1 hover:text-white disabled:opacity-30 transition"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
            <div className="w-full max-w-4xl bg-[#141517] border border-white/[0.08] rounded-xl overflow-hidden mb-4 shadow-sm">
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition"
              >
                <div className="flex items-center gap-2 text-xs font-mono-code text-[#f3f3f2]">
                  <Info className="w-3.5 h-3.5 text-[#f54e00]" />
                  <span className="font-semibold">Official Examination Instructions</span>
                  <span className="text-[10px] text-[#9b9a95]">({manifest.instructions.length} rules)</span>
                </div>
                <span className="text-xs text-[#9b9a95] font-mono-code">
                  {showInstructions ? 'Hide ▲' : 'View ▼'}
                </span>
              </button>
              {showInstructions && (
                <div className="px-4 py-3 bg-[#0c0d0e] border-t border-white/[0.06] text-xs text-[#9b9a95] space-y-1.5 font-mono-code">
                  {manifest.instructions.map((inst, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-[#f54e00] font-bold">•</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141517] border border-white/[0.08] rounded-xl max-w-sm w-full p-5 space-y-4">
            <div className="space-y-1 text-center">
              <h3 className="text-base font-normal text-[#f3f3f2] tracking-tight">
                Submit examination?
              </h3>
              <p className="text-xs text-[#9b9a95] leading-relaxed">
                Your answers will be evaluated against official mark scheme criteria with Error Carried Forward (ECF) rules applied.
              </p>
            </div>

            <div className="bg-[#0c0d0e] p-2.5 rounded-lg border border-white/[0.06] text-xs text-[#9b9a95] flex items-center justify-between font-mono-code">
              <span>Time remaining:</span>
              <span className="font-medium text-[#f54e00]">{formatTimer(timeRemainingSeconds)}</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2 rounded-lg cursor-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="flex-1 py-2 rounded-lg cursor-btn-primary text-xs"
              >
                Submit &amp; Grade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141517] border border-white/[0.08] rounded-xl max-w-md w-full p-6 space-y-4 text-center">
            <div className="space-y-1">
              <h2 className="text-base font-normal text-[#f3f3f2] tracking-tight">
                Grading in progress
              </h2>
              <p className="text-xs text-[#9b9a95] font-mono-code">{gradingProgress}</p>
            </div>

            <div className="space-y-1.5">
              <div className="w-full h-1.5 bg-[#0c0d0e] rounded-full overflow-hidden border border-white/[0.06]">
                <div
                  className="h-full bg-[#f54e00] rounded-full transition-all duration-300"
                  style={{ width: `${gradingPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono-code text-[#686763]">
                <span>Evaluating method &amp; accuracy marks</span>
                <span>{gradingPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
