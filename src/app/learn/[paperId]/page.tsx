'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
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
import { MathRenderer } from '@/components/common/MathRenderer';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function SocraticLearnPage() {
  const params = useParams();
  const paperId = params.paperId as string;
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

  // Humanities text
  const [humanitiesText, setHumanitiesText] = useState<Record<string, string>>({});

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

        // Initialize welcome message for first question
        const q0 = m.questions[0];
        if (q0) {
          setConversations((prev) => {
            if (prev[q0.id]) return prev;
            return {
              ...prev,
              [q0.id]: [
                {
                  id: 'welcome-0',
                  sender: 'tutor',
                  text: `Welcome! Let's tackle **${q0.number.replace(/^Question\s*/i, '')}** together using our 4-tier pedagogical scaffold.\n\nWe start at **Tier 1: Command Term Anchor**. The command term here is **"${q0.commandTerm}"**. How are you thinking of setting up your first step?`,
                  timestamp: new Date().toISOString(),
                  tierActive: 1,
                },
              ],
            };
          });
        }
      }
    });
  }, [paperId, setHeaderInfo]);

  const currentQuestion: QuestionItem | undefined = manifest?.questions[selectedQuestionIndex];

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
      if (canvasRef.current) {
        snapshotImg = canvasRef.current.getCanvasSnapshot();
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
        <Sparkles className="w-8 h-8 text-[#f54e00] animate-spin" />
      </div>
    );
  }

  const isStem = manifest.category === 'STEM';

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full gap-5 select-text pb-16">
      {/* Sticky Question Tabs Bar (DESIGN.md Cursor Dark Mode) */}
      <div className="sticky top-12 z-20 flex items-center justify-between bg-[#141517]/95 backdrop-blur-md border border-white/[0.08] rounded-xl p-2.5 shadow-lg">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-mono-code uppercase text-[#686763] font-semibold px-1">Q:</span>
          {manifest.questions.map((q, idx) => {
            const isSelected = idx === selectedQuestionIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setSelectedQuestionIndex(idx);
                  setCurrentTier(1);
                  setIsMarkschemeUnlocked(false);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-mono-code whitespace-nowrap transition flex items-center justify-center ${
                  isSelected
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
            disabled={selectedQuestionIndex <= 0}
            onClick={() => setSelectedQuestionIndex((prev) => prev - 1)}
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
            onClick={() => setSelectedQuestionIndex((prev) => prev + 1)}
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
            <div className="flex-1 bg-[#141517] border border-white/[0.08] rounded-xl p-6 flex flex-col space-y-4">
              <div className="border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-code font-bold uppercase text-[#f54e00] bg-[#f54e00]/10 px-2 py-0.5 rounded border border-[#f54e00]/20">
                    {currentQuestion.commandTerm}
                  </span>
                  <span className="text-xs text-[#9b9a95] font-mono-code">
                    {currentQuestion.syllabusSubtopic}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-[#f3f3f2] mt-2 tracking-tight">
                  {currentQuestion.number.replace(/^Question\s*/i, '')} ({currentQuestion.totalMarks} Marks)
                </h3>
              </div>

              <div className="bg-[#0c0d0e] p-4 rounded-xl border border-white/[0.08] text-[#f3f3f2] text-sm">
                <MathRenderer content={currentQuestion.promptText} />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="text-xs font-mono-code font-semibold text-[#9b9a95] uppercase tracking-wider mb-1.5">
                  Your Draft Response:
                </label>
                <textarea
                  value={humanitiesText[currentQuestion.id] || ''}
                  onChange={(e) => {
                    const text = e.target.value;
                    setHumanitiesText((prev) => ({ ...prev, [currentQuestion.id]: text }));
                  }}
                  placeholder="Draft your thoughts or write your working here..."
                  className="flex-1 min-h-[320px] bg-[#0c0d0e] border border-white/[0.08] rounded-xl p-4 text-xs font-mono-code text-[#f3f3f2] placeholder:text-[#686763] outline-none focus:border-[#f54e00]"
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
