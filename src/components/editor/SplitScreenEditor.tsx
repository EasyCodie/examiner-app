'use client';

import React, { useState, useMemo } from 'react';
import { QuestionItem, QuestionSubmission } from '@/types/exam';
import { MathRenderer } from '@/components/common/MathRenderer';
import { InlineDiagramCanvas } from './InlineDiagramCanvas';
import {
  FileText,
  PieChart,
  CheckCircle2,
} from 'lucide-react';

interface SplitScreenEditorProps {
  questions: QuestionItem[];
  activeQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  submissions: Record<string, QuestionSubmission>;
  onUpdateSubmission: (questionId: string, text: string, diagramBase64?: string) => void;
}

export const SplitScreenEditor: React.FC<SplitScreenEditorProps> = ({
  questions,
  activeQuestionIndex,
  onSelectQuestion,
  submissions,
  onUpdateSubmission,
}) => {
  const currentQuestion = questions[activeQuestionIndex] || questions[0];
  const submission = submissions[currentQuestion.id] || {
    questionId: currentQuestion.id,
    questionNumber: currentQuestion.number,
    textResponse: '',
    timeSpentSeconds: 0,
  };

  const [showDiagram, setShowDiagram] = useState(Boolean(currentQuestion.diagramRequired));

  const wordCount = useMemo(() => {
    const text = submission.textResponse || '';
    return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
  }, [submission.textResponse]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateSubmission(currentQuestion.id, e.target.value, submission.diagramImageBase64);
  };

  const handleDiagramSave = (diagramBase64: string) => {
    onUpdateSubmission(currentQuestion.id, submission.textResponse || '', diagramBase64);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-auto min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] gap-5 select-text">
      {/* LEFT PANE: Authentic Question Booklet Presentation (Zero Leaks / Strict Simulation) */}
      <div className="double-bezel-outer-dark w-full lg:w-5/12 h-auto lg:h-full">
        <div className="double-bezel-inner-dark h-full flex flex-col overflow-hidden">
          {/* Question Selector Tabs */}
          <div className="flex items-center gap-2 p-3 bg-[#181715] border-b border-white/10 overflow-x-auto">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(submissions[q.id]?.textResponse?.trim());
              const isActive = idx === activeQuestionIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onSelectQuestion(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono-code whitespace-nowrap transition-fluid flex items-center gap-1.5 focus-ring ${isActive
                    ? 'bg-[#cc785c] text-white shadow-sm font-medium border border-transparent'
                    : 'bg-[#252320] text-[#a09d96] hover:text-[#faf9f5] hover:bg-[#2c2a26] border border-white/10'
                    }`}
                >
                  <span>{q.number}</span>
                  {isAnswered && <CheckCircle2 className="w-3 h-3 text-[#5db8a6]" />}
                  <span className="text-[10px] opacity-70">[{q.totalMarks}m]</span>
                </button>
              );
            })}
          </div>

          {/* Authentic Question Booklet Content */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-[11px] font-mono-code font-semibold tracking-wider text-[#a09d96] uppercase">
                  Question
                </span>
                <h2 className="text-2xl font-serif font-normal text-[#faf9f5] mt-1 tracking-tight">
                  {currentQuestion.number}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold font-mono-code text-[#cc785c] bg-[#181715] border border-white/10 px-3 py-1 rounded-lg block shadow-2xs">
                  [{currentQuestion.totalMarks} Marks]
                </span>
              </div>
            </div>

            {/* Official Question Text / Prompt */}
            <div className="bg-[#181715] p-5 rounded-xl border border-white/10 text-[#faf9f5] leading-relaxed text-sm shadow-2xs">
              <MathRenderer content={currentQuestion.promptText} lightMode={false} />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Distraction-Free Essay Composer & Autonomous Diagram Sketchpad */}
      <div className="double-bezel-outer-dark w-full lg:w-7/12 h-auto lg:h-full">
        <div className="double-bezel-inner-dark h-full flex flex-col overflow-hidden">
          {/* Editor Header: Candidate Work Status & Diagram Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#181715] border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-code font-semibold text-[#faf9f5] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#cc785c]" />
                Your Essay
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Economic Diagram Drawer Toggle */}
              <button
                type="button"
                onClick={() => setShowDiagram(!showDiagram)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-code transition-fluid focus-ring ${showDiagram
                  ? 'bg-[#cc785c] text-white font-medium shadow-sm'
                  : submission.diagramImageBase64
                    ? 'bg-[#5db8a6]/15 text-[#5db8a6] border border-[#5db8a6]/30'
                    : 'bg-[#252320] text-[#a09d96] hover:text-[#faf9f5] border border-white/10'
                  }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>
                  {showDiagram
                    ? 'Hide Diagram'
                    : submission.diagramImageBase64
                      ? 'Diagram Attached (Edit)'
                      : '+ Add Diagram'}
                </span>
              </button>

              {/* Word Count Indicator */}
              <div className="text-xs font-mono-code text-[#a09d96] bg-[#252320] px-2.5 py-1 rounded-lg border border-white/10">
                <span className="text-[#faf9f5] font-semibold">{wordCount}</span> words
              </div>

              {/* Autosave Status Indicator */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono-code text-[#5db8a6]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5db8a6] animate-pulse-subtle" />
                <span>Autosaved</span>
              </div>
            </div>
          </div>

          {/* Collapsible Diagram Drawer */}
          {showDiagram && (
            <div className="p-4 bg-[#252320] border-b border-white/10 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono-code font-semibold text-[#faf9f5]">
                  Draw a Diagram
                </span>
                <button
                  type="button"
                  onClick={() => setShowDiagram(false)}
                  className="text-[11px] font-mono-code text-[#a09d96] hover:text-[#faf9f5]"
                >
                  Close
                </button>
              </div>
              <InlineDiagramCanvas
                initialImage={submission.diagramImageBase64}
                onSave={handleDiagramSave}
              />
            </div>
          )}

          {/* Pure Unassisted Essay Response Textarea */}
          <div className="flex-1 p-4 bg-[#181715] flex flex-col">
            <textarea
              value={submission.textResponse || ''}
              onChange={handleTextChange}
              placeholder="Write your answer here..."
              className="w-full flex-1 bg-transparent text-[#faf9f5] placeholder:text-[#a09d96] font-mono-code text-sm leading-relaxed resize-none outline-none focus:ring-0 selection:bg-[#cc785c]/25"
              spellCheck="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
