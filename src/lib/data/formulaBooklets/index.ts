import { FormulaBooklet, FormulaItem } from './types';
import { MATH_AA_FORMULA_BOOKLET } from './mathAA';
import { MATH_AI_FORMULA_BOOKLET } from './mathAI';

export * from './types';
export { MATH_AA_FORMULA_BOOKLET } from './mathAA';
export { MATH_AI_FORMULA_BOOKLET } from './mathAI';

export const ALL_FORMULA_BOOKLETS: FormulaBooklet[] = [
  MATH_AA_FORMULA_BOOKLET,
  MATH_AI_FORMULA_BOOKLET,
];

/**
 * Resolve the appropriate Formula Booklet based on subject code or paper title.
 * Returns null if the subject does not have an official IB Formula Booklet (e.g. Economics).
 */
export function getFormulaBooklet(
  subjectCode?: string,
  title?: string
): FormulaBooklet | null {
  const code = (subjectCode || '').toUpperCase();
  const text = (title || '').toLowerCase();

  // Math Analysis and Approaches
  if (
    code.includes('MATH_AA') ||
    text.includes('analysis and approaches') ||
    text.includes('analysis & approaches') ||
    text.includes('math aa')
  ) {
    return MATH_AA_FORMULA_BOOKLET;
  }

  // Math Applications and Interpretation
  if (
    code.includes('MATH_AI') ||
    text.includes('applications and interpretation') ||
    text.includes('applications & interpretation') ||
    text.includes('math ai')
  ) {
    return MATH_AI_FORMULA_BOOKLET;
  }

  // Generic Mathematics fallback to Math AA (the standard calculus-heavy track)
  if (code.includes('MATH') || text.includes('mathematics')) {
    return MATH_AA_FORMULA_BOOKLET;
  }

  // Subjects without formula booklets (Humanities, Economics, etc.)
  return null;
}

/**
 * Flattens all formula items in a booklet (Prior Learning + all Topics).
 */
export function getAllFormulas(booklet: FormulaBooklet): FormulaItem[] {
  const items: FormulaItem[] = [...booklet.priorLearning];
  for (const topic of booklet.topics) {
    items.push(...topic.subsections);
  }
  return items;
}

/**
 * Searches and finds a matching FormulaItem given a reference query from QuestionItem
 * (e.g. "Section 5.5: ∫ f(g(x)) g'(x) dx", "Section 1.9: Roots of complex numbers", "Section 5.16").
 */
export function findFormulaAnchor(
  booklet: FormulaBooklet,
  refQuery: string
): FormulaItem | null {
  if (!refQuery || !refQuery.trim()) return null;

  const normalized = refQuery.toLowerCase().trim();
  const allFormulas = getAllFormulas(booklet);

  // 1. Try matching explicit section numbers (e.g. "5.5", "1.10", "3.13", "5.19")
  const sectionMatch = normalized.match(/(?:section|topic|sec|sl|ahl)?\s*([0-9]+\.[0-9]+)/i);
  if (sectionMatch && sectionMatch[1]) {
    const secNum = sectionMatch[1];
    const directMatch = allFormulas.find(
      (f) =>
        f.code.toLowerCase().includes(secNum) ||
        f.id.toLowerCase().includes(`sec-${secNum.replace('.', '-')}`)
    );
    if (directMatch) return directMatch;
  }

  // 2. Direct ID or Code exact match
  const exactMatch = allFormulas.find(
    (f) =>
      f.id.toLowerCase() === normalized ||
      f.code.toLowerCase() === normalized
  );
  if (exactMatch) return exactMatch;

  // 3. Keyword / Title substring match
  const textMatch = allFormulas.find((f) => {
    const titleMatch = f.title.toLowerCase().includes(normalized) || normalized.includes(f.title.toLowerCase());
    const keywordMatch = f.keywords.some(
      (kw) => normalized.includes(kw) || kw.includes(normalized)
    );
    return titleMatch || keywordMatch;
  });

  return textMatch || null;
}
