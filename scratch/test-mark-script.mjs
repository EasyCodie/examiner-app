// Logic test: marking a script one question at a time, in paper order, carrying earlier Question Evaluations forward.
// Run: node scratch/test-mark-script.mjs
import assert from 'node:assert/strict';
import { markScript } from '../src/lib/assessment/markScript.ts';

const questions = ['q1', 'q2', 'q3', 'q4'].map((id, i) => ({ id, number: String(i + 1), totalMarks: 4 }));
const submissions = Object.fromEntries(questions.map((q) => [q.id, { questionId: q.id, questionNumber: q.number }]));
const evaluationOf = (q) => ({ questionId: q.id, questionNumber: q.number, marksAwarded: 3, maxMarks: 4 });

// Marks every question in order; each request carries the evaluations of the questions before it (ECF).
{
  const calls = [];
  const progress = [];
  const result = await markScript({
    questions,
    submissions,
    evaluations: [],
    gradeQuestion: async (q, submission, previous) => {
      calls.push({ id: q.id, submission: submission.questionId, previous: previous.map((e) => e.questionId) });
      return evaluationOf(q);
    },
    onEvaluated: async (all) => progress.push(all.map((e) => e.questionId)),
  });
  assert.deepEqual(calls, [
    { id: 'q1', submission: 'q1', previous: [] },
    { id: 'q2', submission: 'q2', previous: ['q1'] },
    { id: 'q3', submission: 'q3', previous: ['q1', 'q2'] },
    { id: 'q4', submission: 'q4', previous: ['q1', 'q2', 'q3'] },
  ]);
  assert.deepEqual(progress, [['q1'], ['q1', 'q2'], ['q1', 'q2', 'q3'], ['q1', 'q2', 'q3', 'q4']], 'each evaluation is reported as it arrives');
  assert.equal(result.failure, undefined);
  assert.deepEqual(result.evaluations.map((e) => e.questionId), ['q1', 'q2', 'q3', 'q4']);
}

// A failed question stops marking there: nothing is invented for it or for the questions after it.
{
  const calls = [];
  const boom = new Error('model unavailable');
  const result = await markScript({
    questions,
    submissions,
    evaluations: [],
    gradeQuestion: async (q) => {
      calls.push(q.id);
      if (q.id === 'q2') throw boom;
      return evaluationOf(q);
    },
    onEvaluated: async () => {},
  });
  assert.deepEqual(calls, ['q1', 'q2']);
  assert.deepEqual(result.evaluations.map((e) => e.questionId), ['q1']);
  assert.equal(result.failure.question.id, 'q2');
  assert.equal(result.failure.error, boom);
}

// Resuming (after a reload or a retry) marks only the questions without an evaluation, keeping the earlier ones.
{
  const calls = [];
  const saved = [evaluationOf(questions[0]), evaluationOf(questions[1])];
  const result = await markScript({
    questions,
    submissions,
    evaluations: saved,
    gradeQuestion: async (q, _s, previous) => {
      calls.push({ id: q.id, previous: previous.map((e) => e.questionId) });
      return evaluationOf(q);
    },
    onEvaluated: async () => {},
  });
  assert.deepEqual(calls, [
    { id: 'q3', previous: ['q1', 'q2'] },
    { id: 'q4', previous: ['q1', 'q2', 'q3'] },
  ]);
  assert.equal(result.evaluations[0], saved[0], 'saved evaluations are kept as they are');
  assert.deepEqual(result.evaluations.map((e) => e.questionId), ['q1', 'q2', 'q3', 'q4']);
}

// A question with no saved submission is still sent, as an empty submission, so it earns an honest zero.
{
  let sent;
  await markScript({
    questions: [questions[0]],
    submissions: {},
    evaluations: [],
    gradeQuestion: async (q, submission) => {
      sent = submission;
      return evaluationOf(q);
    },
    onEvaluated: async () => {},
  });
  assert.deepEqual(sent, { questionId: 'q1', questionNumber: '1', timeSpentSeconds: 0 });
}

console.log('mark script: all assertions passed');
