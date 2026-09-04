/**
 * GLM-OCR Client Adapter for IB Examiner App
 *
 * Utilizes Z.AI (Zhipu AI) GLM-OCR model (0.9B parameters, CogViT visual encoder)
 * for state-of-the-art document layout parsing, LaTeX formula recognition,
 * table conversion, and handwritten script transcription.
 *
 * API Documentation: https://docs.z.ai/guides/vlm/glm-ocr#curl
 * API Endpoint: https://api.z.ai/api/paas/v4/layout_parsing
 */

export interface GlmOcrLayoutItem {
  index: number;
  label: 'text' | 'image' | 'formula' | 'table';
  bbox_2d?: [number, number, number, number];
  content: string;
  width?: number;
  height?: number;
}

export interface GlmOcrResponse {
  id: string;
  created: number;
  model: string;
  md_results: string;
  layout_details?: GlmOcrLayoutItem[][];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GlmOcrTranscript {
  markdown: string;
  hasContent: boolean;
  formulas: string[];
  tables: string[];
  rawResponse?: GlmOcrResponse;
}

export const ZAI_API_ENDPOINT = 'https://api.z.ai/api/paas/v4/layout_parsing';
export const GLM_OCR_MODEL = 'glm-ocr';

/**
 * Resolves the active Z.AI / GLM-OCR API key from request, environment, or config.
 */
export function getZaiApiKey(customKey?: string): string | null {
  const key = customKey || process.env.ZAI_API_KEY || process.env.GLM_API_KEY;
  if (!key || !key.trim()) return null;
  return key.trim();
}

/**
 * Normalizes input into a valid Z.AI file argument (URL or base64 Data URI).
 */
export function normalizeFileInput(input: string, mimeType = 'image/png'): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('data:')) {
    return trimmed;
  }
  return `data:${mimeType};base64,${trimmed}`;
}

/**
 * Performs layout parsing and OCR on a PDF document or image using GLM-OCR.
 */
export async function parseWithGlmOcr(
  fileInput: string,
  mimeType = 'image/png',
  apiKey?: string
): Promise<GlmOcrResponse> {
  const key = getZaiApiKey(apiKey);
  if (!key) {
    throw new Error('Z.AI API Key is missing. Please configure ZAI_API_KEY in .env.local or via AI Studio Workbench.');
  }

  const normalizedFile = normalizeFileInput(fileInput, mimeType);

  const payload = {
    model: GLM_OCR_MODEL,
    file: normalizedFile,
    return_crop_images: false,
    need_layout_visualization: false,
  };

  const response = await fetch(ZAI_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = `GLM-OCR API request failed with status ${response.status}`;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.message) errorMsg += `: ${errJson.message}`;
      else if (errJson.error?.message) errorMsg += `: ${errJson.error.message}`;
    } catch {
      errorMsg += `: ${errorText}`;
    }
    throw new Error(errorMsg);
  }

  const data: GlmOcrResponse = await response.json();
  return data;
}

/**
 * Transcribes handwritten student working from a canvas image into clean LaTeX Markdown.
 * Evaluates whether any actual algebraic/written content exists to prevent grading unattempted questions.
 */
export async function transcribeStudentHandwriting(
  canvasImageBase64: string,
  apiKey?: string
): Promise<GlmOcrTranscript> {
  const result = await parseWithGlmOcr(canvasImageBase64, 'image/png', apiKey);

  const md = result.md_results || '';
  const formulas: string[] = [];
  const tables: string[] = [];

  if (result.layout_details && Array.isArray(result.layout_details)) {
    result.layout_details.forEach((page) => {
      if (Array.isArray(page)) {
        page.forEach((item) => {
          if (item.label === 'formula' && item.content) {
            formulas.push(item.content);
          } else if (item.label === 'table' && item.content) {
            tables.push(item.content);
          }
        });
      }
    });
  }

  // Determine if meaningful student working was recorded
  // Discard boilerplate like standard paper grids or empty whitespace
  const cleanMd = md
    .replace(/^#.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  const hasContent = cleanMd.length > 5 || formulas.length > 0;

  return {
    markdown: md,
    hasContent,
    formulas,
    tables,
    rawResponse: result,
  };
}
