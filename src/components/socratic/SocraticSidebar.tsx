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
    <div className="flex flex-col h-full bg-[#141517] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-2.5 px-3 bg-[#0c0d0e] border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#f54e00]/10 flex items-center justify-center text-[#f54e00]">
            <Bot className="w-3 h-3" />
          </div>
          <span className="text-xs font-medium text-[#f3f3f2]">
            Socratic Tutor
          </span>
        </div>

        <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-[#1a1b1e] text-[#f54e00] border border-white/[0.08]">
          Tier {currentTier}
        </span>
      </div>

      {/* Quick Action Scaffolding Chips */}
      <div className="p-2 bg-[#0c0d0e]/60 border-b border-white/[0.08] flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono-code">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleQuickAction(`What does the command term "${question.commandTerm}" demand in this question?`, 1)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1a1b1e] hover:bg-[#222428] text-[#9b9a95] hover:text-[#f3f3f2] border border-white/[0.08] whitespace-nowrap transition disabled:opacity-40"
        >
          <Target className="w-3 h-3 text-[#9fbbe0]" />
          <span>Command Term</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleQuickAction(`Which formula booklet section or model applies to this step?`, 2)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1a1b1e] hover:bg-[#222428] text-[#9b9a95] hover:text-[#f3f3f2] border border-white/[0.08] whitespace-nowrap transition disabled:opacity-40"
        >
          <BookOpen className="w-3 h-3 text-[#c08532]" />
          <span>Formula Booklet</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleQuickAction(`Diagnose my current step: is my algebraic working and sign logic on the right track?`, 3)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1a1b1e] hover:bg-[#222428] text-[#9b9a95] hover:text-[#f3f3f2] border border-white/[0.08] whitespace-nowrap transition disabled:opacity-40"
        >
          <Stethoscope className="w-3 h-3 text-[#9fc9a2]" />
          <span>Diagnose Step</span>
        </button>

        {!isMarkschemeUnlocked && (
          <button
            type="button"
            disabled={isLoading}
            onClick={onUnlockMarkscheme}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#dfa88f]/15 hover:bg-[#dfa88f]/25 text-[#dfa88f] border border-[#dfa88f]/30 whitespace-nowrap transition"
          >
            <Unlock className="w-3 h-3 text-[#dfa88f]" />
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
                    ? 'bg-[#1a1b1e] text-[#f54e00] border border-white/[0.08]'
                    : 'bg-[#f54e00] text-white'
                }`}
              >
                {isTutor ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                  isTutor
                    ? 'bg-[#1a1b1e] border border-white/[0.08] text-[#f3f3f2] socratic-math'
                    : 'bg-[#222428] border border-white/[0.12] text-white'
                }`}
              >
                {/* Tier Badge if present */}
                {isTutor && m.tierActive && (
                  <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-white/[0.06] text-[10px] font-mono-code text-[#f54e00] font-semibold uppercase tracking-wider">
                    <span>Tier {m.tierActive} Guidance</span>
                    {m.unlockedMarkscheme && (
                      <span className="bg-[#c08532]/20 text-[#c08532] border border-[#c08532]/30 px-1 py-0.5 rounded">
                        Markscheme Unlocked
                      </span>
                    )}
                  </div>
                )}

                {/* Content with LaTeX Math */}
                <MathRenderer content={m.text} />

                {/* Formula Highlight Callout with LaTeX Math Rendering */}
                {m.formulaQuote && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-[#0c0d0e] border border-[#9fbbe0]/20 text-[11px] text-[#9fbbe0]">
                    <span className="font-semibold font-mono-code block text-[#9fbbe0] mb-1">Formula Clue:</span>
                    <MathRenderer content={m.formulaQuote} className="text-[#9fbbe0] text-xs leading-relaxed" />
                  </div>
                )}

                {/* Diagnostic Step Highlight with LaTeX Math Rendering */}
                {m.diagnosticHighlight && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-[#0c0d0e] border border-[#9fc9a2]/20 text-[11px] text-[#9fc9a2]">
                    <span className="font-semibold font-mono-code block text-[#9fc9a2] mb-1">Diagnostic Finding:</span>
                    <MathRenderer content={m.diagnosticHighlight} className="text-[#9fc9a2] text-xs leading-relaxed" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#1a1b1e] border border-white/[0.08] flex items-center justify-center text-[#f54e00] shrink-0">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-[#1a1b1e] border border-white/[0.08] rounded-xl p-2 text-xs text-[#9b9a95] flex items-center gap-2 font-mono-code">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f54e00] animate-ping" />
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-2.5 bg-[#0c0d0e] border-t border-white/[0.08] flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask about ${question.number} or explain your working...`}
          disabled={isLoading}
          className="flex-1 bg-[#141517] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#f3f3f2] placeholder:text-[#686763] outline-none focus:border-[#f54e00] transition"
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
