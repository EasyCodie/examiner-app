'use client';

import React, { useState, useRef, useEffect } from 'react';
import { QuestionItem, PedagogicalTier, SocraticMessage } from '@/types/exam';
import { MathRenderer } from '@/components/common/MathRenderer';
import { BookOpen } from 'lucide-react';
import { useAppShell } from '@/components/common/AppShell';
import { ScaffoldLadder } from './ScaffoldLadder';
import { MarkCodeKey } from '@/components/assessment/MarkCodeKey';

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
  /** Called when the unsent message goes from empty to written, or back. */
  onDraftChange: (hasDraft: boolean) => void;
}

/**
 * One entry in the tutor feed. A reply that has just arrived is written down the
 * page by the tutor's pen, at a pace set by its length; the student's own line
 * inks in. Entries already on the page when the feed opens are simply there.
 */
const FeedEntry: React.FC<{ message: SocraticMessage; className: string; children: React.ReactNode }> = ({
  message,
  className,
  children,
}) => {
  const [fresh] = useState(() => Date.now() - Date.parse(message.timestamp) < 4000);
  if (!fresh) return <div className={className}>{children}</div>;
  if (message.sender !== 'tutor') return <div className={`${className} animate-ink-in-fast`}>{children}</div>;
  const duration = Math.min(2200, 450 + message.text.length * 5);
  return (
    <div
      className={`${className} animate-write-down`}
      style={{ '--write-duration': `${duration}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

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
  onDraftChange,
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
    onDraftChange(false);
    await onSendMessage(msg);
  };

  return (
    <section aria-label="Tutor" className="script-sheet paper-surface flex flex-col h-full min-h-0">
      <div className="px-5 pt-5 pb-4 space-y-4 shrink-0">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-[22px] font-semibold text-examiner">Tutor</h2>
          <p className="text-[14px] text-ink-muted">
            Command term: <span className="font-semibold text-ink">{question.commandTerm}</span>
          </p>
        </div>
        <MarkCodeKey variant="compact" />
        <ScaffoldLadder
          currentTier={currentTier}
          highestTierReached={highestTierReached}
          isMarkschemeUnlocked={isMarkschemeUnlocked}
          hasFormulaBooklet={hasFormulaBooklet}
          disabled={isLoading}
          onAskTier={onAskTier}
          onRequestReveal={onRequestReveal}
        />
      </div>

      <div ref={feedRef} className="flex-1 min-h-[240px] overflow-y-auto px-5 py-4 space-y-5 select-text" aria-live="polite">
        {messages.map((m) => {
          const isTutor = m.sender === 'tutor';
          return (
            <FeedEntry key={m.id} message={m} className={isTutor ? 'pr-6' : 'pl-10'}>
              <p className={`text-[12px] font-semibold mb-1 ${isTutor ? 'text-examiner' : 'text-ink-muted text-right'}`}>
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
                  <p className="text-[13px] font-semibold text-ink">{hasFormulaBooklet ? 'Formula clue' : 'Concept clue'}</p>
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
            </FeedEntry>
          );
        })}

        {isLoading && (
          <div className="space-y-2">
            <p className="text-[14px] text-ink-muted">The tutor is thinking…</p>
            <div className="rule-working w-24 text-examiner" aria-hidden="true" />
          </div>
        )}

        {failure && !isLoading && (
          <div role="alert" className="border border-lost px-4 py-3 space-y-3">
            <p className="text-[15px] leading-relaxed text-ink">
              {failure.needsKey
                ? 'The tutor needs a valid Gemini API key to reply.'
                : failure.message}
            </p>
            <div className="flex flex-wrap gap-2">
              {failure.needsKey && (
                <button type="button" onClick={() => openAiStudio('apiKey')} className="btn btn-sm btn-ink">
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
            onChange={(e) => {
              setInputText(e.target.value);
              onDraftChange(e.target.value.trim().length > 0);
            }}
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
