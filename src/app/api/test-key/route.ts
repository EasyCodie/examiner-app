import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, DEFAULT_MODEL, FALLBACK_MODELS } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    const keyToTest = apiKey || process.env.GEMINI_API_KEY;

    if (!keyToTest) {
      return NextResponse.json({ valid: false, message: 'No API key provided.' }, { status: 400 });
    }

    const ai = getGeminiClient(keyToTest);
    if (!ai) {
      return NextResponse.json({ valid: false, message: 'Unable to initialize Gemini client.' }, { status: 400 });
    }

    let reply: string | undefined;
    let successfulModel: string = DEFAULT_MODEL;
    let lastError: unknown;

    for (const m of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: m,
          contents: 'Ping test for IB Examiner App. Respond with: OK',
        });
        if (response.text) {
          reply = response.text.slice(0, 100);
          successfulModel = m;
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!reply) {
      const message = lastError instanceof Error ? lastError.message : 'Failed to connect to Gemini.';
      return NextResponse.json({ valid: false, message }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      message: `${successfulModel} connected successfully.`,
      model: successfulModel,
      reply,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to connect to Gemini.';
    return NextResponse.json({ valid: false, message }, { status: 401 });
  }
}
