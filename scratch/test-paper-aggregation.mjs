// Logic test: paper-level aggregation of Question Evaluations (Grade Boundaries, totals, Syllabus Weakness Matrix).
// Run: node scratch/test-paper-aggregation.mjs
import assert from 'node:assert/strict';
import {
  calculatePredictedGrade,
  synthesizeSyllabusBreakdown,
  gradePaper,
} from '../src/lib/assessment/aggregate.ts';

const boundaries = { grade7: 78, grade6: 65, grade5: 52, grade4: 40, grade3: 28, grade2: 16 };

// Grade Boundary edges: a percentage on the boundary earns that grade.
for (const [pct, grade] of [[100, 7], [78, 7], [77, 6], [65, 6], [64, 5], [52, 5], [51, 4], [40, 4], [39, 3], [28, 3], [27, 2], [16, 2], [15, 1], [0, 1]]) {
  assert.equal(calculatePredictedGrade(pct, boundaries), grade, `${pct}% → grade ${grade}`);
}

const evaluation = (id, subtopic, awarded, max, recommendation = `Revise ${subtopic}`) => ({
  questionId: id,
  questionNumber: id,
  marksAwarded: awarded,
  maxMarks: max,
  syllabusSubtopic: subtopic,
  revisionRecommendation: recommendation,
});

const evaluations = [
  evaluation('1', 'Calculus', 5, 6),
  evaluation('2', 'Calculus', 3, 4),
  evaluation('3', 'Vectors', 2, 5),
  evaluation('4', 'Probability', 1, 4),
  evaluation('5', '', 0, 1),
];

// Syllabus Weakness Matrix: grouped by subtopic, status thresholds at 80% and 50%.
const matrix = synthesizeSyllabusBreakdown(evaluations);
const bySubtopic = Object.fromEntries(matrix.map((row) => [row.subtopic, row]));
assert.deepEqual(
  { ...bySubtopic.Calculus },
  { subtopic: 'Calculus', marksAwarded: 8, totalMarks: 10, percentage: 80, status: 'mastered', targetedDrillPrompt: 'Revise Calculus' }
);
assert.equal(bySubtopic.Vectors.status, 'critical', '40% is critical');
assert.equal(bySubtopic.Probability.percentage, 25);
assert.ok(bySubtopic['General Examination Syllabus'], 'missing subtopic falls back to the general bucket');

// gradePaper: totals use the paper's total marks when the manifest declares them.
const manifest = { totalMarks: 20, gradeBoundaries: boundaries };
const results = gradePaper(manifest, evaluations, 8192);
assert.equal(results.totalMarksAwarded, 11);
assert.equal(results.totalPossibleMarks, 20);
assert.equal(results.percentage, 55);
assert.equal(results.predictedGrade, 5);
assert.equal(results.reasoningEffortUsed, 'high');
assert.equal(results.evaluations, evaluations);
assert.deepEqual(results.syllabusBreakdown, matrix);

// Without declared total marks, the maximum marks of the evaluated questions are summed.
const undeclared = gradePaper({ totalMarks: 0, gradeBoundaries: boundaries }, evaluations, 1024);
assert.equal(undeclared.totalPossibleMarks, 20);
assert.equal(undeclared.reasoningEffortUsed, 'minimal');

// No marks available: 0%, grade 1, no division by zero.
const empty = gradePaper({ totalMarks: 0, gradeBoundaries: boundaries }, [], 8192);
assert.equal(empty.percentage, 0);
assert.equal(empty.predictedGrade, 1);

console.log('paper aggregation: all assertions passed');
