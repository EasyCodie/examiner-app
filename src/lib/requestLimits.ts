// What the marking and tutor routes accept. Each student's own key pays for the model, but the
// function time is ours, so requests stay bounded, and only inline images are ever forwarded.

export const LIMITS = {
  thinkingBudget: 8192,
  textResponseChars: 20_000,
  tutorMessageChars: 2_000,
  subpartImages: 12,
  previousEvaluations: 60,
  conversationMessages: 100,
} as const;

/** Clamps a requested thinking budget to 0..8192; the dynamic -1 and non-numbers are not accepted. */
export function clampThinkingBudget(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(LIMITS.thinkingBudget, Math.max(0, Math.floor(value)));
}

const IMAGE_DATA_URL = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/;

/** True for an inline PNG or JPEG data URL. URLs are refused, so no request can make a model or OCR service fetch one. */
export function isImageDataUrl(value: unknown): boolean {
  return typeof value === 'string' && IMAGE_DATA_URL.test(value);
}

const tooLong = (value: unknown, max: number) => typeof value === 'string' && value.length > max;
const badImage = (value: unknown) => value !== undefined && value !== null && value !== '' && !isImageDataUrl(value);

/** Returns what is wrong with a grading request, or null when it is within limits. */
export function checkGradeRequest(body: {
  question?: unknown;
  submission?: unknown;
  previousEvaluations?: unknown;
}): string | null {
  if (!body.question || typeof body.question !== 'object') return 'Missing question.';
  if (!body.submission || typeof body.submission !== 'object') return 'Missing submission.';
  const submission = body.submission as Record<string, unknown>;

  if (tooLong(submission.textResponse, LIMITS.textResponseChars)) return 'The written answer is too long.';
  if (badImage(submission.canvasImageBase64) || badImage(submission.diagramImageBase64)) return 'Working must be an inline image.';
  if (submission.subpartImages !== undefined) {
    if (!submission.subpartImages || typeof submission.subpartImages !== 'object') return 'Working must be an inline image.';
    const images = Object.values(submission.subpartImages);
    if (images.length > LIMITS.subpartImages) return 'Too many working boxes.';
    if (images.some(badImage)) return 'Working must be an inline image.';
  }

  const history = body.previousEvaluations;
  if (history !== undefined && !Array.isArray(history)) return 'Earlier marks must be a list.';
  if (Array.isArray(history) && history.length > LIMITS.previousEvaluations) return 'Too many earlier marks.';
  return null;
}

/** Returns what is wrong with a tutor request, or null when it is within limits. */
export function checkTutorRequest(body: {
  question?: unknown;
  userMessage?: unknown;
  messages?: unknown;
  studentSnapshotText?: unknown;
  studentSnapshotImageBase64?: unknown;
}): string | null {
  if (!body.question || typeof body.question !== 'object') return 'Missing question.';
  if (tooLong(body.userMessage, LIMITS.tutorMessageChars)) return 'The message is too long.';
  if (tooLong(body.studentSnapshotText, LIMITS.textResponseChars)) return 'The written answer is too long.';
  if (badImage(body.studentSnapshotImageBase64)) return 'Working must be an inline image.';

  const messages = body.messages;
  if (messages !== undefined && !Array.isArray(messages)) return 'The conversation must be a list.';
  if (Array.isArray(messages)) {
    if (messages.length > LIMITS.conversationMessages) return 'The conversation is too long.';
    // Tutor replies can be longer than a student's message
    if (messages.some((m) => tooLong((m as { text?: unknown })?.text, LIMITS.tutorMessageChars * 4))) {
      return 'A message in the conversation is too long.';
    }
  }
  return null;
}
