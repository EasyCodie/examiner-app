'use client';

import React, { useState, useMemo } from 'react';
import { QuestionItem, QuestionSubmission } from '@/types/exam';
import { MathRenderer } from '@/components/common/MathRenderer';
import { InlineDiagramCanvas } from './InlineDiagramCanvas';
import {
  FileText,
  Sparkles,
  PieChart,
  HelpCircle,
  ChevronDown,
  ChevronUp,
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
  const [showCriteriaHint, setShowCriteriaHint] = useState(false);

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

  // Structured IB essay scaffolding inserts
  const insertTemplate = (snippet: string) => {
    const existing = submission.textResponse || '';
    const newText = existing ? `${existing}\n\n${snippet}` : snippet;
    onUpdateSubmission(currentQuestion.id, newText, submission.diagramImageBase64);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-auto min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] gap-4 select-text">
      {/* LEFT PANE: Authentic Question Prompt & IB Examiner Context */}
      <div className="w-full lg:w-5/12 h-auto lg:h-full flex flex-col bg-[#141517] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl">
        {/* Question Selector Tabs */}
        <div className="flex items-center gap-2 p-3 bg-[#0c0d0e] border-b border-white/[0.08] overflow-x-auto">
          {questions.map((q, idx) => {
            const isAnswered = Boolean(submissions[q.id]?.textResponse?.trim());
            const isActive = idx === activeQuestionIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelectQuestion(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code whitespace-nowrap transition-all flex items-center gap-1.5 focus-ring ${
                  isActive
                    ? 'bg-[#f54e00] text-white shadow-sm font-medium'
                    : 'bg-[#1a1b1e] text-[#9b9a95] hover:text-[#f3f3f2] hover:bg-[#222428] border border-white/[0.08]'
                }`}
              >
                <span>{q.number}</span>
                {isAnswered && <CheckCircle2 className="w-3 h-3 text-[#1f8a65]" />}
                <span className="text-[10px] opacity-70">({q.totalMarks}m)</span>
              </button>
            );
          })}
        </div>

        {/* Prompt Content */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-code font-bold uppercase tracking-wider bg-[#f54e00]/10 text-[#f54e00] border border-[#f54e00]/20 px-2 py-0.5 rounded">
                  {currentQuestion.commandTerm}
                </span>
                <span className="text-xs text-[#9b9a95] font-mono-code">
                  {currentQuestion.syllabusSubtopic}
                </span>
              </div>
              <h2 className="text-lg font-medium text-[#f3f3f2] mt-2 tracking-tight">
                {currentQuestion.number}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold font-mono-code text-[#dfa88f] bg-[#1a1b1e] border border-white/[0.08] px-3 py-1 rounded-lg block">
                {currentQuestion.totalMarks} Marks
              </span>
              <span className="text-[10px] text-[#686763] font-mono-code mt-1 block">
                Target: {currentQuestion.totalMarks * 2} mins
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="bg-[#0c0d0e] p-4 rounded-xl border border-white/[0.08] text-[#f3f3f2] leading-relaxed text-sm">
            <MathRenderer content={currentQuestion.promptText} />
          </div>

          {/* Command Term Guidance Callout */}
          <div className="p-3.5 rounded-xl bg-[#1a1b1e] border border-white/[0.08] text-xs text-[#9b9a95]">
            <div className="font-semibold flex items-center gap-1.5 text-[#f54e00] mb-1 font-mono-code">
              <Sparkles className="w-3.5 h-3.5" />
              IB Command Term Requirement: {currentQuestion.commandTerm}
            </div>
            <p className="text-[#9b9a95] leading-relaxed">
              {currentQuestion.commandTerm.toLowerCase().includes('evaluate')
                ? 'Requires balanced assessment with multiple perspectives, weighing up strengths and limitations before drawing a substantiated conclusion.'
                : currentQuestion.commandTerm.toLowerCase().includes('discuss')
                ? 'Requires offering a considered and balanced review with a variety of arguments, factors or hypotheses supported by appropriate evidence.'
                : 'Requires giving a detailed account including reasons, causes, and theoretical mechanisms.'}
            </p>
          </div>

          {/* Markscheme Criteria Peek (Collapsible) */}
          <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0c0d0e]">
            <button
              type="button"
              onClick={() => setShowCriteriaHint(!showCriteriaHint)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-[#9b9a95] hover:text-[#f3f3f2] transition focus-ring"
            >
              <span className="flex items-center gap-1.5 font-mono-code">
                <HelpCircle className="w-3.5 h-3.5 text-[#dfa88f]" />
                Examiner Assessment Criteria &amp; Mark Codes
              </span>
              {showCriteriaHint ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showCriteriaHint && (
              <div className="p-4 border-t border-white/[0.08] space-y-2 text-xs font-mono-code">
                {currentQuestion.markCodes.map((m) => (
                  <div key={m.code} className="flex items-start gap-2 text-[#f3f3f2]">
                    <span className="text-[#dfa88f] font-semibold bg-[#1a1b1e] border border-white/[0.08] px-1.5 py-0.5 rounded text-[10px]">
                      {m.code}
                    </span>
                    <span className="flex-1 text-[#9b9a95]">{m.description}</span>
                    <span className="text-[#686763]">[{m.marks}m]</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Structured Essay Composer & Inline Diagram Sketchpad */}
      <div className="w-full lg:w-7/12 h-auto lg:h-full flex flex-col bg-[#141517] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl">
        {/* Editor Toolbar Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#0c0d0e] border-b border-white/[0.08]">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => insertTemplate('**Definition & Theoretical Context:**\n')}
              className="text-[11px] font-mono-code font-medium text-[#9b9a95] hover:text-[#f3f3f2] bg-[#1a1b1e] hover:bg-[#222428] border border-white/[0.08] px-2 py-1 rounded transition focus-ring"
            >
              + Definition
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('**Diagram Analysis & Mechanism:**\nAs shown in the diagram, the initial equilibrium...')}
              className="text-[11px] font-mono-code font-medium text-[#9b9a95] hover:text-[#f3f3f2] bg-[#1a1b1e] hover:bg-[#222428] border border-white/[0.08] px-2 py-1 rounded transition focus-ring"
            >
              + Diagram Analysis
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('**Real-World Example / Application:**\nFor instance, in the case of...')}
              className="text-[11px] font-mono-code font-medium text-[#9b9a95] hover:text-[#f3f3f2] bg-[#1a1b1e] hover:bg-[#222428] border border-white/[0.08] px-2 py-1 rounded transition focus-ring"
            >
              + Example
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('**Evaluation & Conclusion (Stakeholder synthesis):**\nIn the short run vs long run, the most critical tradeoff is...')}
              className="text-[11px] font-mono-code font-medium text-[#dfa88f] bg-[#dfa88f]/10 hover:bg-[#dfa88f]/20 border border-[#dfa88f]/30 px-2 py-1 rounded transition focus-ring"
            >
              + Evaluation
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Diagram Toggle */}
            <button
              type="button"
              onClick={() => setShowDiagram(!showDiagram)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono-code transition focus-ring ${
                showDiagram
                  ? 'bg-[#f54e00] text-white font-medium shadow-sm'
                  : 'bg-[#1a1b1e] text-[#9b9a95] hover:text-[#f3f3f2] border border-white/[0.08]'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Diagram {showDiagram ? 'Active' : 'Sketch'}</span>
            </button>

            {/* Word Count Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-mono-code text-[#9b9a95] bg-[#0c0d0e] px-2.5 py-1 rounded-lg border border-white/[0.08]">
              <FileText className="w-3.5 h-3.5 text-[#f54e00]" />
              <span>{wordCount} words</span>
            </div>
          </div>
        </div>

        {/* Diagram Drawer if active */}
        {showDiagram && (
          <div className="p-4 bg-[#0c0d0e] border-b border-white/[0.08] animate-in slide-in-from-top-2 duration-200">
            <InlineDiagramCanvas
              initialImage={submission.diagramImageBase64}
              onSave={handleDiagramSave}
            />
          </div>
        )}

        {/* Essay Text Area */}
        <div className="flex-1 p-4 bg-[#0c0d0e]/40 relative min-h-[360px]">
          <textarea
            value={submission.textResponse || ''}
            onChange={handleTextChange}
            aria-label="Student essay response"
            placeholder={`Compose your examiner-grade response for ${currentQuestion.number} here...\n\nUse clear paragraph structures:\n1. Define key economic terms\n2. Introduce and refer to your diagram (curves, equilibria, shifts)\n3. Explain the transmission mechanism step-by-step\n4. Synthesize stakeholder tradeoffs and evaluate short-run vs long-run effects`}
            className="w-full h-full min-h-[340px] bg-transparent text-[#f3f3f2] placeholder:text-[#686763] resize-none font-sans text-sm leading-relaxed outline-none focus:ring-0 select-text"
          />
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[#0c0d0e] border-t border-white/[0.08] flex items-center justify-between text-[11px] text-[#686763] font-mono-code">
          <span>Autosaved locally to IndexedDB</span>
          <span>IB Examiner Marking Active</span>
        </div>
      </div>
    </div>
  );
};
