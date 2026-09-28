import type { QuestionEvaluation, QuestionItem, QuestionSubmission } from '@/types/exam';

// Client-safe: the results page marks a script here, one question per request.

export interface MarkScriptInput {
  questions: QuestionItem[];
  submissions: Record<string, QuestionSubmission>;
  /** Question Evaluations already saved for this script; those questions are not marked again. */
  evaluations: QuestionEvaluation[];
  /** Marks one question, given the evaluations of the questions before it (for ECF). Throws if it can't. */
  gradeQuestion: (
    question: QuestionItem,
    submission: QuestionSubmission,
    previousEvaluations: QuestionEvaluation[]
  ) => Promise<QuestionEvaluation>;
  /** Called with every evaluation so far, in paper order, as each new one arrives. */
  onEvaluated: (evaluations: QuestionEvaluation[]) => Promise<void>;
}

export interface MarkScriptResult {
  evaluations: QuestionEvaluation[];
  /** The question marking stopped at. Questions after it stay unmarked, so ECF always sees the ones before. */
  failure?: { question: QuestionItem; error: unknown };
}

/**
 * Marks a script in paper order, skipping questions that already have an evaluation.
 * Stops at the first question that can't be marked: no marks are ever invented for it.
 */
export async function markScript({
  questions,
  submissions,
  evaluations: saved,
  gradeQuestion,
  onEvaluated,
}: MarkScriptInput): Promise<MarkScriptResult> {
  const evaluations: QuestionEvaluation[] = [];

  for (const question of questions) {
    const existing = saved.find((e) => e.questionId === question.id);
    if (existing) {
      evaluations.push(existing);
      continue;
    }

    const submission = submissions[question.id] ?? {
      questionId: question.id,
      questionNumber: question.number,
      timeSpentSeconds: 0,
    };

    try {
      evaluations.push(await gradeQuestion(question, submission, [...evaluations]));
    } catch (error) {
      return { evaluations, failure: { question, error } };
    }
    await onEvaluated([...evaluations]);
  }

  return { evaluations };
}
