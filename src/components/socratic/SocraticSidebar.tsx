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
  Stethoscope,
  Unlock,
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
    <div className="flex flex-col h-full bg-[#181715] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-3 px-4 bg-[#252320] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#cc785c]/15 flex items-center justify-center text-[#cc785c]">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium text-[#faf9f5]">
            Socratic Tutor
          </span>
        </div>

        <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-[#181715] text-[#cc785c] border border-white/10">
          Step {currentTier} Active
        </span>
      </div>

      {/* Quick Action Scaffolding Chips */}
      <div className="p-2.5 bg-[#252320]/70 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono-code">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleQuickAction(`What does the command term "${question.commandTerm}" mean for this question?`, 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181715] hover:bg-[#34322d] text-[#a09d96] hover:text-[#faf9f5] border border-white/10 whitespace-nowrap transition disabled:opacity-40"
        >
          <Target className="w-3 h-3 text-[#5db8a6]" />
          <span>Command Term Help</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleQuickAction(`Which formula or concept applies to this step?`, 2)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181715] hover:bg-[#34322d] text-[#a09d96] hover:text-[#faf9f5] border border-white/10 whitespace-nowrap transition disabled:opacity-40"
        >
          <BookOpen className="w-3 h-3 text-[#e8a55a]" />
          <span>Formula Clue</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleQuickAction(`Can you check my current step and see if my working is on the right track?`, 3)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181715] hover:bg-[#34322d] text-[#a09d96] hover:text-[#faf9f5] border border-white/10 whitespace-nowrap transition disabled:opacity-40"
        >
          <Stethoscope className="w-3 h-3 text-[#5db8a6]" />
          <span>Check My Working</span>
        </button>

        {!isMarkschemeUnlocked && (
          <button
            type="button"
            disabled={isLoading}
            onClick={onUnlockMarkscheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#cc785c]/15 hover:bg-[#cc785c]/25 text-[#cc785c] border border-[#cc785c]/30 whitespace-nowrap transition"
          >
            <Unlock className="w-3 h-3 text-[#cc785c]" />
            <span>Reveal Markscheme</span>
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 select-text bg-[#181715]">
        {messages.map((m) => {
          const isTutor = m.sender === 'tutor';
          return (
            <div
              key={m.id}
              className={`flex gap-2.5 ${isTutor ? 'items-start' : 'items-start flex-row-reverse'}`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono-code ${isTutor
                    ? 'bg-[#252320] text-[#cc785c] border border-white/10'
                    : 'bg-[#a9583e] text-white'
                  }`}
              >
                {isTutor ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${isTutor
                    ? 'bg-[#252320] border border-white/10 text-[#faf9f5] socratic-math'
                    : 'bg-[#cc785c] text-white shadow-xs'
                  }`}
              >
                {/* Tier Badge if present */}
                {isTutor && m.tierActive && (
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/10 text-[10px] font-mono-code text-[#cc785c] font-semibold uppercase tracking-wider">
                    <span>Step {m.tierActive} Hint</span>
                    {m.unlockedMarkscheme && (
                      <span className="bg-[#e8a55a]/20 text-[#e8a55a] border border-[#e8a55a]/30 px-1.5 py-0.5 rounded">
                        Markscheme Unlocked
                      </span>
                    )}
                  </div>
                )}

                {/* Content with LaTeX Math */}
                <MathRenderer content={m.text} />

                {/* Formula Highlight Callout with LaTeX Math Rendering */}
                {m.formulaQuote && (
                  <div className="mt-3 p-3 rounded-xl bg-[#181715] border border-[#5db8a6]/30 text-[11px] text-[#5db8a6]">
                    <span className="font-semibold font-mono-code block text-[#5db8a6] mb-1">Formula Clue:</span>
                    <MathRenderer content={m.formulaQuote} className="text-[#5db8a6] text-xs leading-relaxed" />
                  </div>
                )}

                {/* Diagnostic Step Highlight with LaTeX Math Rendering */}
                {m.diagnosticHighlight && (
                  <div className="mt-3 p-3 rounded-xl bg-[#181715] border border-[#e8a55a]/30 text-[11px] text-[#e8a55a]">
                    <span className="font-semibold font-mono-code block text-[#e8a55a] mb-1">Working Feedback:</span>
                    <MathRenderer content={m.diagnosticHighlight} className="text-[#e8a55a] text-xs leading-relaxed" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#252320] border border-white/10 flex items-center justify-center text-[#cc785c] shrink-0">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-[#252320] border border-white/10 rounded-xl p-2.5 text-xs text-[#a09d96] flex items-center gap-2 font-mono-code">
              <span className="w-1.5 h-1.5 rounded-full bg-[#cc785c] animate-ping" />
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-[#252320] border-t border-white/10 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask about ${question.number} or explain your working...`}
          disabled={isLoading}
          className="flex-1 bg-[#181715] border border-white/10 rounded-lg px-3.5 py-2 text-xs text-[#faf9f5] placeholder:text-[#a09d96] outline-none focus:border-[#cc785c] transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2 rounded-lg claude-btn-primary disabled:opacity-30 transition"
          title="Send to Tutor"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
