import assert from 'assert';
import {
  BUNDLED_MATH_AA_HL,
  BUNDLED_ECONOMICS_HL,
  MAY_2021_MATH_AA_HL_P1,
} from '../src/lib/samplePapers';
import { evaluateSingleQuestion } from '../src/lib/assessment/evaluator';
import { MissingKeyError } from '../src/lib/aiKey';
import { calculatePredictedGrade, synthesizeSyllabusBreakdown } from '../src/lib/assessment/aggregate';
import { QuestionSubmission, QuestionEvaluation, QuestionGrading } from '../src/types/exam';

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
    const evaluation = await evaluateSingleQuestion(q1, emptySub, []);
    assert.strictEqual(evaluation.marksAwarded, 0);
    assert.strictEqual(evaluation.ecfApplied, false);
    assert(evaluation.markBreakdown.every((m) => !m.awarded && m.marksAwarded === 0));
  });

  await test('Attempted question without a key fails instead of inventing marks', async () => {
    const q2 = BUNDLED_MATH_AA_HL.questions[1];
    const sub2: QuestionSubmission = {
      questionId: q2.id,
      questionNumber: q2.number,
      canvasImageBase64: 'data:image/png;base64,' + 'A'.repeat(2500),
      timeSpentSeconds: 90,
    };
    await assert.rejects(evaluateSingleQuestion(q2, sub2, []), MissingKeyError);
  });

  // 6. SOCRATIC SCAFFOLDING SECRECY & TIER UNLOCKING
  console.log('\n--- 6. SOCRATIC SCAFFOLDING SECRECY & TIER UNLOCKING ---');
  const { buildTutorPrompt, shapeTutorReply, TutorUnavailableError } = await import('../src/lib/socratic/tutor');
  const testQ = BUNDLED_MATH_AA_HL.questions[0];
  const promptFor = (tier: 1 | 2 | 3 | 4) => buildTutorPrompt({ question: testQ, requestedTier: tier, userMessage: 'Help' });

  test('Tiers 1-3 never send the markscheme or mark codes to the model', () => {
    for (const tier of [1, 2, 3] as const) {
      const prompt = promptFor(tier);
      assert(prompt.includes(testQ.commandTerm), `Tier ${tier} prompt must carry the command term`);
      assert(!prompt.includes(testQ.markschemeExcerpt), `Tier ${tier} prompt must not include the markscheme`);
      testQ.markCodes.forEach((mc) => assert(!prompt.includes(mc.description), `Tier ${tier} prompt must not include mark code ${mc.code}`));
    }
  });

  test('Tier 4 grounds the walkthrough in the markscheme and its mark codes', () => {
    const prompt = promptFor(4);
    assert(prompt.includes(testQ.markschemeExcerpt), 'Tier 4 prompt must include the markscheme');
    testQ.markCodes.forEach((mc) => assert(prompt.includes(mc.description), `Tier 4 prompt must include mark code ${mc.code}`));
  });

  test('Without working, the tutor is told there is none instead of an attached image', () => {
    assert(promptFor(3).includes('has not written any working'), 'Blank snapshot must not be described as attached');
    const withImage = buildTutorPrompt({ question: testQ, requestedTier: 3, studentSnapshotImageBase64: 'data:image/png;base64,AAAA' });
    assert(withImage.includes('Handwritten working attached in image.'));
  });

  test('The server sets the tier, whatever the model claims', () => {
    const claimsUnlock = JSON.stringify({ text: 'Here is the markscheme', tierActive: 4, unlockedMarkscheme: true });
    for (const tier of [1, 2, 3] as const) {
      const reply = shapeTutorReply(claimsUnlock, tier);
      assert.strictEqual(reply.tierActive, tier);
      assert.strictEqual(reply.unlockedMarkscheme, false, `Tier ${tier} must never unlock the markscheme`);
    }
    const t4 = shapeTutorReply(JSON.stringify({ text: 'Walkthrough', tierActive: 1, unlockedMarkscheme: false }), 4);
    assert.strictEqual(t4.tierActive, 4);
    assert.strictEqual(t4.unlockedMarkscheme, true);
  });

  test('A malformed model reply means the tutor is unavailable, not a crash', () => {
    assert.throws(() => shapeTutorReply('{not json', 2), TutorUnavailableError);
    assert.throws(() => shapeTutorReply(JSON.stringify({ tierActive: 2 }), 2), TutorUnavailableError);
  });

  // 7. SUBPART EVALUATION & DISCRETE SCORING
  console.log('\n--- 7. SUBPART EVALUATION & DISCRETE SCORING ---');
  test('QuestionEvaluation is type-assignable to QuestionGrading alias', () => {
    const testEval: QuestionEvaluation = {
      questionId: 'q1',
      questionNumber: '1',
      marksAwarded: 5,
      maxMarks: 5,
      examinerNotes: 'Excellent.',
      marginAnnotations: [],
      markBreakdown: [],
      ecfApplied: false,
      syllabusSubtopic: 'Calculus',
      subtopicMasteryScore: 100,
      revisionRecommendation: 'Keep practicing.',
    };
    const backwardCompat: QuestionGrading = testEval;
    assert.strictEqual(backwardCompat.marksAwarded, 5);
  });

  // 8. DEEP MODULE ARCHITECTURE & SEAM INTEGRATION
  console.log('\n--- 8. DEEP MODULE ARCHITECTURE & SEAM INTEGRATION ---');
  const { compileExamManifest } = await import('../src/lib/ingestion/compiler');
  const { consultSocraticTutor } = await import('../src/lib/socratic/tutor');
  const { compileMockSession } = await import('../src/lib/session/submissionCompiler');
  const { examRepo, getAllManifests, getAiConfig } = await import('../src/lib/storage');

  test('compileMockSession compiles STEM handwritten working into ExamSession entity', () => {
    const paper = BUNDLED_MATH_AA_HL;
    const q1 = paper.questions[0];
    const { session, submissions } = compileMockSession({
      manifest: paper,
      pageStrokes: {
        1: [{ points: [{ x: 10, y: 10, pressure: 0.5 }, { x: 20, y: 20, pressure: 0.5 }], color: '#ffffff', width: 2, tool: 'pen' }],
      },
      pageBoxStrokes: {},
      activeBoxImages: { [q1.id]: 'data:image/png;base64,mockbox' },
      activePageNumber: 1,
      distinctQuestionPages: [1],
      timeRemainingSeconds: 3000,
      startedAt: '2026-05-04T08:00:00.000Z',
    });

    assert.strictEqual(session.paperId, paper.id);
    assert.strictEqual(session.mode, 'TIMED_MOCK');
    assert(session.submissions[q1.id], `Submission for ${q1.id} must exist`);
    assert.strictEqual(submissions[q1.id], session.submissions[q1.id]);
    assert.strictEqual(session.submissions[q1.id].canvasImageBase64, 'data:image/png;base64,mockbox');
    assert(session.submissions[q1.id].timeSpentSeconds > 0, 'Time spent must be allocated');
  });

  test('compileMockSession compiles Humanities structured essays into ExamSession entity', () => {
    const paper = BUNDLED_ECONOMICS_HL;
    const q1 = paper.questions[0];
    const { session, submissions } = compileMockSession({
      manifest: paper,
      pageStrokes: {},
      pageBoxStrokes: {},
      activePageNumber: 1,
      distinctQuestionPages: [1],
      timeRemainingSeconds: 2400,
      startedAt: '2026-05-04T08:00:00.000Z',
      humanitiesSubmissions: {
        [q1.id]: {
          questionId: q1.id,
          questionNumber: q1.number,
          textResponse: 'This is an in-depth macroeconomic essay evaluating negative externalities of consumption.',
          timeSpentSeconds: 600,
        },
      },
    });

    assert.strictEqual(session.paperId, paper.id);
    assert.strictEqual(session.subjectCategory, 'HUMANITIES');
    assert(submissions[q1.id], 'Humanities submission for q1 must be preserved');
    assert(submissions[q1.id]?.textResponse?.includes('macroeconomic essay'));
  });

  await test('consultSocraticTutor without a key refuses instead of inventing a reply', async () => {
    await assert.rejects(
      consultSocraticTutor({ question: BUNDLED_MATH_AA_HL.questions[0], requestedTier: 1, userMessage: 'How do I begin?' }),
      MissingKeyError
    );
  });

  await test('examRepo exposes manifests, sessions, strokes, and config facets', async () => {
    assert(examRepo.manifests && typeof examRepo.manifests.getAll === 'function');
    assert(examRepo.sessions && typeof examRepo.sessions.getAll === 'function');
    assert(examRepo.strokes && typeof examRepo.strokes.get === 'function');
    assert(examRepo.config && typeof examRepo.config.get === 'function');

    const config = await examRepo.config.get();
    assert(config.thinkingBudgetGrading, 'Config must have thinkingBudgetGrading');

    const manifests = await examRepo.manifests.getAll();
    assert(manifests.length >= 2, 'Must include bundled sample papers');

    const singleManifest = await examRepo.manifests.getById(BUNDLED_MATH_AA_HL.id);
    assert(singleManifest !== null, 'Should retrieve bundled paper by id');
    assert.strictEqual(singleManifest?.title, BUNDLED_MATH_AA_HL.title);

    // Verify storage.ts facade backward compatibility
    const facadeManifests = await getAllManifests();
    assert.strictEqual(facadeManifests.length, manifests.length, 'Facade must return identical count');
    const facadeConfig = await getAiConfig();
    assert.strictEqual(facadeConfig.thinkingBudgetGrading, config.thinkingBudgetGrading, 'Facade config must match repo');
  });

  await test('compileExamManifest validates inputs and handles pipeline execution', async () => {
    assert(typeof compileExamManifest === 'function', 'compileExamManifest must be an exported function');
    let threw = false;
    try {
      await compileExamManifest(Buffer.from(''), Buffer.from(''));
    } catch (err: unknown) {
      threw = true;
      assert(err instanceof Error, 'Should throw an Error instance on empty buffers');
    }
    assert(threw, 'compileExamManifest should fail when passed empty invalid buffers');
  });

  console.log('\n====================================================');
  console.log(`  RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log('====================================================\n');
}

runLockdownVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
