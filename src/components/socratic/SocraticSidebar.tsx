'use client';

import React, { useState, useRef, useEffect } from 'react';
import { QuestionItem, PedagogicalTier, SocraticMessage } from '@/types/exam';
import { MathRenderer } from '@/components/common/MathRenderer';
import { BookOpen } from 'lucide-react';
import { useAppShell } from '@/components/common/AppShell';
import { ScaffoldLadder } from './ScaffoldLadder';

export interface TutorFailure {
  message: string;
  needsKey: boolean;
}

interface SocraticSidebarProps {
  question: QuestionItem;
  currentTier: PedagogicalTier;
  highestTierReached: PedagogicalTier | 0;
  isMarkschemeUnlocked: boolean;
  onAskTier: (tier: 1 | 2 | 3) => void;
  onRequestReveal: () => void;
  messages: SocraticMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  failure: TutorFailure | null;
  onRetry: () => void;
  /** True when the student's current working is sent along with each message. */
  workingShared: boolean;
}

/** The Socratic tutor, writing in examiner ink beside the student's script. */
export const SocraticSidebar: React.FC<SocraticSidebarProps> = ({
  question,
  currentTier,
  highestTierReached,
  isMarkschemeUnlocked,
  onAskTier,
  onRequestReveal,
  messages,
  onSendMessage,
  isLoading,
  failure,
  onRetry,
  workingShared,
}) => {
  const { hasFormulaBooklet, openFormulaBooklet, openAiStudio } = useAppShell();
  const [inputText, setInputText] = useState('');
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading, failure]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const msg = inputText.trim();
    setInputText('');
    await onSendMessage(msg);
  };

  return (
    <section aria-label="Tutor" className="script-sheet paper-surface flex flex-col h-full min-h-0">
      <div className="px-5 pt-5 pb-4 space-y-4 shrink-0">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-[22px] font-semibold text-ink">Tutor</h2>
          <p className="text-[14px] text-ink-muted">
            Command term: <span className="font-semibold text-ink">{question.commandTerm}</span>
          </p>
        </div>
        <ScaffoldLadder
          currentTier={currentTier}
          highestTierReached={highestTierReached}
          isMarkschemeUnlocked={isMarkschemeUnlocked}
          disabled={isLoading}
          onAskTier={onAskTier}
          onRequestReveal={onRequestReveal}
        />
      </div>

      <div ref={feedRef} className="flex-1 min-h-[240px] overflow-y-auto px-5 py-4 space-y-5 select-text" aria-live="polite">
        {messages.map((m) => {
          const isTutor = m.sender === 'tutor';
          return (
            <div key={m.id} className={isTutor ? 'pr-6' : 'pl-10'}>
              <p className={`text-[12px] font-semibold mb-1 ${isTutor ? 'text-ink-muted' : 'text-ink-muted text-right'}`}>
                {isTutor ? `Tutor${m.tierActive ? ` · step ${m.tierActive}` : ''}` : 'You'}
                {m.unlockedMarkscheme && ' · markscheme'}
              </p>
              <div
                className={`text-[15px] leading-relaxed ${
                  isTutor ? 'text-examiner' : 'text-student bg-paper-tint px-3 py-2'
                }`}
              >
                <MathRenderer content={m.text} lightMode={true} />
              </div>

              {m.formulaQuote && (
                <div className="mt-3 border border-paper-rule-strong px-3 py-2.5 space-y-1">
                  <p className="text-[13px] font-semibold text-ink">Formula clue</p>
                  <div className="text-[14px] text-examiner">
                    <MathRenderer content={m.formulaQuote} lightMode={true} />
                  </div>
                </div>
              )}

              {hasFormulaBooklet && isTutor && (m.formulaQuote || (m.tierActive === 2 && question.formulaBookletRef)) && (
                <button
                  type="button"
                  onClick={() => openFormulaBooklet(m.formulaQuote || question.formulaBookletRef)}
                  className="mt-2 btn btn-sm btn-quiet-paper"
                >
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  Open in the formula booklet
                  {question.formulaBookletRef ? ` (${question.formulaBookletRef.split(':')[0]})` : ''}
                </button>
              )}

              {m.diagnosticHighlight && (
                <div className="mt-3 border border-paper-rule-strong px-3 py-2.5 space-y-1">
                  <p className="text-[13px] font-semibold text-ink">On your working</p>
                  <div className="text-[14px] text-examiner">
                    <MathRenderer content={m.diagnosticHighlight} lightMode={true} />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {isLoading && <p className="text-[14px] text-ink-muted">The tutor is thinking…</p>}

        {failure && !isLoading && (
          <div role="alert" className="border border-lost px-4 py-3 space-y-3">
            <p className="text-[15px] leading-relaxed text-ink">
              {failure.needsKey
                ? 'The tutor needs a Gemini API key to reply.'
                : `The tutor couldn't reply (${failure.message}).`}
            </p>
            <div className="flex flex-wrap gap-2">
              {failure.needsKey && (
                <button type="button" onClick={openAiStudio} className="btn btn-sm btn-ink">
                  Add an API key
                </button>
              )}
              <button type="button" onClick={onRetry} className={`btn btn-sm ${failure.needsKey ? 'btn-quiet-paper' : 'btn-ink'}`}>
                Try again
              </button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="px-5 pt-3 pb-5 border-t border-paper-rule space-y-2 shrink-0">
        <label htmlFor="tutor-input" className="sr-only">
          Message the tutor
        </label>
        <div className="flex gap-2">
          <input
            id="tutor-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Explain your step or ask a question"
            disabled={isLoading}
            className="flex-1 min-w-0 min-h-11 border border-paper-rule-strong bg-paper px-3 text-[15px] text-student placeholder:text-ink-muted"
          />
          <button type="submit" disabled={!inputText.trim() || isLoading} className="btn btn-ink">
            Send
          </button>
        </div>
        {workingShared && <p className="text-[13px] text-ink-muted">Your current working is sent with each message.</p>}
      </form>
    </section>
  );
};
