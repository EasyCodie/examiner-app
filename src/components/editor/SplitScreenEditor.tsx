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
    <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-140px)] gap-4 select-none">
      {/* LEFT PANE: Authentic Question Prompt & IB Examiner Context */}
      <div className="w-full lg:w-5/12 h-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Question Selector Tabs */}
        <div className="flex items-center gap-2 p-3 bg-slate-950/80 border-b border-slate-800 overflow-x-auto">
          {questions.map((q, idx) => {
            const isAnswered = Boolean(submissions[q.id]?.textResponse?.trim());
            const isActive = idx === activeQuestionIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelectQuestion(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{q.number}</span>
                {isAnswered && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                <span className="text-[10px] opacity-70">({q.totalMarks}m)</span>
              </button>
            );
          })}
        </div>

        {/* Prompt Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
                  {currentQuestion.commandTerm}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentQuestion.syllabusSubtopic}
                </span>
              </div>
              <h2 className="text-xl font-bold font-serif text-white mt-2">
                {currentQuestion.number}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg block">
                {currentQuestion.totalMarks} Marks
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                Target: {currentQuestion.totalMarks * 2} mins
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-slate-200 leading-relaxed text-sm">
            <MathRenderer content={currentQuestion.promptText} />
          </div>

          {/* Command Term Guidance Callout */}
          <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/40 text-xs text-blue-200">
            <div className="font-semibold flex items-center gap-1.5 text-blue-300 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              IB Command Term Requirement: {currentQuestion.commandTerm}
            </div>
            <p className="text-slate-300 leading-relaxed">
              {currentQuestion.commandTerm.toLowerCase().includes('evaluate')
                ? 'Requires balanced assessment with multiple perspectives, weighing up strengths and limitations before drawing a substantiated conclusion.'
                : currentQuestion.commandTerm.toLowerCase().includes('discuss')
                ? 'Requires offering a considered and balanced review with a variety of arguments, factors or hypotheses supported by appropriate evidence.'
                : 'Requires giving a detailed account including reasons, causes, and theoretical mechanisms.'}
            </p>
          </div>

          {/* Markscheme Criteria Peek (Collapsible) */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <button
              type="button"
              onClick={() => setShowCriteriaHint(!showCriteriaHint)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                Examiner Assessment Criteria & Mark Codes
              </span>
              {showCriteriaHint ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showCriteriaHint && (
              <div className="p-4 border-t border-slate-800 space-y-2 text-xs">
                {currentQuestion.markCodes.map((m) => (
                  <div key={m.code} className="flex items-start gap-2 text-slate-300">
                    <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">
                      {m.code}
                    </span>
                    <span className="flex-1 text-slate-400">{m.description}</span>
                    <span className="text-slate-500 font-mono">[{m.marks}m]</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Structured Essay Composer & Inline Diagram Sketchpad */}
      <div className="w-full lg:w-7/12 h-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Editor Toolbar Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => insertTemplate('**Definition & Theoretical Context:**\n')}
              className="text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition"
            >
              + Definition
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('**Diagram Analysis & Mechanism:**\nAs shown in the diagram, the initial equilibrium...')}
              className="text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition"
            >
              + Diagram Analysis
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('**Real-World Example / Application:**\nFor instance, in the case of...')}
              className="text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition"
            >
              + Example
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('**Evaluation & Conclusion (Stakeholder synthesis):**\nIn the short run vs long run, the most critical tradeoff is...')}
              className="text-[11px] font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-1 rounded transition"
            >
              + Evaluation
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Diagram Toggle */}
            <button
              type="button"
              onClick={() => setShowDiagram(!showDiagram)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                showDiagram
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Diagram {showDiagram ? 'Active' : 'Sketch'}</span>
            </button>

            {/* Word Count Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>{wordCount} words</span>
            </div>
          </div>
        </div>

        {/* Diagram Drawer if active */}
        {showDiagram && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 animate-in slide-in-from-top-2 duration-200">
            <InlineDiagramCanvas
              initialImage={submission.diagramImageBase64}
              onSave={handleDiagramSave}
            />
          </div>
        )}

        {/* Essay Text Area */}
        <div className="flex-1 p-4 bg-slate-950/40 relative">
          <textarea
            value={submission.textResponse || ''}
            onChange={handleTextChange}
            placeholder={`Compose your examiner-grade response for ${currentQuestion.number} here...\n\nUse clear paragraph structures:\n1. Define key economic terms\n2. Introduce and refer to your diagram (curves, equilibria, shifts)\n3. Explain the transmission mechanism step-by-step\n4. Synthesize stakeholder tradeoffs and evaluate short-run vs long-run effects`}
            className="w-full h-full bg-transparent text-slate-100 placeholder:text-slate-600 resize-none font-sans text-sm leading-relaxed outline-none focus:ring-0 select-text"
          />
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Autosaved locally to IndexedDB</span>
          <span>IB Examiner Marking Active</span>
        </div>
      </div>
    </div>
  );
};
