import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, DEFAULT_MODEL, FALLBACK_MODELS } from '@/lib/gemini';
import { parseWithGlmOcr, GLM_OCR_MODEL } from '@/lib/ocr/glmOcr';

export async function POST(req: NextRequest) {
  try {
    const { apiKey, provider = 'gemini' } = await req.json();

    if (provider === 'zai' || provider === 'glm-ocr') {
      const keyToTest = apiKey || process.env.ZAI_API_KEY || process.env.GLM_API_KEY;
      if (!keyToTest) {
        return NextResponse.json({ valid: false, message: 'No Z.AI / GLM-OCR API key provided.' }, { status: 400 });
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
        const msg = err instanceof Error ? err.message : 'Failed to connect to Z.AI GLM-OCR.';
        return NextResponse.json({ valid: false, message: msg, provider: 'zai' }, { status: 401 });
      }
    }

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
    const message = error instanceof Error ? error.message : 'Failed to test API key.';
    return NextResponse.json({ valid: false, message }, { status: 401 });
  }
}
