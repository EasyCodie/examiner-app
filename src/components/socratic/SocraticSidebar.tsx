'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  QuestionItem,
  PedagogicalTier,
  SocraticMessage,
} from '@/types/exam';
import { MathRenderer } from '@/components/common/MathRenderer';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Target,
  BookOpen,
  Lightbulb,
  Lock,
} from 'lucide-react';

interface SocraticSidebarProps {
  question: QuestionItem;
  currentTier: PedagogicalTier;
  onSelectTier: (tier: PedagogicalTier) => void;
  isMarkschemeUnlocked: boolean;
  onUnlockMarkscheme: () => void;
  messages: SocraticMessage[];
  onSendMessage: (text: string, requestedTier: PedagogicalTier) => Promise<void>;
  isLoading: boolean;
}

export const SocraticSidebar: React.FC<SocraticSidebarProps> = ({
  question,
  currentTier,
  onSelectTier,
  isMarkschemeUnlocked,
  onUnlockMarkscheme,
  messages,
  onSendMessage,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const msg = inputText.trim();
    setInputText('');
    await onSendMessage(msg, currentTier);
  };

  const handleQuickAction = async (prompt: string, tier: PedagogicalTier) => {
    onSelectTier(tier);
    await onSendMessage(prompt, tier);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--cursor-canvas-soft)] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-2.5 px-3 bg-[var(--cursor-canvas)] border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[var(--diplomatic-azure)]/10 flex items-center justify-center text-[var(--diplomatic-azure)]">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium text-[var(--cursor-text-strong)]">
            Socratic Tutor
          </span>
        </div>

        <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-[var(--cursor-surface-card)] text-[var(--cursor-primary)] border border-white/[0.08]">
          Tier {currentTier}
        </span>
      </div>

      {/* Quick Action Scaffolding Chips */}
      <div className="p-2 bg-[var(--cursor-canvas)]/60 border-b border-white/[0.08] flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono-code">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleQuickAction(`What does the command term "${question.commandTerm}" demand in this question?`, 1)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--cursor-surface-card)] hover:bg-[var(--cursor-surface-strong)] text-[var(--cursor-text-body)] hover:text-[var(--cursor-text-strong)] border border-white/[0.08] whitespace-nowrap transition disabled:opacity-40"
        >
          <Target className="w-3 h-3 text-[#93c5fd]" />
          <span>Command Term</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleQuickAction(`Which formula booklet section or model applies to this step?`, 2)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--cursor-surface-card)] hover:bg-[var(--cursor-surface-strong)] text-[var(--cursor-text-body)] hover:text-[var(--cursor-text-strong)] border border-white/[0.08] whitespace-nowrap transition disabled:opacity-40"
        >
          <BookOpen className="w-3 h-3 text-[#fcd34d]" />
          <span>Formula Booklet</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleQuickAction(`Can you check my current reasoning step without giving away the final mark?`, 3)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--cursor-surface-card)] hover:bg-[var(--cursor-surface-strong)] text-[var(--cursor-text-body)] hover:text-[var(--cursor-text-strong)] border border-white/[0.08] whitespace-nowrap transition disabled:opacity-40"
        >
          <Lightbulb className="w-3 h-3 text-[#86efac]" />
          <span>Check Working</span>
        </button>

        {currentTier >= 4 && !isMarkschemeUnlocked && (
          <button
            type="button"
            onClick={onUnlockMarkscheme}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--cursor-primary)]/15 text-[var(--cursor-primary)] border border-[var(--cursor-primary)]/30 whitespace-nowrap transition"
          >
            <Lock className="w-3 h-3" />
            <span>Unlock Rubric</span>
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 select-text">
        {messages.map((m) => {
          const isTutor = m.sender === 'tutor';
          return (
            <div
              key={m.id}
              className={`flex gap-2.5 ${isTutor ? 'items-start' : 'items-start flex-row-reverse'}`}
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono-code ${
                  isTutor
                    ? 'bg-[var(--cursor-surface-card)] text-[var(--diplomatic-azure)] border border-white/[0.08]'
                    : 'bg-[var(--cursor-primary)] text-white'
                }`}
              >
                {isTutor ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                  isTutor
                    ? 'bg-[var(--cursor-surface-card)] border border-white/[0.08] text-[var(--cursor-text-strong)] socratic-math'
                    : 'bg-[var(--cursor-surface-strong)] border border-white/[0.12] text-white'
                }`}
              >
                {/* Tier Badge if present */}
                {isTutor && m.tierActive && (
                  <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-white/[0.06] text-[10px] font-mono-code text-[var(--diplomatic-azure)] font-semibold uppercase tracking-wider">
                    <span>Tier {m.tierActive} Guidance</span>
                    {m.unlockedMarkscheme && (
                      <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1 py-0.5 rounded">
                        Markscheme Unlocked
                      </span>
                    )}
                  </div>
                )}

                {/* Content with LaTeX Math */}
                <MathRenderer content={m.text} />

                {/* Formula Highlight Callout with LaTeX Math Rendering */}
                {m.formulaQuote && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-[var(--cursor-canvas)] border border-[#93c5fd]/20 text-[11px] text-[#93c5fd]">
                    <span className="font-semibold font-mono-code block text-[#93c5fd] mb-1">Formula Clue:</span>
                    <MathRenderer content={m.formulaQuote} className="text-[#93c5fd] text-xs leading-relaxed" />
                  </div>
                )}

                {/* Diagnostic Step Highlight with LaTeX Math Rendering */}
                {m.diagnosticHighlight && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-[var(--cursor-canvas)] border border-[#86efac]/20 text-[11px] text-[#86efac]">
                    <span className="font-semibold font-mono-code block text-[#86efac] mb-1">Diagnostic Finding:</span>
                    <MathRenderer content={m.diagnosticHighlight} className="text-[#86efac] text-xs leading-relaxed" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[var(--cursor-surface-card)] border border-white/[0.08] flex items-center justify-center text-[var(--diplomatic-azure)] shrink-0">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-[var(--cursor-surface-card)] border border-white/[0.08] rounded-xl p-2 text-xs text-[var(--cursor-text-body)] flex items-center gap-2 font-mono-code">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--diplomatic-azure)] animate-ping" />
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-2.5 bg-[var(--cursor-canvas)] border-t border-white/[0.08] flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask about ${question.number} or explain your working...`}
          disabled={isLoading}
          className="flex-1 bg-[var(--cursor-canvas-soft)] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[var(--cursor-text-strong)] placeholder:text-[var(--cursor-text-muted)] outline-none focus:border-[var(--cursor-primary)] transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2 rounded-lg cursor-btn-primary disabled:opacity-30 transition"
          title="Send to Tutor"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
