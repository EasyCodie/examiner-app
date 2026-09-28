import { getGeminiClient, DEFAULT_MODEL, FALLBACK_MODELS, isInvalidKeyError } from '@/lib/gemini';
import { SOCRATIC_SYSTEM_PROMPT } from '@/lib/prompts';
import { SOCRATIC_RESPONSE_SCHEMA } from '@/lib/schemas';
import { QuestionItem, SocraticMessage, PedagogicalTier } from '@/types/exam';
import { MissingKeyError } from '@/lib/aiKey';

export interface SocraticConsultationInput {
  question: QuestionItem;
  messages?: SocraticMessage[];
  userMessage?: string;
  requestedTier?: PedagogicalTier;
  studentSnapshotText?: string;
  studentSnapshotImageBase64?: string;
  thinkingBudget?: number;
  apiKey?: string;
}

export interface SocraticReply {
  text: string;
  tierActive: PedagogicalTier;
  formulaQuote?: string;
  diagnosticHighlight?: string;
  unlockedMarkscheme: boolean;
}

export interface SocraticTurnResult {
  message: SocraticReply;
}

/** Thrown when no model could give a usable reply. The student is told the tutor is unavailable; nothing is made up. */
export class TutorUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('The tutor could not reply.', { cause });
    this.name = 'TutorUnavailableError';
  }
}

const TIERS: PedagogicalTier[] = [1, 2, 3, 4];

/**
 * Builds the tutor prompt for the requested tier. The markscheme is only included at Tier 4,
 * so Tiers 1–3 cannot leak it.
 */
export function buildTutorPrompt({
  question,
  messages = [],
  requestedTier = 1,
  studentSnapshotText,
  studentSnapshotImageBase64,
  userMessage,
}: Pick<
  SocraticConsultationInput,
  'question' | 'messages' | 'requestedTier' | 'studentSnapshotText' | 'studentSnapshotImageBase64' | 'userMessage'
>): string {
  const tier = TIERS.includes(requestedTier) ? requestedTier : 1;
  const conversationHistory = messages
    .slice(-6)
    .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
    .join('\n');

  const markscheme =
    tier === 4
      ? `
MARKSCHEME (Tier 4 only: walk the student through it, mark code by mark code):
${question.markschemeExcerpt}
Mark codes:
${question.markCodes.map((m) => `- ${m.code} (${m.marks} mark${m.marks === 1 ? '' : 's'}): ${m.description}`).join('\n')}
${question.ecfRules ? `ECF rule: ${question.ecfRules}` : ''}
`
      : '';

  return `IB SOCRATIC TUTOR WORKBENCH:
Question: ${question.number}
Command Term: ${question.commandTerm}
Allocated Marks: ${question.totalMarks}
Syllabus Topic: ${question.syllabusSubtopic}
Formula Booklet Reference: ${question.formulaBookletRef || 'N/A'}
Question Prompt:
${question.promptText}

ACTIVE PEDAGOGICAL TIER REQUESTED: Tier ${tier}
- Tier 1: Clarify command term and operational scope.
- Tier 2: Provide hint to formula booklet or theoretical structure.
- Tier 3: Diagnose current working or logic roadblock with a guiding question.
- Tier 4: Walk through the markscheme below.
${markscheme}
STUDENT WORK SNAPSHOT:
${
  studentSnapshotText
    ? `Written Text: "${studentSnapshotText}"`
    : studentSnapshotImageBase64
      ? 'Handwritten working attached in image.'
      : 'The student has not written any working yet. Do not describe or assume any.'
}

RECENT CONVERSATION:
${conversationHistory || 'No previous messages.'}

LATEST STUDENT INPUT:
"${userMessage || 'I need guidance on this question.'}"

Remember: Guide the student Socratically without revealing final answers unless requestedTier is 4. Respond concisely.`;
}

/**
 * Parses the model's JSON reply. The tier is the one the student asked for, and the markscheme
 * unlocks only at Tier 4, whatever the model says.
 */
export function shapeTutorReply(responseText: string, requestedTier: PedagogicalTier): SocraticReply {
  const tier = TIERS.includes(requestedTier) ? requestedTier : 1;
  let parsed: Partial<SocraticReply>;
  try {
    parsed = JSON.parse(responseText);
  } catch (err) {
    throw new TutorUnavailableError(err);
  }
  if (!parsed || typeof parsed.text !== 'string' || !parsed.text.trim()) {
    throw new TutorUnavailableError(new Error('Tutor reply had no text.'));
  }
  return {
    text: parsed.text,
    tierActive: tier,
    ...(typeof parsed.formulaQuote === 'string' ? { formulaQuote: parsed.formulaQuote } : {}),
    ...(typeof parsed.diagnosticHighlight === 'string' ? { diagnosticHighlight: parsed.diagnosticHighlight } : {}),
    unlockedMarkscheme: tier === 4,
  };
}

/**
 * Deep Module: Generates Socratic pedagogical guidance for an IB student,
 * enforcing 4-tier pedagogical guardrails, conversation windowing and multimodal snapshot ingestion.
 * Throws MissingKeyError without a key and TutorUnavailableError when no model replies usably.
 */
export async function consultSocraticTutor(
  input: SocraticConsultationInput
): Promise<SocraticTurnResult> {
  const {
    question,
    requestedTier = 1,
    studentSnapshotImageBase64,
    thinkingBudget = 2048,
    apiKey,
  } = input;

  if (!question) {
    throw new Error('Missing question context for Socratic consultation.');
  }

  const ai = getGeminiClient(apiKey);
  if (!ai) throw new MissingKeyError();
  // The tutor stops within this, inside /api/socratic's maxDuration of 120 s
  const deadline = Date.now() + 110_000;

  const promptText = buildTutorPrompt(input);

  const contents: (string | { inlineData: { data: string; mimeType: string } })[] = [promptText];

  if (studentSnapshotImageBase64) {
    const cleanImg = studentSnapshotImageBase64.replace(/^data:image\/\w+;base64,/, '');
    contents.push({
      inlineData: {
        data: cleanImg,
        mimeType: 'image/png',
      },
    });
  }

  let responseText: string | undefined;
  const modelsToTry = Array.from(new Set([DEFAULT_MODEL, ...FALLBACK_MODELS]));
  let lastError: unknown;

  const effectiveBudget = typeof thinkingBudget === 'number' ? thinkingBudget : 2048;

  for (const m of modelsToTry) {
    const remaining = deadline - Date.now();
    if (remaining < 5_000) break;
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents,
        config: {
          // Aborts the request itself, not just the wait for it
          abortSignal: AbortSignal.timeout(Math.min(60_000, remaining)),
          systemInstruction: SOCRATIC_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: SOCRATIC_RESPONSE_SCHEMA,
          thinkingConfig: {
            thinkingBudget: effectiveBudget,
          },
          temperature: 0.3,
        },
      });
      if (response.text) {
        responseText = response.text;
        break;
      }
    } catch (err) {
      lastError = err;
      // Another model won't accept a key Gemini has already rejected
      if (isInvalidKeyError(err)) throw err;
      console.warn(`Socratic model ${m} unavailable, trying fallback:`, err);
    }
  }

  if (!responseText) throw new TutorUnavailableError(lastError);
  return { message: shapeTutorReply(responseText, requestedTier) };
}
