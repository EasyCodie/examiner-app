'use client';

import React, { useState, useMemo } from 'react';
import { QuestionItem, QuestionSubmission } from '@/types/exam';
import { MathRenderer } from '@/components/common/MathRenderer';
import { InlineDiagramCanvas } from './InlineDiagramCanvas';
import { PieChart } from 'lucide-react';

interface SplitScreenEditorProps {
  questions: QuestionItem[];
  activeQuestionIndex: number;
  submissions: Record<string, QuestionSubmission>;
  onUpdateSubmission: (questionId: string, text: string, diagramBase64?: string) => void;
  /** Reading time: the prompt can be read but the answer sheet is locked. */
  readOnly?: boolean;
}

/**
 * Humanities script: the question sheet on the left, the candidate's answer
 * sheet on the right. Authentic Exam Condition: no scaffolding, no templates.
 */
export const SplitScreenEditor: React.FC<SplitScreenEditorProps> = ({
  questions,
  activeQuestionIndex,
  submissions,
  onUpdateSubmission,
  readOnly = false,
}) => {
  const currentQuestion = questions[activeQuestionIndex] || questions[0];
  const submission = submissions[currentQuestion.id] || {
    questionId: currentQuestion.id,
    questionNumber: currentQuestion.number,
    textResponse: '',
    timeSpentSeconds: 0,
  };

  const [diagramOpenFor, setDiagramOpenFor] = useState<string | null>(null);
  const showDiagram = diagramOpenFor === currentQuestion.id;

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

  const answerId = `answer-${currentQuestion.id}`;

  return (
    <div className="grid gap-5 lg:grid-cols-[5fr_7fr] items-start select-text">
      {/* Question sheet */}
      <article className="script-sheet paper-surface px-6 sm:px-10 py-8 sm:py-10 lg:sticky lg:top-[120px]">
        <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 items-baseline border-b border-ink pb-3">
          <h2 className="font-serif text-[28px] font-semibold leading-none text-ink tabular">
            {currentQuestion.number}
          </h2>
          <span />
          <p className="font-serif text-[15px] font-semibold text-ink whitespace-nowrap tabular">
            [{currentQuestion.totalMarks}]
          </p>
        </div>
        <div className="mt-5 font-serif text-[17px] sm:text-[18px] leading-[1.65] text-ink max-w-[62ch]">
          <MathRenderer content={currentQuestion.promptText} lightMode={true} />
        </div>
      </article>

      {/* Answer sheet */}
      <section className="script-sheet paper-surface flex flex-col" aria-labelledby={`${answerId}-label`}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 sm:px-10 pt-6 pb-4 border-b border-paper-rule">
          <label id={`${answerId}-label`} htmlFor={answerId} className="text-[15px] font-semibold text-ink">
            Answer to question {currentQuestion.number}
          </label>
          <div className="flex items-center gap-4">
            <span className="tabular text-[14px] text-ink-muted" aria-live="off">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
            <button
              type="button"
              onClick={() => setDiagramOpenFor(showDiagram ? null : currentQuestion.id)}
              aria-expanded={showDiagram}
              disabled={readOnly}
              className="btn btn-sm btn-quiet-paper"
            >
              <PieChart className="w-4 h-4" aria-hidden="true" />
              {showDiagram ? 'Close diagram' : submission.diagramImageBase64 ? 'Edit diagram' : 'Add a diagram'}
            </button>
          </div>
        </div>

        {showDiagram && (
          <div className="px-6 sm:px-10 py-5 border-b border-paper-rule bg-paper-tint">
            <InlineDiagramCanvas initialImage={submission.diagramImageBase64} onSave={handleDiagramSave} />
          </div>
        )}

        <textarea
          id={answerId}
          value={submission.textResponse || ''}
          onChange={handleTextChange}
          readOnly={readOnly}
          placeholder={readOnly ? 'Reading time: you can start writing when it ends.' : 'Write your answer here.'}
          spellCheck
          className="ruled w-full min-h-[55vh] px-6 sm:px-10 pt-[18px] pb-10 bg-paper bg-[position:0_45px] font-serif text-[17px] leading-[28px] text-student caret-student placeholder:text-ink-muted resize-y outline-none focus-visible:outline-2 focus-visible:outline-ink focus-visible:-outline-offset-4 read-only:cursor-not-allowed"
        />
      </section>
    </div>
  );
};
