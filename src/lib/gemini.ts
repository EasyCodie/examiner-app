import { GoogleGenAI } from '@google/genai';

export function getGeminiClient(customApiKey?: string): GoogleGenAI | null {
  const key = customApiKey?.trim();
  if (!key) {
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
}

export const DEFAULT_MODEL = 'gemini-3.5-flash';

// Fast high-throughput models prioritized for multimodal PDF parsing
export const INGESTION_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
];

export const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
];

/** True when Gemini refused a request because the API key itself is not valid. */
export function isInvalidKeyError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /API_KEY_INVALID|API key not valid/i.test(message);
}
