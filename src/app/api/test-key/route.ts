import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, DEFAULT_MODEL, FALLBACK_MODELS, isInvalidKeyError } from '@/lib/gemini';
import { parseWithGlmOcr, GLM_OCR_MODEL } from '@/lib/ocr/glmOcr';
import { INVALID_KEY } from '@/lib/aiKey';

export const maxDuration = 30;

// Each model gets a short try, so a busy Gemini can't hold the test open
const ATTEMPT_MS = 8_000;

export async function POST(req: NextRequest) {
  let body: { apiKey?: unknown; provider?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, message: 'The test request could not be read.', code: 'BAD_REQUEST' }, { status: 400 });
  }
  const provider = body.provider ?? 'gemini';
  const keyToTest = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';

  if (provider === 'zai' || provider === 'glm-ocr') {
    if (!keyToTest) {
      return NextResponse.json({ valid: false, message: 'No Z.AI key provided.', code: 'NO_KEY' }, { status: 400 });
    }

    try {
      // Minimal 1x1 transparent test PNG
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const result = await parseWithGlmOcr(testImage, 'image/png', keyToTest);

      return NextResponse.json({
        valid: true,
        message: `${result.model || GLM_OCR_MODEL} connected successfully to Z.AI.`,
        model: result.model || GLM_OCR_MODEL,
        provider: 'zai',
      });
    } catch (err: unknown) {
      console.error('Z.AI key test failed:', err);
      return NextResponse.json(
        { valid: false, message: "Couldn't connect to Z.AI with this key.", code: 'ZAI_FAILED', provider: 'zai' },
        { status: 401 }
      );
    }
  }

  if (!keyToTest) {
    return NextResponse.json({ valid: false, message: 'No API key provided.', code: 'NO_KEY' }, { status: 400 });
  }

  const ai = getGeminiClient(keyToTest);
  if (!ai) {
    return NextResponse.json({ valid: false, message: 'No API key provided.', code: 'NO_KEY' }, { status: 400 });
  }

  let successfulModel: string = DEFAULT_MODEL;
  let connected = false;
  let lastError: unknown;

  for (const m of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents: 'Ping test for IB Examiner App. Respond with: OK',
        config: { abortSignal: AbortSignal.timeout(ATTEMPT_MS) },
      });
      if (response.text) {
        connected = true;
        successfulModel = m;
        break;
      }
    } catch (err) {
      lastError = err;
      if (isInvalidKeyError(err)) break;
    }
  }

  if (!connected) {
    console.error('Gemini key test failed:', lastError);
    if (isInvalidKeyError(lastError)) {
      return NextResponse.json({ valid: false, message: 'Gemini rejected this key.', code: INVALID_KEY }, { status: 401 });
    }
    return NextResponse.json(
      { valid: false, message: "Couldn't reach Gemini right now. It may be busy; try again in a moment.", code: 'GEMINI_UNAVAILABLE' },
      { status: 502 }
    );
  }

  return NextResponse.json({
    valid: true,
    message: `${successfulModel} connected successfully.`,
    model: successfulModel,
  });
}
