import { MAY_2021_MATH_AA_HL_P1 } from '../src/lib/samplePapers';
import { evaluateSingleQuestion } from '../src/lib/assessment/evaluator';

async function test() {
  const q12 = MAY_2021_MATH_AA_HL_P1.questions.find((q) => q.number === '12')!;
  console.log('Testing Q12 simulated grading with part (a) work only...');

  // Simulated submission with canvas strokes (attempting part a)
  const submission = {
    questionId: q12.id,
    questionNumber: q12.number,
    canvasImageBase64: 'data:image/png;base64,' + 'A'.repeat(3000), // work present
    timeSpentSeconds: 120,
  };

  const { evaluation } = await evaluateSingleQuestion(q12, submission, []);
  console.log('Total Marks Awarded:', evaluation.marksAwarded, '/', evaluation.maxMarks);
  console.log('Detailed Breakdown:');
  evaluation.markBreakdown.forEach((m, idx) => {
    console.log(`  Step ${idx + 1} [${m.code}]: ${m.marksAwarded}/${m.maxMarks}m - awarded: ${m.awarded} | ${m.reason}`);
  });
}

test();
