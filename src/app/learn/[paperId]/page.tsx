'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ExamManifest,
  QuestionItem,
  SocraticMessage,
  PedagogicalTier,
  CanvasStroke,
} from '@/types/exam';
import { getManifestById, getAiConfig } from '@/lib/storage';
import { useAppShell } from '@/components/common/AppShell';
import { SocraticSidebar } from '@/components/socratic/SocraticSidebar';
import { DrawingCanvas, DrawingCanvasRef } from '@/components/canvas/DrawingCanvas';
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar';
import { InlineDiagramCanvas } from '@/components/editor/InlineDiagramCanvas';
import { MathRenderer } from '@/components/common/MathRenderer';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PieChart,
} from 'lucide-react';

export default function SocraticLearnPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const paperId = params.paperId as string;
  const questionParam = searchParams.get('question');
  const { setHeaderInfo } = useAppShell();

  const [manifest, setManifest] = useState<ExamManifest | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [currentTier, setCurrentTier] = useState<PedagogicalTier>(1);
  const [isMarkschemeUnlocked, setIsMarkschemeUnlocked] = useState(false);

  // Chat message history per question: questionId -> SocraticMessage[]
  const [conversations, setConversations] = useState<Record<string, SocraticMessage[]>>({});
  const [isLoadingTutor, setIsLoadingTutor] = useState(false);

  // Canvas drawing for STEM
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState('#0f172a');
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
      if (m) {
        setManifest(m);
        setHeaderInfo({
          paperTitle: m.title,
          category: m.category,
          mode: 'SOCRATIC_LEARN',
          paperId: m.id,
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
                  text: `Welcome! Let's tackle **${targetQ.number.replace(/^Question\s*/i, '')}** together using our 4-tier pedagogical scaffold.\n\nWe start at **Tier 1: Command Term Anchor**. The command term here is **"${targetQ.commandTerm}"**. How are you thinking of setting up your first step?`,
                  timestamp: new Date().toISOString(),
                  tierActive: 1,
                },
              ],
            };
          });
        }
      }
    });
  }, [paperId, setHeaderInfo, questionParam]);

  const currentQuestion: QuestionItem | undefined = manifest?.questions[selectedQuestionIndex];

  const handleSelectQuestion = (idx: number) => {
    setSelectedQuestionIndex(idx);
    setCurrentTier(1);
    setIsMarkschemeUnlocked(false);

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
              text: `Welcome! Let's tackle **${q.number.replace(/^Question\s*/i, '')}** together using our 4-tier pedagogical scaffold.\n\nWe start at **Tier 1: Command Term Anchor**. The command term here is **"${q.commandTerm}"**. How are you thinking of setting up your first step?`,
              timestamp: new Date().toISOString(),
              tierActive: 1,
            },
          ],
        };
      });
    }
  };

  // Send message to Socratic tutor
  const handleSendMessage = async (userText: string, tier: PedagogicalTier) => {
    if (!currentQuestion) return;

    const userMsg: SocraticMessage = {
      id: `user-${Date.now()}`,
      sender: 'student',
      text: userText,
      timestamp: new Date().toISOString(),
    };

    const currentHistory = conversations[currentQuestion.id] || [];
    const updatedHistory = [...currentHistory, userMsg];
    setConversations((prev) => ({ ...prev, [currentQuestion.id]: updatedHistory }));

    setIsLoadingTutor(true);

    try {
      // Capture student snapshot
      let snapshotImg = '';
      if (manifest?.category === 'STEM' && canvasRef.current) {
        snapshotImg = canvasRef.current.getCanvasSnapshot();
      } else if (manifest?.category === 'HUMANITIES') {
        snapshotImg = humanitiesDiagrams[currentQuestion.id] || '';
      }

      const cfg = await getAiConfig();

      const response = await fetch('/api/socratic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { 'x-gemini-key': cfg.apiKey } : {}),
        },
        body: JSON.stringify({
          question: currentQuestion,
          messages: updatedHistory,
          requestedTier: tier,
          userMessage: userText,
          studentSnapshotImageBase64: snapshotImg,
          studentSnapshotText: humanitiesText[currentQuestion.id] || '',
          thinkingBudget: cfg.thinkingBudgetSocratic ?? 2048,
        }),
      });

      const data = await response.json();

      if (response.ok && data.response) {
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

        if (reply.unlockedMarkscheme) {
          setIsMarkschemeUnlocked(true);
        }

        setConversations((prev) => ({
          ...prev,
          [currentQuestion.id]: [...updatedHistory, tutorMsg],
        }));
      }
    } catch (err) {
      console.error('Socratic error', err);
    } finally {
      setIsLoadingTutor(false);
    }
  };

  const handleUnlockMarkscheme = async () => {
    setCurrentTier(4);
    setIsMarkschemeUnlocked(true);
    await handleSendMessage('Please reveal the official Senior Examiner markscheme breakdown and mark codes.', 4);
  };

  if (!manifest || !currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Sparkles className="w-8 h-8 text-[var(--cursor-primary)] animate-spin" />
      </div>
    );
  }

  const isStem = manifest.category === 'STEM';

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full gap-5 select-text pb-16">
      {/* Sticky Question Tabs Bar (DESIGN.md Geneva Diplomatic) */}
      <div className="sticky top-12 z-20 flex items-center justify-between bg-[var(--cursor-surface-card)]/95 backdrop-blur-md border border-white/[0.08] rounded-xl p-2.5 shadow-lg">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-mono-code uppercase text-[var(--cursor-text-faint)] font-semibold px-1">Q:</span>
          {manifest.questions.map((q, idx) => {
            const isSelected = idx === selectedQuestionIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => handleSelectQuestion(idx)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono-code whitespace-nowrap transition flex items-center justify-center ${
                  isSelected
                    ? 'bg-[var(--cursor-primary)] text-white font-semibold shadow-sm'
                    : 'bg-[var(--cursor-canvas)] text-[var(--cursor-text-muted)] hover:text-white border border-white/[0.06]'
                }`}
              >
                <span>{q.number.replace(/^Question\s*/i, '')}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 text-xs text-[var(--cursor-text-muted)] font-mono-code shrink-0 pl-2">
          <button
            type="button"
            disabled={selectedQuestionIndex <= 0}
            onClick={() => handleSelectQuestion(selectedQuestionIndex - 1)}
            className="p-1 hover:text-white disabled:opacity-30 transition"
            title="Previous Question"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-1 text-[11px]">
            {selectedQuestionIndex + 1} / {manifest.questions.length}
          </span>
          <button
            type="button"
            disabled={selectedQuestionIndex >= manifest.questions.length - 1}
            onClick={() => handleSelectQuestion(selectedQuestionIndex + 1)}
            className="p-1 hover:text-white disabled:opacity-30 transition"
            title="Next Question"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Socratic Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start flex-1">
        {/* LEFT PANE (Col 1-7): Student Workspace (Canvas / Editor) */}
        <div className="lg:col-span-7 flex flex-col space-y-3.5">
          {isStem ? (
            <>
              {/* Canvas Toolbar */}
              <div className="w-full flex justify-center">
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
                  currentPage={currentQuestion.pageNumber}
                  totalPages={Math.max(1, ...manifest.questions.map((q) => q.pageNumber))}
                  onPageChange={() => {}}
                  showPageNav={false}
                />
              </div>

              {/* Interactive Canvas Sheet */}
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
            <div className="flex-1 bg-[var(--cursor-surface-card)] border border-white/[0.08] rounded-xl p-6 flex flex-col space-y-4">
              <div className="border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-code font-bold uppercase text-[var(--cursor-primary)] bg-[var(--cursor-primary-soft)] px-2 py-0.5 rounded border border-[var(--cursor-primary)]/20">
                    {currentQuestion.commandTerm}
                  </span>
                  <span className="text-xs text-[var(--cursor-text-muted)] font-mono-code">
                    {currentQuestion.syllabusSubtopic}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-[var(--cursor-text-strong)] mt-2 tracking-tight">
                  {currentQuestion.number.replace(/^Question\s*/i, '')} ({currentQuestion.totalMarks} Marks)
                </h3>
              </div>

              <div className="bg-[var(--cursor-canvas)] p-4 rounded-xl border border-white/[0.08] text-[var(--cursor-text-strong)] text-sm">
                <MathRenderer content={currentQuestion.promptText} />
              </div>

              <div className="flex-1 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono-code font-semibold text-[var(--cursor-text-muted)] uppercase tracking-wider">
                    Your Draft Response:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHumanitiesDiagram(!showHumanitiesDiagram)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono-code transition ${
                      showHumanitiesDiagram
                        ? 'bg-[var(--cursor-primary)] text-white font-medium shadow-sm'
                        : humanitiesDiagrams[currentQuestion.id]
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-[var(--cursor-canvas)] text-[var(--cursor-text-muted)] hover:text-[var(--cursor-text-strong)] border border-white/[0.08]'
                    }`}
                  >
                    <PieChart className="w-3.5 h-3.5" />
                    <span>
                      {showHumanitiesDiagram
                        ? 'Hide Diagram'
                        : humanitiesDiagrams[currentQuestion.id]
                        ? 'Diagram Attached (Edit)'
                        : '+ Economic Diagram'}
                    </span>
                  </button>
                </div>

                {showHumanitiesDiagram && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <InlineDiagramCanvas
                      initialImage={humanitiesDiagrams[currentQuestion.id]}
                      onSave={(img) =>
                        setHumanitiesDiagrams((prev) => ({ ...prev, [currentQuestion.id]: img }))
                      }
                    />
                  </div>
                )}

                {/* Pedagogical Essay Scaffolding Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono-code uppercase font-semibold text-[var(--cursor-text-faint)] mr-1">
                    Scaffolding:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = '**Definition & Theoretical Context:**\n';
                      const existing = humanitiesText[currentQuestion.id] || '';
                      setHumanitiesText((prev) => ({
                        ...prev,
                        [currentQuestion.id]: existing ? `${existing}\n\n${snippet}` : snippet,
                      }));
                    }}
                    className="text-[10px] font-mono-code font-medium text-[var(--cursor-text-muted)] hover:text-[var(--cursor-text-strong)] bg-[var(--cursor-canvas)] hover:bg-[var(--cursor-surface-strong)] border border-white/[0.08] px-2 py-0.5 rounded transition"
                  >
                    + Definition
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = '**Diagram Analysis & Mechanism:**\nAs shown in the diagram, the initial equilibrium...';
                      const existing = humanitiesText[currentQuestion.id] || '';
                      setHumanitiesText((prev) => ({
                        ...prev,
                        [currentQuestion.id]: existing ? `${existing}\n\n${snippet}` : snippet,
                      }));
                    }}
                    className="text-[10px] font-mono-code font-medium text-[var(--cursor-text-muted)] hover:text-[var(--cursor-text-strong)] bg-[var(--cursor-canvas)] hover:bg-[var(--cursor-surface-strong)] border border-white/[0.08] px-2 py-0.5 rounded transition"
                  >
                    + Diagram Analysis
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = '**Real-World Example / Application:**\nFor instance, in the case of...';
                      const existing = humanitiesText[currentQuestion.id] || '';
                      setHumanitiesText((prev) => ({
                        ...prev,
                        [currentQuestion.id]: existing ? `${existing}\n\n${snippet}` : snippet,
                      }));
                    }}
                    className="text-[10px] font-mono-code font-medium text-[var(--cursor-text-muted)] hover:text-[var(--cursor-text-strong)] bg-[var(--cursor-canvas)] hover:bg-[var(--cursor-surface-strong)] border border-white/[0.08] px-2 py-0.5 rounded transition"
                  >
                    + Example
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = '**Evaluation & Conclusion (Stakeholder synthesis):**\nIn the short run vs long run, the most critical tradeoff is...';
                      const existing = humanitiesText[currentQuestion.id] || '';
                      setHumanitiesText((prev) => ({
                        ...prev,
                        [currentQuestion.id]: existing ? `${existing}\n\n${snippet}` : snippet,
                      }));
                    }}
                    className="text-[10px] font-mono-code font-medium text-[var(--cursor-primary)] bg-[var(--cursor-primary-soft)] hover:bg-[var(--cursor-primary-soft)]/80 border border-[var(--cursor-primary)]/30 px-2 py-0.5 rounded transition"
                  >
                    + Evaluation
                  </button>
                </div>

                <textarea
                  value={humanitiesText[currentQuestion.id] || ''}
                  onChange={(e) => {
                    const text = e.target.value;
                    setHumanitiesText((prev) => ({ ...prev, [currentQuestion.id]: text }));
                  }}
                  placeholder="Draft your thoughts or write your working here..."
                  className="flex-1 min-h-[300px] bg-[var(--cursor-canvas)] border border-white/[0.08] rounded-xl p-4 text-xs font-mono-code text-[var(--cursor-text-strong)] placeholder:text-[var(--cursor-text-faint)] outline-none focus:border-[var(--cursor-primary)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANE (Col 8-12): Sticky Low-Latency Socratic Sidebar */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 h-auto lg:h-[calc(100vh-120px)] min-h-[500px] lg:max-h-[860px] flex flex-col">
          <SocraticSidebar
            question={currentQuestion}
            currentTier={currentTier}
            onSelectTier={setCurrentTier}
            messages={conversations[currentQuestion.id] || []}
            onSendMessage={handleSendMessage}
            isLoading={isLoadingTutor}
            isMarkschemeUnlocked={isMarkschemeUnlocked}
            onUnlockMarkscheme={handleUnlockMarkscheme}
          />
        </div>
      </div>
    </div>
  );
}
