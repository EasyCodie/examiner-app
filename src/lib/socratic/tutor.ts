import { getGeminiClient, DEFAULT_MODEL, FALLBACK_MODELS } from '@/lib/gemini';
import { SOCRATIC_SYSTEM_PROMPT } from '@/lib/prompts';
import { SOCRATIC_RESPONSE_SCHEMA } from '@/lib/schemas';
import { QuestionItem, SocraticMessage, PedagogicalTier } from '@/types/exam';

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

export interface SocraticTurnResult {
  message: {
    text: string;
    tierActive: PedagogicalTier;
    formulaQuote?: string;
    diagnosticHighlight?: string;
    unlockedMarkscheme: boolean;
  };
  isSimulated: boolean;
  notice?: string;
}

/**
 * Deep Module: Generates Socratic pedagogical guidance for an IB student,
 * enforcing 4-tier pedagogical guardrails, conversation windowing, multimodal snapshot ingestion,
 * and automated failover to the local simulation tutor engine.
 */
export async function consultSocraticTutor(
  input: SocraticConsultationInput
): Promise<SocraticTurnResult> {
  const {
    question,
    messages = [],
    requestedTier = 1,
    studentSnapshotText,
    studentSnapshotImageBase64,
    userMessage,
    thinkingBudget = 2048,
    apiKey,
  } = input;

  if (!question) {
    throw new Error('Missing question context for Socratic consultation.');
  }

  const ai = getGeminiClient(apiKey);
  if (!ai) {
    const simulated = generateSimulatedSocraticResponse(question, requestedTier);
    return {
      message: simulated,
      isSimulated: true,
      notice: 'Served via local pedagogical engine (no API key configured).',
    };
  }

  const conversationHistory = messages
    .slice(-6)
    .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
    .join('\n');

  const promptText = `IB SOCRATIC TUTOR WORKBENCH:
Question: ${question.number}
Command Term: ${question.commandTerm}
Allocated Marks: ${question.totalMarks}
Syllabus Topic: ${question.syllabusSubtopic}
Formula Booklet Reference: ${question.formulaBookletRef || 'N/A'}
Question Prompt:
${question.promptText}

ACTIVE PEDAGOGICAL TIER REQUESTED: Tier ${requestedTier}
- Tier 1: Clarify command term and operational scope.
- Tier 2: Provide hint to formula booklet or theoretical structure.
- Tier 3: Diagnose current working or logic roadblock with a guiding question.
- Tier 4: Unlock official markscheme criteria breakdown.

STUDENT WORK SNAPSHOT:
${studentSnapshotText ? `Written Text: "${studentSnapshotText}"` : 'Handwritten working attached in image.'}

RECENT CONVERSATION:
${conversationHistory || 'No previous messages.'}

LATEST STUDENT INPUT:
"${userMessage || 'I need guidance on this question.'}"

Remember: Guide the student Socratically without revealing final answers unless requestedTier is 4. Respond concisely.`;

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
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents,
        config: {
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
      console.warn(`Socratic model ${m} unavailable, trying fallback:`, err);
    }
  }

  if (responseText) {
    const parsed = JSON.parse(responseText);
    return { message: parsed, isSimulated: false };
  }

  console.warn('Upstream Gemini unavailable, using simulated Socratic response. Error:', lastError);
  const simulated = generateSimulatedSocraticResponse(question, requestedTier);
  return {
    message: simulated,
    isSimulated: true,
    notice: 'Served via local pedagogical scaffold engine due to upstream model congestion.',
  };
}

/**
 * High-fidelity offline fallback Socratic response generator.
 */
export function generateSimulatedSocraticResponse(
  question: QuestionItem,
  tier: PedagogicalTier
) {
  if (tier === 1) {
    return {
      text: `Let's start with the command term: **"${question.commandTerm}"**.\n\nIn the IB Diploma Programme, "${question.commandTerm}" requires you to ${
        question.commandTerm.toLowerCase().includes('show')
          ? 'reach the given result without skipping intermediate algebraic steps. Every substitution must be explicitly written out.'
          : question.commandTerm.toLowerCase().includes('evaluate')
          ? 'make an appraisal by weighing up the strengths and limitations of different perspectives before drawing a supported conclusion.'
          : 'obtain a numerical or algebraic answer showing the relevant stages in your working.'
      }\n\nHow would you like to begin your first step?`,
      tierActive: 1 as const,
      unlockedMarkscheme: false,
    };
  }

  if (tier === 2) {
    return {
      text: `Take a look at your IB Formula Booklet: **${question.formulaBookletRef || question.syllabusSubtopic}**.\n\nNotice how the structure of the prompt mirrors the standard identity. How can you set up the initial substitution or theoretical framework using this relation?`,
      tierActive: 2 as const,
      formulaQuote: question.formulaBookletRef,
      unlockedMarkscheme: false,
    };
  }

  if (tier === 3) {
    return {
      text: `Looking at your current attempt: Check your intermediate substitution and sign consistency.\n\nNotice whether you differentiated or integrated the inner function correctly, and double check whether your limits were transformed or preserved in terms of the original variable. Where does your current step lead when you simplify that fraction?`,
      tierActive: 3 as const,
      diagnosticHighlight: `Inspect intermediate algebraic transformation: ensure constant factors are factored outside before evaluating limits.`,
      unlockedMarkscheme: false,
    };
  }

  // Tier 4: Unlock Markscheme
  return {
    text: `Here is the official markscheme breakdown for this question:\n\n**Markscheme Criteria:**\n${question.markschemeExcerpt}\n\n**Allocated Mark Codes:**\n${question.markCodes
      .map((m) => `• **${m.code}** (${m.marks} mark): ${m.description}`)
      .join('\n')}\n\n${question.ecfRules ? `*Follow-Through Rule (ECF):* ${question.ecfRules}` : ''}`,
    tierActive: 4 as const,
    unlockedMarkscheme: true,
  };
}
