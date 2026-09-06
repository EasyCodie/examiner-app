import assert from 'node:assert';
import {
  MATH_AA_FORMULA_BOOKLET,
  MATH_AI_FORMULA_BOOKLET,
  getFormulaBooklet,
  getAllFormulas,
  findFormulaAnchor,
} from '../src/lib/data/formulaBooklets/index.ts';

console.log('--- Testing Formula Booklets Data & Resolvers ---');

// 1. Validate Math AA
console.log('Math AA Title:', MATH_AA_FORMULA_BOOKLET.title);
assert.strictEqual(MATH_AA_FORMULA_BOOKLET.topics.length, 5, 'Math AA must have 5 topics');
const aaFormulas = getAllFormulas(MATH_AA_FORMULA_BOOKLET);
console.log(`Math AA total formulas (prior learning + topics): ${aaFormulas.length}`);
assert(aaFormulas.length >= 35, 'Math AA must contain comprehensive formula catalog');

// 2. Validate Math AI
console.log('Math AI Title:', MATH_AI_FORMULA_BOOKLET.title);
assert.strictEqual(MATH_AI_FORMULA_BOOKLET.topics.length, 5, 'Math AI must have 5 topics');
const aiFormulas = getAllFormulas(MATH_AI_FORMULA_BOOKLET);
console.log(`Math AI total formulas: ${aiFormulas.length}`);
assert(aiFormulas.length >= 30, 'Math AI must contain comprehensive formula catalog');

// 3. Test getFormulaBooklet
assert.strictEqual(getFormulaBooklet('MATH_AA_HL_P1')?.id, 'math_aa');
assert.strictEqual(getFormulaBooklet(undefined, 'Mathematics: Analysis and Approaches HL')?.id, 'math_aa');
assert.strictEqual(getFormulaBooklet('MATH_AI_SL')?.id, 'math_ai');
assert.strictEqual(getFormulaBooklet(undefined, 'Economics HL (Paper 1)'), null);
assert.strictEqual(getFormulaBooklet('ECONOMICS_HL'), null);
console.log('✓ Subject code and title routing passed');

// 4. Test findFormulaAnchor on real specimen paper references
const tests = [
  { ref: "Section 5.5: ∫ f(g(x)) g'(x) dx", expectedCode: "SL 5.5" },
  { ref: "Section 5.16: Integration by parts", expectedCode: "AHL 5.16" },
  { ref: "Section 5.19: Maclaurin series", expectedCode: "AHL 5.19" },
  { ref: "Section 1.14: De Moivre", expectedCode: "AHL 1.14" },
  { ref: "Section 3.13: Scalar product", expectedCode: "AHL 3.13" },
  { ref: "Section 4.12: Standardized normal", expectedCode: "SL 4.12" },
];

for (const t of tests) {
  const match = findFormulaAnchor(MATH_AA_FORMULA_BOOKLET, t.ref);
  assert(match, `Expected to find match for ${t.ref}`);
  assert.strictEqual(match.code, t.expectedCode, `Expected ${t.expectedCode} for ${t.ref}, got ${match.code}`);
  console.log(`✓ Anchor found for "${t.ref}" -> [${match.code}] ${match.title}`);
}

console.log('All Formula Booklet data tests passed successfully!');
