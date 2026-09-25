import { NextRequest, NextResponse } from 'next/server';
import { evaluateSingleQuestion } from '@/lib/assessment/evaluator';
import { QuestionItem, QuestionSubmission, QuestionEvaluation } from '@/types/exam';
import { missingKeyBody, readClientKeys } from '@/lib/aiKey';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question,
      submission,
      previousEvaluations = [],
      thinkingBudget = 8192,
    }: {
      question: QuestionItem;
      submission: QuestionSubmission;
      previousEvaluations?: QuestionEvaluation[];
      thinkingBudget?: number;
    } = body;

    if (!question || !submission) {
      return NextResponse.json(
        { error: 'Missing question or submission payload.' },
        { status: 400 }
      );
    }

    const { geminiKey: clientKey, zaiKey: clientZaiKey } = readClientKeys(req.headers);
    if (!clientKey) {
      return NextResponse.json(missingKeyBody, { status: 401 });
    }

    try {
      const evaluation = await evaluateSingleQuestion(
        question,
        submission,
        previousEvaluations,
        clientKey,
        thinkingBudget,
        clientZaiKey
      );
      return NextResponse.json({ evaluation });
    } catch (error: unknown) {
      // No marks are invented: the student sees this question as not marked and can retry it
      console.error(`Grading failed for Question ${question.number}:`, error);
      return NextResponse.json(
        { error: 'The examiner could not mark this question. Try again in a moment.', code: 'MARKING_FAILED' },
        { status: 502 }
      );
    }
  } catch (error: unknown) {
    console.error('Grading API Error:', error);
    const message = error instanceof Error ? error.message : 'Error evaluating submission.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
