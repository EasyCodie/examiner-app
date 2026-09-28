/**
 * Deep Module: the Exam Session clock as a pure state machine.
 * cover → reading time → writing → pens down, with the spoken warnings a
 * candidate hears in an exam hall. The page only dispatches ticks.
 */

export type ClockPhase = 'cover' | 'reading' | 'writing' | 'pens-down';

export interface ExamClockState {
  phase: ClockPhase;
  readingRemainingSeconds: number;
  timeRemainingSeconds: number;
  announcement: string;
}

export type ExamClockAction =
  | { type: 'load'; readingSeconds: number; writingSeconds: number }
  | { type: 'begin' }
  | { type: 'resume'; phase: 'reading' | 'writing'; readingSeconds: number; writingSeconds: number }
  | { type: 'tick' }
  | { type: 'close' };

export const FINAL_PHASE_SECONDS = 5 * 60;

export const initialExamClock: ExamClockState = {
  phase: 'cover',
  readingRemainingSeconds: 0,
  timeRemainingSeconds: 0,
  announcement: '',
};

export function examClockReducer(state: ExamClockState, action: ExamClockAction): ExamClockState {
  switch (action.type) {
    case 'load':
      return {
        ...initialExamClock,
        readingRemainingSeconds: action.readingSeconds,
        timeRemainingSeconds: action.writingSeconds,
      };

    case 'begin':
      return state.readingRemainingSeconds > 0
        ? { ...state, phase: 'reading', announcement: 'Reading time has started. You can read the paper but not write.' }
        : { ...state, phase: 'writing', announcement: 'Writing time has started.' };

    case 'resume':
      return {
        phase: action.phase,
        readingRemainingSeconds: action.readingSeconds,
        timeRemainingSeconds: action.writingSeconds,
        announcement: 'Session resumed.',
      };

    case 'tick': {
      if (state.phase === 'reading') {
        const reading = Math.max(0, state.readingRemainingSeconds - 1);
        return reading === 0
          ? { ...state, readingRemainingSeconds: 0, phase: 'writing', announcement: 'Reading time is over. You may start writing.' }
          : { ...state, readingRemainingSeconds: reading };
      }
      if (state.phase === 'writing') {
        const remaining = Math.max(0, state.timeRemainingSeconds - 1);
        if (remaining === 0) {
          return { ...state, timeRemainingSeconds: 0, phase: 'pens-down', announcement: 'Pens down. Your script is being handed in.' };
        }
        const announcement =
          remaining === FINAL_PHASE_SECONDS
            ? 'Five minutes remaining.'
            : remaining === 60
              ? 'One minute remaining.'
              : state.announcement;
        return { ...state, timeRemainingSeconds: remaining, announcement };
      }
      return state;
    }

    case 'close':
      return { ...state, phase: 'cover' };

    default:
      return state;
  }
}
