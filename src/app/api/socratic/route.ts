import { NextRequest, NextResponse } from 'next/server';
import { consultSocraticTutor, TutorUnavailableError } from '@/lib/socratic/tutor';
import { QuestionItem, SocraticMessage, PedagogicalTier } from '@/types/exam';
import { INVALID_KEY, missingKeyBody, readClientKeys } from '@/lib/aiKey';
import { isInvalidKeyError } from '@/lib/gemini';
import { checkTutorRequest, clampThinkingBudget } from '@/lib/requestLimits';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // the tutor stops itself at 110 s

export async function POST(req: NextRequest) {
  const { geminiKey: clientKey } = readClientKeys(req.headers);
  if (!clientKey) {
    return NextResponse.json(missingKeyBody, { status: 401 });
  }

  let body: {
    question: QuestionItem;
    messages?: SocraticMessage[];
    requestedTier?: PedagogicalTier;
    studentSnapshotText?: string;
    studentSnapshotImageBase64?: string;
    userMessage?: string;
    thinkingBudget?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'The tutor request could not be read.', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const problem = checkTutorRequest(body ?? {});
  if (problem) {
    return NextResponse.json({ error: problem, code: 'BAD_REQUEST' }, { status: 400 });
  }

  try {
    const result = await consultSocraticTutor({
      question: body.question,
      messages: body.messages ?? [],
      requestedTier: body.requestedTier ?? 1,
      studentSnapshotText: body.studentSnapshotText,
      studentSnapshotImageBase64: body.studentSnapshotImageBase64,
      userMessage: body.userMessage,
      thinkingBudget: clampThinkingBudget(body.thinkingBudget, 2048),
      apiKey: clientKey,
    });

    return NextResponse.json({ response: result.message });
  } catch (error: unknown) {
    console.error('Socratic API Error:', error);
    if (isInvalidKeyError(error)) {
      return NextResponse.json(
        { error: 'Gemini rejected your API key. Check it in Settings, then try again.', code: INVALID_KEY },
        { status: 401 }
      );
    }
    if (error instanceof TutorUnavailableError) {
      return NextResponse.json(
        { error: 'The tutor is unavailable right now. Try again in a moment.', code: 'TUTOR_UNAVAILABLE' },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: 'Something went wrong with the tutor. Try again.', code: 'TUTOR_FAILED' },
      { status: 500 }
    );
  }
}
