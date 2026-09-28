// Logic test: limits the marking and tutor routes apply to what a request can ask for.
// Run: npx tsx scratch/test-request-limits.ts
import assert from 'node:assert/strict';
import {
  clampThinkingBudget,
  isImageDataUrl,
  checkGradeRequest,
  checkTutorRequest,
  LIMITS,
} from '../src/lib/requestLimits';

const png = 'data:image/png;base64,iVBORw0KGgo=';

// Thinking budget: clamped to 0..8192, never the dynamic -1, with a fallback for junk.
assert.equal(clampThinkingBudget(99999, 2048), 8192);
assert.equal(clampThinkingBudget(-1, 2048), 0);
assert.equal(clampThinkingBudget(1024.7, 2048), 1024);
assert.equal(clampThinkingBudget('lots', 2048), 2048);
assert.equal(clampThinkingBudget(undefined, 8192), 8192);

// Images are PNG or JPEG data URLs only; anything else, URLs included, is refused.
assert.equal(isImageDataUrl(png), true);
assert.equal(isImageDataUrl('data:image/jpeg;base64,/9j/4AAQ'), true);
assert.equal(isImageDataUrl('http://169.254.169.254/latest/meta-data'), false);
assert.equal(isImageDataUrl('https://example.com/a.png'), false);
assert.equal(isImageDataUrl('data:image/svg+xml;base64,PHN2Zz4='), false);
assert.equal(isImageDataUrl('iVBORw0KGgo='), false);

const question = { id: 'q1', number: '1' };
const submission = (over: Record<string, unknown> = {}) => ({ questionId: 'q1', questionNumber: '1', timeSpentSeconds: 60, ...over });

// Grade requests.
assert.equal(checkGradeRequest({ question, submission: submission({ canvasImageBase64: png }), previousEvaluations: [] }), null);
assert.equal(checkGradeRequest({ question, submission: submission(), previousEvaluations: undefined }), null, 'empty submission is fine');
assert.ok(checkGradeRequest({ question: undefined, submission: submission() }), 'question required');
assert.ok(checkGradeRequest({ question, submission: submission({ canvasImageBase64: 'http://evil/x.png' }) }), 'URL image refused');
assert.ok(checkGradeRequest({ question, submission: submission({ diagramImageBase64: 'https://evil/x.png' }) }), 'URL diagram refused');
assert.ok(checkGradeRequest({ question, submission: submission({ subpartImages: { a: 'http://evil' } }) }), 'URL subpart refused');
const manyParts = Object.fromEntries(Array.from({ length: LIMITS.subpartImages + 1 }, (_, i) => [`p${i}`, png]));
assert.ok(checkGradeRequest({ question, submission: submission({ subpartImages: manyParts }) }), 'too many subpart images');
assert.ok(checkGradeRequest({ question, submission: submission({ textResponse: 'x'.repeat(LIMITS.textResponseChars + 1) }) }), 'text too long');
assert.ok(
  checkGradeRequest({ question, submission: submission(), previousEvaluations: Array(LIMITS.previousEvaluations + 1).fill({}) }),
  'history too long'
);
assert.ok(checkGradeRequest({ question, submission: submission(), previousEvaluations: 'nope' }), 'history must be a list');
const bulky = { examinerNotes: 'x'.repeat(LIMITS.previousEvaluationsChars) };
assert.ok(checkGradeRequest({ question, submission: submission(), previousEvaluations: [bulky] }), 'history too large');
assert.equal(
  checkGradeRequest({ question, submission: submission(), previousEvaluations: Array(LIMITS.previousEvaluations).fill({ examinerNotes: 'ok' }) }),
  null,
  'a full paper of ordinary history is fine'
);

// Tutor requests.
const ok = { question, userMessage: 'Where do I start?', messages: [], studentSnapshotImageBase64: '', studentSnapshotText: '' };
assert.equal(checkTutorRequest(ok), null);
assert.equal(checkTutorRequest({ ...ok, studentSnapshotImageBase64: png }), null);
assert.ok(checkTutorRequest({ ...ok, question: undefined }), 'question required');
assert.ok(checkTutorRequest({ ...ok, userMessage: 'x'.repeat(LIMITS.tutorMessageChars + 1) }), 'message too long');
assert.ok(checkTutorRequest({ ...ok, studentSnapshotText: 'x'.repeat(LIMITS.textResponseChars + 1) }), 'snapshot text too long');
assert.ok(checkTutorRequest({ ...ok, studentSnapshotImageBase64: 'http://evil' }), 'URL snapshot refused');
assert.ok(checkTutorRequest({ ...ok, messages: 'nope' }), 'messages must be a list');
assert.ok(
  checkTutorRequest({ ...ok, messages: [{ sender: 'student', text: 'x'.repeat(LIMITS.tutorMessageChars * 4 + 1) }] }),
  'history message too long'
);

console.log('request limits: all assertions passed');
