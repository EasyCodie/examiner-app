import { NextRequest, NextResponse } from 'next/server';
import { streamExamAssessment } from '@/lib/assessment/evaluator';
import { ExamManifest, QuestionSubmission } from '@/types/exam';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      manifest,
      submissions = {},
      sessionId,
      timeRemainingSeconds = 0,
      thinkingBudget = 8192,
    }: {
      manifest: ExamManifest;
      submissions: Record<string, QuestionSubmission>;
      sessionId?: string;
      timeRemainingSeconds?: number;
      thinkingBudget?: number;
    } = body;

    if (!manifest || !Array.isArray(manifest.questions)) {
      return NextResponse.json(
        { error: 'Missing or invalid ExamManifest in payload.' },
        { status: 400 }
      );
    }

    const clientKey = req.headers.get('x-gemini-key') || undefined;
    const clientZaiKey = req.headers.get('x-zai-key') || undefined;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamExamAssessment(manifest, submissions, {
            clientKey,
            zaiKey: clientZaiKey,
            thinkingBudget,
            sessionId,
            timeRemainingSeconds,
          });

          for await (const event of generator) {
            const line = JSON.stringify(event) + '\n';
            controller.enqueue(encoder.encode(line));
          }
          controller.close();
        } catch (err: unknown) {
          console.error('Error in assessment stream generator:', err);
          const errorMsg = err instanceof Error ? err.message : 'Unknown evaluation stream error';
          const line = JSON.stringify({ type: 'error', message: errorMsg }) + '\n';
          controller.enqueue(encoder.encode(line));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    console.error('Evaluation Route Error:', error);
    const message = error instanceof Error ? error.message : 'Error initiating assessment stream.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
