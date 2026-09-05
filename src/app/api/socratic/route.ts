import { NextRequest, NextResponse } from 'next/server';
import { consultSocraticTutor, generateSimulatedSocraticResponse } from '@/lib/socratic/tutor';
import { QuestionItem, SocraticMessage, PedagogicalTier } from '@/types/exam';

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

    const clientKey = req.headers.get('x-gemini-key') || undefined;

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

    return NextResponse.json({
      response: result.message,
      isSimulated: result.isSimulated,
      ...(result.notice ? { notice: result.notice } : {}),
    });
  } catch (error: unknown) {
    console.error('Socratic API Error:', error);
    const message = error instanceof Error ? error.message : 'Socratic tutor service error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Re-export for backward-compatible test imports
export { generateSimulatedSocraticResponse };
