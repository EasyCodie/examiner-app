'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ExamManifest,
  QuestionItem,
  SocraticMessage,
  PedagogicalTier,
  CanvasStroke,
} from '@/types/exam';
import { getManifestById, getAiConfig } from '@/lib/storage';
import { MissingKeyError, NO_KEY } from '@/lib/aiKey';
import { useAppShell } from '@/components/common/AppShell';
import { StorageErrorNotice } from '@/components/common/StorageErrorNotice';
import { SocraticSidebar, TutorFailure } from '@/components/socratic/SocraticSidebar';
import { ContentsStrip } from '@/components/exam/ContentsStrip';
import { ReportDialog } from '@/components/common/ReportDialog';
import { DrawingCanvas, DrawingCanvasRef } from '@/components/canvas/DrawingCanvas';
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar';
import { InlineDiagramCanvas } from '@/components/editor/InlineDiagramCanvas';
import { MathRenderer } from '@/components/common/MathRenderer';
import { PieChart } from 'lucide-react';

export default function SocraticLearnPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const paperId = params.paperId as string;
  const questionParam = searchParams.get('question');
  const { setHeaderInfo } = useAppShell();

  const [manifest, setManifest] = useState<ExamManifest | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [currentTier, setCurrentTier] = useState<PedagogicalTier>(1);
  const [isMarkschemeUnlocked, setIsMarkschemeUnlocked] = useState(false);
  const [highestTier, setHighestTier] = useState<Record<string, PedagogicalTier>>({});
  const [showRevealDialog, setShowRevealDialog] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [pendingLeaveHref, setPendingLeaveHref] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [tutorFailure, setTutorFailure] = useState<(TutorFailure & { questionId: string; text: string; tier: PedagogicalTier }) | null>(null);

  // Chat message history per question: questionId -> SocraticMessage[]
  const [conversations, setConversations] = useState<Record<string, SocraticMessage[]>>({});
  const [isLoadingTutor, setIsLoadingTutor] = useState(false);

  // Canvas drawing for STEM
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState('#1a2238');
  const [width, setWidth] = useState(2.5);
  const [strokes, setStrokes] = useState<Record<string, CanvasStroke[]>>({});
  const [questionBoxStrokes, setQuestionBoxStrokes] = useState<Record<string, Record<string, CanvasStroke[]>>>({});
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Humanities text & diagrams
  const [humanitiesText, setHumanitiesText] = useState<Record<string, string>>({});
  const [humanitiesDiagrams, setHumanitiesDiagrams] = useState<Record<string, string>>({});
  const [showHumanitiesDiagram, setShowHumanitiesDiagram] = useState(false);

  useEffect(() => {
    getManifestById(paperId).then((m) => {
      if (!m) {
        setNotFound(true);
        return;
      }
      if (m) {
        setManifest(m);
        setHeaderInfo({
          paperTitle: m.title,
          category: m.category,
          mode: 'SOCRATIC_LEARN',
          paperId: m.id,
          subjectCode: m.subjectCode,
        });

        let targetIdx = 0;
        if (questionParam) {
          const qIdx = parseInt(questionParam, 10);
          if (!isNaN(qIdx) && qIdx >= 0 && qIdx < m.questions.length) {
            targetIdx = qIdx;
            setSelectedQuestionIndex(qIdx);
          }
        }

        // Initialize welcome message for the initial active question
        const targetQ = m.questions[targetIdx];
        if (targetQ) {
          setConversations((prev) => {
            if (prev[targetQ.id]) return prev;
            return {
              ...prev,
              [targetQ.id]: [
                {
                  id: `welcome-${targetQ.id}`,
                  sender: 'tutor',
                  text: `Welcome! Let's work through Question ${targetQ.number.replace(/^Question\s*/i, '')} together step by step.\n\nTo start, take a look at the command term: **“${targetQ.commandTerm}”**. How would you like to set up your first step?`,
                  timestamp: new Date().toISOString(),
                  tierActive: 1,
                },
              ],
            };
          });
        }
      }
    }).catch(() => setStorageError(true));
  }, [paperId, setHeaderInfo, questionParam]);

  const currentQuestion: QuestionItem | undefined = manifest?.questions[selectedQuestionIndex];

  // Guided practice isn't saved, so leaving loses the working, the tutor conversation and any unsent message
  const hasUnsavedWork =
    hasDraft ||
    Object.values(strokes).some((s) => s.length > 0) ||
    Object.values(questionBoxStrokes).some((boxes) => Object.values(boxes).some((b) => b.length > 0)) ||
    Object.values(humanitiesText).some((t) => t.trim()) ||
    Object.values(humanitiesDiagrams).some(Boolean) ||
    Object.values(conversations).some((messages) => messages.some((m) => m.sender === 'student'));

  useEffect(() => {
    if (!hasUnsavedWork) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    // Links off this page (the header's logo and mode switch) ask first; captured before Next's Link navigates
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest('a[href]');
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank') return;
      if (link.origin !== window.location.origin || link.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingLeaveHref(link.pathname + link.search + link.hash);
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('click', onClick, true);
    };
  }, [hasUnsavedWork]);

  const handleSelectQuestion = useCallback((idx: number) => {
    setSelectedQuestionIndex(idx);
    setCurrentTier(1);
    setIsMarkschemeUnlocked(false);
    setTutorFailure(null);

    const q = manifest?.questions[idx];
    if (q) {
      setConversations((prev) => {
        if (prev[q.id] && prev[q.id].length > 0) return prev;
        return {
          ...prev,
          [q.id]: [
            {
              id: `welcome-${q.id}`,
              sender: 'tutor',
              text: `Welcome! Let's work through Question ${q.number.replace(/^Question\s*/i, '')} together step by step.\n\nTo start, take a look at the command term: **“${q.commandTerm}”**. How would you like to set up your first step?`,
              timestamp: new Date().toISOString(),
              tierActive: 1,
            },
          ],
        };
      });
    }
  }, [manifest]);

  // Keyboard navigation: ArrowLeft / ArrowRight to switch questions (when not typing)
  useEffect(() => {
    const handleKeyNav = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (!manifest) return;

      if (e.key === 'ArrowLeft') {
        if (selectedQuestionIndex > 0) {
          e.preventDefault();
          handleSelectQuestion(selectedQuestionIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (selectedQuestionIndex < manifest.questions.length - 1) {
          e.preventDefault();
          handleSelectQuestion(selectedQuestionIndex + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyNav);
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, [selectedQuestionIndex, manifest, handleSelectQuestion]);

  // Ask the Socratic tutor, given the conversation so far (which already ends with the student's message)
  const askTutor = async (history: SocraticMessage[], userText: string, tier: PedagogicalTier) => {
    if (!currentQuestion) return;
    const questionId = currentQuestion.id;
    setIsLoadingTutor(true);
    setTutorFailure(null);

    try {
      let snapshotImg = '';
      if (manifest?.category === 'STEM' && canvasRef.current) {
        snapshotImg = canvasRef.current.getCanvasSnapshot();
      } else if (manifest?.category === 'HUMANITIES') {
        snapshotImg = humanitiesDiagrams[questionId] || '';
      }

      const cfg = await getAiConfig();
      if (!cfg.apiKey) throw new MissingKeyError();
      const response = await fetch('/api/socratic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { 'x-gemini-key': cfg.apiKey } : {}),
        },
        body: JSON.stringify({
          question: currentQuestion,
          messages: history,
          requestedTier: tier,
          userMessage: userText,
          studentSnapshotImageBase64: snapshotImg,
          studentSnapshotText: humanitiesText[questionId] || '',
          thinkingBudget: cfg.thinkingBudgetSocratic ?? 2048,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.response) {
        if (data.code === NO_KEY) throw new MissingKeyError();
        throw new Error(data.error || data.message || `the tutor service returned ${response.status}`);
      }

      const reply = data.response;
      const tutorMsg: SocraticMessage = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: reply.text,
        timestamp: new Date().toISOString(),
        tierActive: reply.tierActive,
        formulaQuote: reply.formulaQuote,
        diagnosticHighlight: reply.diagnosticHighlight,
        unlockedMarkscheme: reply.unlockedMarkscheme,
      };

      if (reply.unlockedMarkscheme) setIsMarkschemeUnlocked(true);
      setConversations((prev) => ({ ...prev, [questionId]: [...history, tutorMsg] }));
    } catch (err) {
      if (!(err instanceof MissingKeyError)) console.error('Socratic error', err);
      const message = err instanceof Error ? err.message : 'unknown error';
      setTutorFailure({
        questionId,
        text: userText,
        tier,
        message,
        needsKey: err instanceof MissingKeyError,
      });
    } finally {
      setIsLoadingTutor(false);
    }
  };

  const handleSendMessage = async (userText: string, tier: PedagogicalTier = currentTier) => {
    if (!currentQuestion) return;
    const userMsg: SocraticMessage = {
      id: `user-${Date.now()}`,
      sender: 'student',
      text: userText,
      timestamp: new Date().toISOString(),
    };
    const updatedHistory = [...(conversations[currentQuestion.id] || []), userMsg];
    setConversations((prev) => ({ ...prev, [currentQuestion.id]: updatedHistory }));
    setHighestTier((prev) => ({
      ...prev,
      [currentQuestion.id]: Math.max(prev[currentQuestion.id] ?? 0, tier) as PedagogicalTier,
    }));
    await askTutor(updatedHistory, userText, tier);
  };

  const handleRetry = () => {
    if (!currentQuestion || !tutorFailure || tutorFailure.questionId !== currentQuestion.id) return;
    askTutor(conversations[currentQuestion.id] || [], tutorFailure.text, tutorFailure.tier);
  };

  const TIER_PROMPTS: Record<1 | 2 | 3, (q: QuestionItem) => string> = {
    1: (q) => `What does the command term “${q.commandTerm}” mean for this question?`,
    2: () => 'Which formula or concept applies to this step?',
    3: () => 'Can you check my current step and see if my working is on the right track?',
  };

  const handleAskTier = (tier: 1 | 2 | 3) => {
    if (!currentQuestion) return;
    setCurrentTier(tier);
    handleSendMessage(TIER_PROMPTS[tier](currentQuestion), tier);
  };

  const handleUnlockMarkscheme = async () => {
    setShowRevealDialog(false);
    setCurrentTier(4);
    setIsMarkschemeUnlocked(true);
    await handleSendMessage('Please reveal the markscheme breakdown and mark codes.', 4);
  };

  if (storageError) return <StorageErrorNotice />;

  if (notFound) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="script-sheet paper-surface max-w-[560px] w-full px-8 py-10 space-y-4">
          <h1 className="font-serif text-[28px] font-semibold text-ink">Paper not found</h1>
          <p className="text-[16px] leading-relaxed text-ink-muted">
            There is no paper with the reference <span className="font-mono text-ink">{paperId}</span> on this device.
          </p>
          <Link href="/" className="btn btn-ink">
            Choose a paper
          </Link>
        </div>
      </div>
    );
  }

  if (!manifest || !currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center p-8" role="status">
        <p className="text-[15px] text-shell-muted">Opening the paper…</p>
      </div>
    );
  }

  const isStem = manifest.category === 'STEM';
  const questionHasWorking = (q: QuestionItem) =>
    isStem
      ? (strokes[q.id]?.length ?? 0) > 0 || Object.values(questionBoxStrokes[q.id] ?? {}).some((b) => b.length > 0)
      : Boolean(humanitiesText[q.id]?.trim() || humanitiesDiagrams[q.id]);

  const contentsItems = manifest.questions.map((q, idx) => ({
    key: q.id,
    label: q.number.replace(/^Question\s*/i, '').replace(/\.$/, ''),
    marks: q.totalMarks,
    hasWorking: questionHasWorking(q),
    isCurrent: idx === selectedQuestionIndex,
  }));

  const insertSnippet = (snippet: string) => {
    const existing = humanitiesText[currentQuestion.id] || '';
    setHumanitiesText((prev) => ({ ...prev, [currentQuestion.id]: existing ? `${existing}\n\n${snippet}` : snippet }));
  };

  return (
    <div className="flex-1 flex flex-col select-text">
      <ContentsStrip
        items={contentsItems}
        onSelect={(key) => handleSelectQuestion(manifest.questions.findIndex((q) => q.id === key))}
      />

      <div
        className={`w-full max-w-[1440px] mx-auto px-3 sm:px-5 py-6 sm:py-8 grid gap-6 items-start ${
          isStem ? 'lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[152px_minmax(0,1fr)_400px]' : 'lg:grid-cols-[minmax(0,1fr)_420px]'
        }`}
      >
        {isStem && (
          <div className="hidden xl:block sticky top-[124px]">
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
            />
          </div>
        )}
        <div className="min-w-0 flex flex-col">
          {isStem ? (
            <>
              {/* Below xl the tools sit above the sheet, never over the paper */}
              <div className="xl:hidden mb-4 border border-shell-line">
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
                />
              </div>
              <DrawingCanvas
                key={`learn-canvas-${currentQuestion.id}`}
                ref={canvasRef}
                pageNumber={currentQuestion.pageNumber}
                questionsOnPage={[currentQuestion]}
                paperTitle={manifest.title}
                tool={tool}
                color={color}
                width={width}
                initialStrokes={strokes[currentQuestion.id] || []}
                boxStrokes={questionBoxStrokes[currentQuestion.id]}
                onBoxStrokesChange={(boxes) => {
                  setQuestionBoxStrokes((prev) => ({ ...prev, [currentQuestion.id]: boxes }));
                }}
                onStrokesChange={(updated) => {
                  setStrokes((prev) => ({ ...prev, [currentQuestion.id]: updated }));
                }}
                onToolChange={(u, r) => {
                  setCanUndo(u);
                  setCanRedo(r);
                }}
                compact={true}
              />
            </>
          ) : (
            <article className="script-sheet paper-surface px-6 sm:px-10 py-8 sm:py-10 space-y-6">
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 items-baseline border-b border-ink pb-3">
                <h2 className="font-serif text-[28px] font-semibold leading-none text-ink tabular">
                  {currentQuestion.number.replace(/^Question\s*/i, '')}
                </h2>
                <p className="text-[14px] text-ink-muted truncate">{currentQuestion.syllabusSubtopic}</p>
                <p className="font-serif text-[15px] font-semibold text-ink tabular">[{currentQuestion.totalMarks}]</p>
              </div>

              <div className="font-serif text-[17px] leading-[1.65] text-ink max-w-[65ch]">
                <MathRenderer content={currentQuestion.promptText} lightMode={true} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-paper-rule pt-4">
                <label htmlFor="learn-draft" className="text-[15px] font-semibold text-ink">
                  Your draft
                </label>
                <button
                  type="button"
                  onClick={() => setShowHumanitiesDiagram(!showHumanitiesDiagram)}
                  aria-expanded={showHumanitiesDiagram}
                  className="btn btn-sm btn-quiet-paper"
                >
                  <PieChart className="w-4 h-4" aria-hidden="true" />
                  {showHumanitiesDiagram ? 'Close diagram' : humanitiesDiagrams[currentQuestion.id] ? 'Edit diagram' : 'Add a diagram'}
                </button>
              </div>

              {showHumanitiesDiagram && (
                <div className="bg-paper-tint border border-paper-rule px-4 py-4">
                  <InlineDiagramCanvas
                    initialImage={humanitiesDiagrams[currentQuestion.id]}
                    onSave={(img) => setHumanitiesDiagrams((prev) => ({ ...prev, [currentQuestion.id]: img }))}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Paragraph starters">
                <span className="text-[14px] text-ink-muted mr-1">Paragraph starters:</span>
                {[
                  ['Definition', '**Definition & theoretical context:**\n'],
                  ['Diagram analysis', '**Diagram analysis & mechanism:**\nAs shown in the diagram, the initial equilibrium...'],
                  ['Example', '**Real-world example:**\nFor instance, in the case of...'],
                  ['Evaluation', '**Evaluation & conclusion:**\nIn the short run vs long run, the most critical tradeoff is...'],
                ].map(([label, snippet]) => (
                  <button key={label} type="button" onClick={() => insertSnippet(snippet)} className="btn btn-sm btn-quiet-paper">
                    {label}
                  </button>
                ))}
              </div>

              <textarea
                id="learn-draft"
                value={humanitiesText[currentQuestion.id] || ''}
                onChange={(e) => {
                  const text = e.target.value;
                  setHumanitiesText((prev) => ({ ...prev, [currentQuestion.id]: text }));
                }}
                placeholder="Draft your answer here. The tutor reads it when you ask for help."
                className="ruled w-full min-h-[360px] px-4 pt-[18px] pb-8 bg-paper bg-[position:0_45px] border border-paper-rule-strong font-serif text-[17px] leading-[28px] text-student caret-student placeholder:text-ink-muted resize-y outline-none focus-visible:outline-2 focus-visible:outline-ink"
              />
            </article>
          )}
        </div>

        <div className="lg:sticky lg:top-[124px] lg:h-[calc(100dvh-148px)] min-h-[560px] flex flex-col">
          <SocraticSidebar
            question={currentQuestion}
            currentTier={currentTier}
            highestTierReached={highestTier[currentQuestion.id] ?? 0}
            isMarkschemeUnlocked={isMarkschemeUnlocked}
            onAskTier={handleAskTier}
            onRequestReveal={() => setShowRevealDialog(true)}
            messages={conversations[currentQuestion.id] || []}
            onSendMessage={(text) => handleSendMessage(text)}
            isLoading={isLoadingTutor}
            failure={tutorFailure && tutorFailure.questionId === currentQuestion.id ? tutorFailure : null}
            onRetry={handleRetry}
            workingShared={questionHasWorking(currentQuestion)}
            onDraftChange={setHasDraft}
          />
        </div>
      </div>

      <ReportDialog open={showRevealDialog} onClose={() => setShowRevealDialog(false)} title="Reveal the markscheme?">
        <p className="text-[16px] leading-relaxed text-ink">
          You&rsquo;ll see the full mark breakdown for question {contentsItems[selectedQuestionIndex]?.label}. Once you&rsquo;ve
          read it, this question is no longer a fair test of what you know.
        </p>
        <div className="flex flex-wrap justify-end gap-3 pt-1">
          <button type="button" onClick={() => setShowRevealDialog(false)} className="btn btn-quiet-paper" autoFocus>
            Keep working
          </button>
          <button type="button" onClick={handleUnlockMarkscheme} className="btn btn-ink">
            Reveal markscheme
          </button>
        </div>
      </ReportDialog>

      <ReportDialog open={pendingLeaveHref !== null} onClose={() => setPendingLeaveHref(null)} title="Leave guided practice?">
        <p className="text-[16px] leading-relaxed text-ink">
          Guided practice isn&rsquo;t saved. Your working, the tutor conversation and any unsent message will be lost.
        </p>
        <div className="flex flex-wrap justify-end gap-3 pt-1">
          <button type="button" onClick={() => setPendingLeaveHref(null)} className="btn btn-quiet-paper" autoFocus>
            Stay
          </button>
          <button
            type="button"
            onClick={() => {
              if (pendingLeaveHref) router.push(pendingLeaveHref);
              setPendingLeaveHref(null);
            }}
            className="btn btn-ink"
          >
            Leave
          </button>
        </div>
      </ReportDialog>
    </div>
  );
}
