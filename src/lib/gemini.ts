import { GoogleGenAI } from '@google/genai';

export function getGeminiClient(customApiKey?: string): GoogleGenAI | null {
  const key = customApiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
}

export const DEFAULT_MODEL = 'gemini-3.6-flash';

// Fast high-throughput models prioritized for multimodal PDF parsing
export const INGESTION_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

export const FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

export async function generateWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  modelName: string
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Model ${modelName} timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export interface GenerateConfigOptions {
  model?: string;
  systemInstruction?: string;
  responseSchema?: Record<string, unknown>;
  thinkingBudget?: number; // 0 for minimal reasoning (Socratic), 4096-16384 for high reasoning (Grading)
  temperature?: number;
}
