// Logic test: turning the model's ingestion output into an Exam Manifest, and the upload checks.
// Run: npx tsx scratch/test-ingest-output.ts
import assert from 'node:assert/strict';
import { parseManifestOutput, sanitizeSvg, IngestionError } from '../src/lib/ingestion/compiler';
import { checkUploadPair, MAX_UPLOAD_BYTES, isPdfBytes } from '../src/lib/ingestion/uploadLimits';

const question = (over: Record<string, unknown> = {}) => ({
  id: 'q1',
  number: 'Question 1',
  pageNumber: 3,
  totalMarks: 4,
  promptText: 'Find x.',
  markCodes: [],
  ...over,
});
const output = (questions: unknown[]) => JSON.stringify({ title: 'Paper 1', totalMarks: 4, questions });

// A well-formed reply becomes a manifest with clean numbers and pages re-indexed from 1.
{
  const manifest = parseManifestOutput('```json\n' + output([question()]) + '\n```');
  assert.equal(manifest.questions[0].number, '1');
  assert.equal(manifest.questions[0].pageNumber, 1);
  assert.match(manifest.id, /^custom-/);
}

// Truncated or malformed output fails with a code the route can turn into a friendly message.
for (const bad of ['{"title": "Paper 1", "questions": [', 'not json', output([]), JSON.stringify({ title: 'x' })]) {
  assert.throws(() => parseManifestOutput(bad), (e) => e instanceof IngestionError && e.code === 'UNREADABLE_OUTPUT', bad);
}

// A question without its number is unreadable output, not a crash.
assert.throws(
  () => parseManifestOutput(output([question({ number: undefined })])),
  (e) => e instanceof IngestionError && e.code === 'UNREADABLE_OUTPUT'
);

// Model-written SVG keeps its drawing but loses anything that could run.
{
  const svg = sanitizeSvg(
    '<svg onload="steal()" viewBox="0 0 10 10"><script>steal()</script><a href="javascript:steal()"><circle r="4" onclick=\'x()\'/></a><foreignObject><div>hi</div></foreignObject><image href="x" onerror=steal()/></svg>'
  )!;
  assert.ok(svg.includes('<circle'), 'drawing kept');
  for (const bad of ['onload', 'onclick', 'onerror', '<script', 'javascript:', 'foreignObject']) {
    assert.ok(!svg.toLowerCase().includes(bad.toLowerCase()), `${bad} removed: ${svg}`);
  }
}

// Upload checks: both PDFs together must fit under Vercel's request body cap.
{
  const pdf = (size: number) => ({ size, name: 'p.pdf', type: 'application/pdf' });
  assert.equal(checkUploadPair(pdf(1_000_000), pdf(1_000_000)), null);
  const tooBig = checkUploadPair(pdf(MAX_UPLOAD_BYTES), pdf(1));
  assert.ok(tooBig && /MB/.test(tooBig), 'oversize pair gets a message with the sizes');
  assert.ok(MAX_UPLOAD_BYTES < 4.5 * 1024 * 1024, 'limit leaves room under the 4.5 MB cap');
}

// The server recognises a PDF by its signature, not its name.
assert.equal(isPdfBytes(Buffer.from('%PDF-1.7\n...')), true);
assert.equal(isPdfBytes(Buffer.from('PK\u0003\u0004 zip')), false);
assert.equal(isPdfBytes(Buffer.from('')), false);

console.log('ingest output: all assertions passed');
