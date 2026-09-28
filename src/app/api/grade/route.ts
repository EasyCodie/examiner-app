import { NextRequest, NextResponse } from 'next/server';
import { evaluateSingleQuestion } from '@/lib/assessment/evaluator';
import { QuestionItem, QuestionSubmission, QuestionEvaluation } from '@/types/exam';
import { INVALID_KEY, missingKeyBody, readClientKeys } from '@/lib/aiKey';
import { isInvalidKeyError } from '@/lib/gemini';
import { checkGradeRequest, clampThinkingBudget } from '@/lib/requestLimits';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Vercel Hobby's ceiling; marking stops itself at 270 s

export async function POST(req: NextRequest) {
  const { geminiKey: clientKey, zaiKey: clientZaiKey } = readClientKeys(req.headers);
  if (!clientKey) {
    return NextResponse.json(missingKeyBody, { status: 401 });
  }

  let body: {
    question: QuestionItem;
    submission: QuestionSubmission;
    previousEvaluations?: QuestionEvaluation[];
    thinkingBudget?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'The marking request could not be read.', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const problem = checkGradeRequest(body ?? {});
  if (problem) {
    return NextResponse.json({ error: problem, code: 'BAD_REQUEST' }, { status: 400 });
  }
  const { question, submission, previousEvaluations = [] } = body;

  try {
    const evaluation = await evaluateSingleQuestion(
      question,
      submission,
      previousEvaluations,
      clientKey,
      clampThinkingBudget(body.thinkingBudget, 8192),
      clientZaiKey
    );
    return NextResponse.json({ evaluation });
  } catch (error: unknown) {
    // No marks are invented: the student sees this question as not marked and can retry it
    console.error(`Grading failed for Question ${question.number}:`, error);
    if (isInvalidKeyError(error)) {
      return NextResponse.json(
        { error: 'Gemini rejected your API key. Check it in Settings, then try again.', code: INVALID_KEY },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'The examiner could not mark this question. Try again in a moment.', code: 'MARKING_FAILED' },
      { status: 502 }
    );
  }
}
