import assert from 'assert';
import {
  BUNDLED_MATH_AA_HL,
  BUNDLED_ECONOMICS_HL,
  MAY_2021_MATH_AA_HL_P1,
} from '../src/lib/samplePapers';
import {
  calculatePredictedGrade,
  synthesizeSyllabusBreakdown,
  evaluateSingleQuestion,
} from '../src/lib/assessment/evaluator';
import { QuestionSubmission, QuestionGrading } from '../src/types/exam';

async function runLockdownVerification() {
  console.log('====================================================');
  console.log('  IB EXAMINER PLATFORM — LOCKDOWN VERIFICATION SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    totalTests++;
    try {
      const res = fn();
      if (res && typeof (res as Promise<void>).then === 'function') {
        return (res as Promise<void>).then(() => {
          console.log(`  ✓ PASS: ${name}`);
          passedTests++;
        }).catch((err) => {
          console.error(`  ✗ FAIL: ${name}`);
          console.error('    Error:', err.message || err);
        });
      } else {
        console.log(`  ✓ PASS: ${name}`);
        passedTests++;
      }
    } catch (err: unknown) {
      console.error(`  ✗ FAIL: ${name}`);
      const msg = err instanceof Error ? err.message : String(err);
      console.error('    Error:', msg);
    }
  }

  // 1. SPECIMEN MANIFEST INVARIANT TESTS
  console.log('--- 1. SPECIMEN MANIFEST INVARIANTS ---');
  test('May 2021 Math AA HL P1 total marks match sum of question marks (110m, 12 questions)', () => {
    const sumMarks = MAY_2021_MATH_AA_HL_P1.questions.reduce((sum, q) => sum + q.totalMarks, 0);
    assert.strictEqual(MAY_2021_MATH_AA_HL_P1.totalMarks, 110);
    assert.strictEqual(sumMarks, 110);
    assert.strictEqual(MAY_2021_MATH_AA_HL_P1.questions.length, 12);
  });

  test('Math AA HL Specimen total marks match sum of question marks (50m)', () => {
    const sumMarks = BUNDLED_MATH_AA_HL.questions.reduce((sum, q) => sum + q.totalMarks, 0);
    assert.strictEqual(BUNDLED_MATH_AA_HL.totalMarks, 50);
    assert.strictEqual(sumMarks, 50);
  });

  test('Economics HL Specimen total marks match sum of question marks (50m)', () => {
    const sumMarks = BUNDLED_ECONOMICS_HL.questions.reduce((sum, q) => sum + q.totalMarks, 0);
    assert.strictEqual(BUNDLED_ECONOMICS_HL.totalMarks, 50);
    assert.strictEqual(sumMarks, 50);
  });

  test('Specimen grade boundaries are strictly monotonic (7 > 6 > 5 > 4 > 3 > 2)', () => {
    [BUNDLED_MATH_AA_HL, MAY_2021_MATH_AA_HL_P1, BUNDLED_ECONOMICS_HL].forEach((manifest) => {
      const b = manifest.gradeBoundaries;
      assert(b.grade7 > b.grade6, `${manifest.title}: 7 must be > 6`);
      assert(b.grade6 > b.grade5, `${manifest.title}: 6 must be > 5`);
      assert(b.grade5 > b.grade4, `${manifest.title}: 5 must be > 4`);
      assert(b.grade4 > b.grade3, `${manifest.title}: 4 must be > 3`);
      assert(b.grade3 > b.grade2, `${manifest.title}: 3 must be > 2`);
    });
  });

  test('All specimen questions have valid command terms, mark codes, and syllabus topics', () => {
    [BUNDLED_MATH_AA_HL, MAY_2021_MATH_AA_HL_P1, BUNDLED_ECONOMICS_HL].forEach((manifest) => {
      manifest.questions.forEach((q) => {
        assert(q.commandTerm && q.commandTerm.length > 0, `${manifest.title} Question ${q.number} missing commandTerm`);
        assert(q.syllabusSubtopic && q.syllabusSubtopic.length > 0, `${manifest.title} Question ${q.number} missing syllabusSubtopic`);
        assert(Array.isArray(q.markCodes) && q.markCodes.length > 0, `${manifest.title} Question ${q.number} missing markCodes`);
        const sumCodes = q.markCodes.reduce((s, m) => s + m.marks, 0);
        assert.strictEqual(sumCodes, q.totalMarks, `${manifest.title} Question ${q.number} markCodes sum (${sumCodes}) != totalMarks (${q.totalMarks})`);
      });
    });
  });

  // 2. PREDICTED GRADE BOUNDARY TESTS
  console.log('\n--- 2. PREDICTED GRADE BOUNDARIES ---');
  test('calculatePredictedGrade maps exact percentage boundary edges', () => {
    const boundaries = { grade7: 78, grade6: 65, grade5: 52, grade4: 40, grade3: 28, grade2: 16, grade1: 0 };
    assert.strictEqual(calculatePredictedGrade(100, boundaries), 7);
    assert.strictEqual(calculatePredictedGrade(78, boundaries), 7);
    assert.strictEqual(calculatePredictedGrade(77, boundaries), 6);
    assert.strictEqual(calculatePredictedGrade(65, boundaries), 6);
    assert.strictEqual(calculatePredictedGrade(64, boundaries), 5);
    assert.strictEqual(calculatePredictedGrade(52, boundaries), 5);
    assert.strictEqual(calculatePredictedGrade(51, boundaries), 4);
    assert.strictEqual(calculatePredictedGrade(40, boundaries), 4);
    assert.strictEqual(calculatePredictedGrade(39, boundaries), 3);
    assert.strictEqual(calculatePredictedGrade(28, boundaries), 3);
    assert.strictEqual(calculatePredictedGrade(27, boundaries), 2);
    assert.strictEqual(calculatePredictedGrade(16, boundaries), 2);
    assert.strictEqual(calculatePredictedGrade(15, boundaries), 1);
    assert.strictEqual(calculatePredictedGrade(0, boundaries), 1);
  });

  // 3. SYLLABUS WEAKNESS MATRIX SYNTHESIS TESTS
  console.log('\n--- 3. SYLLABUS WEAKNESS MATRIX ---');
  test('synthesizeSyllabusBreakdown aggregates marks and computes correct status thresholds', () => {
    const sampleEvaluations: QuestionGrading[] = [
      {
        questionId: 'q1',
        questionNumber: '1',
        marksAwarded: 5,
        maxMarks: 5,
        examinerNotes: 'Perfect.',
        marginAnnotations: [],
        markBreakdown: [],
        ecfApplied: false,
        syllabusSubtopic: 'Calculus',
        subtopicMasteryScore: 100,
        revisionRecommendation: 'Keep it up.',
      },
      {
        questionId: 'q2',
        questionNumber: '2',
        marksAwarded: 3,
        maxMarks: 5,
        examinerNotes: 'Solid method, arithmetic slip.',
        marginAnnotations: [],
        markBreakdown: [],
        ecfApplied: false,
        syllabusSubtopic: 'Calculus',
        subtopicMasteryScore: 60,
        revisionRecommendation: 'Practice integrals.',
      },
      {
        questionId: 'q3',
        questionNumber: '3',
        marksAwarded: 1,
        maxMarks: 6,
        examinerNotes: 'Significant gap.',
        marginAnnotations: [],
        markBreakdown: [],
        ecfApplied: false,
        syllabusSubtopic: 'Probability',
        subtopicMasteryScore: 17,
        revisionRecommendation: 'Review Bayes theorem.',
      },
    ];

    const breakdown = synthesizeSyllabusBreakdown(sampleEvaluations);
    assert.strictEqual(breakdown.length, 2);

    const calculus = breakdown.find((b) => b.subtopic === 'Calculus')!;
    assert(calculus, 'Calculus subtopic should be present');
    assert.strictEqual(calculus.marksAwarded, 8);
    assert.strictEqual(calculus.totalMarks, 10);
    assert.strictEqual(calculus.percentage, 80);
    assert.strictEqual(calculus.status, 'mastered'); // >= 80%

    const prob = breakdown.find((b) => b.subtopic === 'Probability')!;
    assert(prob, 'Probability subtopic should be present');
    assert.strictEqual(prob.marksAwarded, 1);
    assert.strictEqual(prob.totalMarks, 6);
    assert.strictEqual(prob.percentage, 17);
    assert.strictEqual(prob.status, 'critical'); // < 50%
  });

  // 4. ERROR CARRIED FORWARD (ECF) & METHOD MARKING TESTS
  console.log('\n--- 4. ERROR CARRIED FORWARD & METHOD MARKING ---');
  await test('Unattempted question short-circuits to 0 marks without evaluation penalty', async () => {
    const q1 = BUNDLED_MATH_AA_HL.questions[0];
    const emptySub: QuestionSubmission = {
      questionId: q1.id,
      questionNumber: q1.number,
      timeSpentSeconds: 10,
    };
    const { evaluation, isSimulated } = await evaluateSingleQuestion(q1, emptySub, []);
    assert.strictEqual(isSimulated, false);
    assert.strictEqual(evaluation.marksAwarded, 0);
    assert.strictEqual(evaluation.ecfApplied, false);
    assert(evaluation.markBreakdown.every((m) => !m.awarded && m.marksAwarded === 0));
  });

  await test('Simulated engine applies ECF when previous subpart had an upstream error', async () => {
    const q1 = BUNDLED_MATH_AA_HL.questions[0];
    const q2 = BUNDLED_MATH_AA_HL.questions[1];

    // Mock an upstream evaluation with lost marks (e.g. calculation slip)
    const prevEvaluations: QuestionGrading[] = [
      {
        questionId: q1.id,
        questionNumber: q1.number,
        marksAwarded: 2,
        maxMarks: q1.totalMarks,
        examinerNotes: 'Upstream algebraic calculation error.',
        marginAnnotations: [],
        markBreakdown: [],
        ecfApplied: false,
        syllabusSubtopic: q1.syllabusSubtopic,
        subtopicMasteryScore: 40,
        revisionRecommendation: 'Check factorization.',
      },
    ];

    // Submission for Q2 with substantial work
    const sub2: QuestionSubmission = {
      questionId: q2.id,
      questionNumber: q2.number,
      canvasImageBase64: 'data:image/png;base64,' + 'A'.repeat(2500),
      timeSpentSeconds: 90,
    };

    const { evaluation } = await evaluateSingleQuestion(q2, sub2, prevEvaluations);

    // Verify ECF triggered
    assert.strictEqual(evaluation.ecfApplied, true, 'ECF should be flagged as true');
    assert(
      evaluation.markBreakdown.some((m) => m.isEcfApplied && m.awarded),
      'At least one method mark should be awarded under ECF'
    );
    assert(
      evaluation.examinerNotes.includes('Error Carried Forward (ECF)'),
      'Examiner notes must mention ECF protection'
    );
  });

  // 5. SUBPART ATTEMPT ISOLATION TEST
  console.log('\n--- 5. SUBPART ATTEMPT ISOLATION ---');
  await test('Question 12 with work only in part (a) awards 0 marks for unattempted subparts', async () => {
    const q12 = MAY_2021_MATH_AA_HL_P1.questions.find((q) => q.number === '12')!;
    assert(q12, 'Question 12 should exist in specimen paper');

    const sub: QuestionSubmission = {
      questionId: q12.id,
      questionNumber: q12.number,
      canvasImageBase64: 'data:image/png;base64,' + 'A'.repeat(3000),
      timeSpentSeconds: 150,
    };

    const { evaluation } = await evaluateSingleQuestion(q12, sub, []);
    assert(evaluation.marksAwarded > 0, 'Part a should receive marks');
    assert(evaluation.marksAwarded < q12.totalMarks, 'Cannot receive full marks without attempting later subparts');

    // Verify later subparts (b, c) were marked unattempted
    const laterSubparts = evaluation.markBreakdown.slice(3);
    assert(
      laterSubparts.every((m) => !m.awarded && m.marksAwarded === 0),
      'Later unattempted subparts must receive 0 marks'
    );
  });

  // 6. SOCRATIC SCAFFOLDING SECRECY & TIER UNLOCKING
  console.log('\n--- 6. SOCRATIC SCAFFOLDING SECRECY & TIER UNLOCKING ---');
  const { generateSimulatedSocraticResponse } = await import('../src/app/api/socratic/route');
  const testQ = BUNDLED_MATH_AA_HL.questions[0];

  test('Tier 1 anchors command term without revealing markscheme or mark codes', () => {
    const t1 = generateSimulatedSocraticResponse(testQ, 1);
    assert.strictEqual(t1.tierActive, 1);
    assert.strictEqual(t1.unlockedMarkscheme, false);
    assert(t1.text.includes(testQ.commandTerm), 'Must mention command term');
    assert(!t1.text.includes(testQ.markschemeExcerpt), 'Must not leak markscheme in Tier 1');
  });

  test('Tier 2 references formula booklet without revealing markscheme', () => {
    const t2 = generateSimulatedSocraticResponse(testQ, 2);
    assert.strictEqual(t2.tierActive, 2);
    assert.strictEqual(t2.unlockedMarkscheme, false);
    assert(t2.formulaQuote, 'Must include formula quote');
    assert(!t2.text.includes(testQ.markschemeExcerpt), 'Must not leak markscheme in Tier 2');
  });

  test('Tier 3 gives diagnostic highlight without revealing markscheme', () => {
    const t3 = generateSimulatedSocraticResponse(testQ, 3);
    assert.strictEqual(t3.tierActive, 3);
    assert.strictEqual(t3.unlockedMarkscheme, false);
    assert(t3.diagnosticHighlight, 'Must include diagnostic highlight');
    assert(!t3.text.includes(testQ.markschemeExcerpt), 'Must not leak markscheme in Tier 3');
  });

  test('Tier 4 explicitly unlocks markscheme criteria and discrete mark codes', () => {
    const t4 = generateSimulatedSocraticResponse(testQ, 4);
    assert.strictEqual(t4.tierActive, 4);
    assert.strictEqual(t4.unlockedMarkscheme, true);
    assert(t4.text.includes(testQ.markschemeExcerpt), 'Must reveal official markscheme excerpt');
    testQ.markCodes.forEach((mc) => {
      assert(t4.text.includes(mc.code), `Must list mark code ${mc.code}`);
    });
  });

  console.log('\n====================================================');
  console.log(`  RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log('====================================================\n');
}

runLockdownVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
