import { NextRequest, NextResponse } from 'next/server';
import { consultSocraticTutor, TutorUnavailableError } from '@/lib/socratic/tutor';
import { QuestionItem, SocraticMessage, PedagogicalTier } from '@/types/exam';
import { missingKeyBody, readClientKeys } from '@/lib/aiKey';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question,
      messages = [],
      requestedTier = 1,
      studentSnapshotText,
      studentSnapshotImageBase64,
      userMessage,
      thinkingBudget = 2048,
    }: {
      question: QuestionItem;
      messages: SocraticMessage[];
      requestedTier: PedagogicalTier;
      studentSnapshotText?: string;
      studentSnapshotImageBase64?: string;
      userMessage?: string;
      thinkingBudget?: number;
    } = body;

    if (!question) {
      return NextResponse.json({ error: 'Missing question context.' }, { status: 400 });
    }

    const { geminiKey: clientKey } = readClientKeys(req.headers);
    if (!clientKey) {
      return NextResponse.json(missingKeyBody, { status: 401 });
    }

    const result = await consultSocraticTutor({
      question,
      messages,
      requestedTier,
      studentSnapshotText,
      studentSnapshotImageBase64,
      userMessage,
      thinkingBudget,
      apiKey: clientKey,
    });

    return NextResponse.json({ response: result.message });
  } catch (error: unknown) {
    console.error('Socratic API Error:', error);
    if (error instanceof TutorUnavailableError) {
      return NextResponse.json(
        { error: 'The tutor is unavailable right now. Try again in a moment.', code: 'TUTOR_UNAVAILABLE' },
        { status: 502 }
      );
    }
    const message = error instanceof Error ? error.message : 'Socratic tutor service error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
