// Logic test: Exam Session clock state machine (reading → writing → final → pens down).
// Run: node scratch/test-exam-clock.mjs
import assert from 'node:assert/strict';
import { examClockReducer, initialExamClock, FINAL_PHASE_SECONDS } from '../src/lib/session/examClock.ts';

let s = examClockReducer(initialExamClock, { type: 'load', readingSeconds: 2, writingSeconds: FINAL_PHASE_SECONDS + 2 });
assert.equal(s.phase, 'cover');

s = examClockReducer(s, { type: 'tick' });
assert.equal(s.readingRemainingSeconds, 2, 'cover does not tick');

s = examClockReducer(s, { type: 'begin' });
assert.equal(s.phase, 'reading');
s = examClockReducer(s, { type: 'tick' });
s = examClockReducer(s, { type: 'tick' });
assert.equal(s.phase, 'writing', 'reading time ends into writing');
assert.match(s.announcement, /start writing/);
assert.equal(s.timeRemainingSeconds, FINAL_PHASE_SECONDS + 2, 'writing clock untouched by reading time');

s = examClockReducer(s, { type: 'tick' });
s = examClockReducer(s, { type: 'tick' });
assert.equal(s.timeRemainingSeconds, FINAL_PHASE_SECONDS);
assert.equal(s.announcement, 'Five minutes remaining.');

s = { ...s, timeRemainingSeconds: 61 };
s = examClockReducer(s, { type: 'tick' });
assert.equal(s.announcement, 'One minute remaining.');

s = { ...s, timeRemainingSeconds: 1 };
s = examClockReducer(s, { type: 'tick' });
assert.equal(s.phase, 'pens-down');
assert.equal(s.timeRemainingSeconds, 0);
assert.equal(examClockReducer(s, { type: 'tick' }), s, 'pens down is terminal for ticks');

// No reading time: begin goes straight to writing
const noReading = examClockReducer(
  examClockReducer(initialExamClock, { type: 'load', readingSeconds: 0, writingSeconds: 60 }),
  { type: 'begin' }
);
assert.equal(noReading.phase, 'writing');

// Resume restores saved clocks
const resumed = examClockReducer(initialExamClock, { type: 'resume', phase: 'writing', readingSeconds: 0, writingSeconds: 1234 });
assert.deepEqual([resumed.phase, resumed.timeRemainingSeconds], ['writing', 1234]);

console.log('exam clock: all assertions passed');
