import { NextRequest, NextResponse } from 'next/server';
import { evaluateSingleQuestion } from '@/lib/assessment/evaluator';
import { QuestionItem, QuestionSubmission, QuestionGrading } from '@/types/exam';

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
      previousEvaluations?: QuestionGrading[];
      thinkingBudget?: number;
    } = body;

    if (!question || !submission) {
      return NextResponse.json(
        { error: 'Missing question or submission payload.' },
        { status: 400 }
      );
    }

    const clientKey = req.headers.get('x-gemini-key') || undefined;
    const clientZaiKey = req.headers.get('x-zai-key') || undefined;

    const { evaluation, isSimulated } = await evaluateSingleQuestion(
      question,
      submission,
      previousEvaluations,
      clientKey,
      thinkingBudget,
      clientZaiKey
    );

    return NextResponse.json({
      evaluation,
      isSimulated,
      ...(isSimulated
        ? { notice: 'Evaluated via local examiner engine fallback.' }
        : {}),
    });
  } catch (error: unknown) {
    console.error('Grading API Error:', error);
    const message = error instanceof Error ? error.message : 'Error evaluating submission.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
