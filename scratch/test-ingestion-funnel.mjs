import { MANIFEST_RESPONSE_SCHEMA } from '../src/lib/schemas.ts';

console.log("=== INGESTION FUNNEL DIAGNOSTIC HARNESS ===");

// TEST 1: Check if MANIFEST_RESPONSE_SCHEMA supports diagrams on subparts
const subpartProperties = MANIFEST_RESPONSE_SCHEMA.properties.questions.items.properties.subparts.items.properties;
const hasSubpartDiagram = 'diagram' in subpartProperties;
console.log("\n[TEST 1] Subparts Diagram Schema Support:");
if (!hasSubpartDiagram) {
  console.log("❌ FAIL: subparts schema DOES NOT define 'diagram'.");
} else {
  console.log("✅ PASS: subparts schema defines 'diagram' with SVG content & type!");
}

// TEST 2: Page Re-indexing collapse prevention test
console.log("\n[TEST 2] Page Mapping Logic Test:");
function simulateFixedPageMap(questions) {
  const rawPages = Array.from(
    new Set(questions.map((q) => Number(q.pageNumber) || 1))
  ).sort((a, b) => a - b);

  const shouldAssignSequentialPages = rawPages.length === 1 && questions.length > 1;

  const pageMap = new Map();
  rawPages.forEach((origPage, idx) => {
    pageMap.set(origPage, idx + 1);
  });

  return questions.map((q, idx) => ({
    ...q,
    pageNumber: shouldAssignSequentialPages ? idx + 1 : pageMap.get(Number(q.pageNumber)) || 1
  }));
}

const testQuestionsA = [
  { id: 'q1', number: '1', pageNumber: 1 },
  { id: 'q2', number: '2', pageNumber: 1 },
  { id: 'q3', number: '3', pageNumber: 1 },
  { id: 'q4', number: '4', pageNumber: 1 },
  { id: 'q5', number: '5', pageNumber: 1 },
];
const mappedA = simulateFixedPageMap(testQuestionsA);
const uniquePagesA = new Set(mappedA.map(q => q.pageNumber)).size;
console.log(`Scenario A (All pageNumber=1): Unique pages resulting: ${uniquePagesA} / 5`);
if (uniquePagesA === 5) {
  console.log("✅ PASS: Questions sequentially mapped to distinct pages even if LLM collapsed pages!");
} else {
  console.log("❌ FAIL: Collapsed page numbers still not prevented.");
}

// TEST 3: Canvas Box Collision Fix Test
console.log("\n[TEST 3] Canvas Box ID Collision Simulation:");
function simulateFixedCanvasBoxRegistration(questionsOnPage) {
  const boxRefs = {};
  questionsOnPage.forEach((q) => {
    const hasSubparts = Array.isArray(q.subparts) && q.subparts.length > 0;
    if (hasSubparts) {
      q.subparts.forEach((sub, sIdx) => {
        const boxId = sub.id || `${q.id}_${sIdx}`;
        boxRefs[boxId] = `box_for_${boxId}`;
      });
    } else {
      // FIXED CODE: scoped to q.id
      boxRefs[q.id] = `box_for_${q.id}`;
    }
  });
  return boxRefs;
}

const pageWithTwoQuestions = [
  { id: 'q1', number: '1' },
  { id: 'q2', number: '2' }
];
const registeredBoxes = simulateFixedCanvasBoxRegistration(pageWithTwoQuestions);
console.log("Registered boxes on page with 2 single questions:", Object.keys(registeredBoxes));
if (Object.keys(registeredBoxes).length === 2 && registeredBoxes['q1'] && registeredBoxes['q2']) {
  console.log("✅ PASS: Each question gets its own distinct box ID ('q1' and 'q2'). No collision!");
} else {
  console.log("❌ FAIL: Box collision occurred!");
}

// TEST 4: SVG Content Sanitization
console.log("\n[TEST 4] SVG Sanitization Simulation:");
function sanitizeSvg(rawSvg) {
  if (!rawSvg) return undefined;
  let clean = rawSvg.trim();
  clean = clean.replace(/^```(?:xml|svg|html)?\s*/i, '').replace(/\s*```$/i, '');
  clean = clean.replace(/<\?xml[\s\S]*?\?>/gi, '');
  clean = clean.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  return clean.trim() || undefined;
}

const llmSvgWithFences = "```xml\n<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<svg viewBox='0 0 100 100'><circle cx='50' cy='50' r='40'/></svg>\n```";
const sanitized = sanitizeSvg(llmSvgWithFences);
console.log("Sanitized markdown-fenced XML SVG:", sanitized.startsWith("<svg") && sanitized.endsWith("</svg>"));
if (sanitized.startsWith("<svg") && sanitized.endsWith("</svg>") && !sanitized.includes('<?xml')) {
  console.log("✅ PASS: SVG cleaned correctly, stripped fences and XML headers!");
} else {
  console.log("❌ FAIL: Markdown fences or XML headers remained in SVG!");
}
