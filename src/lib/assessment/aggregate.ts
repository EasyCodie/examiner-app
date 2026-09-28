import type { ExamManifest, ExamSession, QuestionEvaluation } from '@/types/exam';

// Client-safe: no Gemini SDK or server-only imports. The results page and the evaluator both aggregate here.

export type GradingResults = NonNullable<ExamSession['gradingResults']>;

/**
 * Calculates official IB Grade (1 to 7) based on percentage score and paper grade boundaries.
 */
export function calculatePredictedGrade(scorePercentage: number, boundaries: ExamManifest['gradeBoundaries']): number {
  if (scorePercentage >= boundaries.grade7) return 7;
  if (scorePercentage >= boundaries.grade6) return 6;
  if (scorePercentage >= boundaries.grade5) return 5;
  if (scorePercentage >= boundaries.grade4) return 4;
  if (scorePercentage >= boundaries.grade3) return 3;
  if (scorePercentage >= boundaries.grade2) return 2;
  return 1;
}

/**
 * Synthesizes the Syllabus Weakness Matrix from question evaluations.
 */
export function synthesizeSyllabusBreakdown(evaluations: QuestionEvaluation[]): GradingResults['syllabusBreakdown'] {
  const syllabusMap: Record<
    string,
    { marksAwarded: number; totalMarks: number; recommendation: string }
  > = {};

  evaluations.forEach((ev) => {
    const key = ev.syllabusSubtopic || 'General Examination Syllabus';
    if (!syllabusMap[key]) {
      syllabusMap[key] = {
        marksAwarded: 0,
        totalMarks: 0,
        recommendation: ev.revisionRecommendation,
      };
    }
    syllabusMap[key].marksAwarded += ev.marksAwarded;
    syllabusMap[key].totalMarks += ev.maxMarks;
  });

  return Object.entries(syllabusMap).map(([subtopic, val]) => {
    const percentage = val.totalMarks > 0 ? Math.round((val.marksAwarded / val.totalMarks) * 100) : 0;
    const status =
      percentage >= 80 ? ('mastered' as const) : percentage >= 50 ? ('developing' as const) : ('critical' as const);

    return {
      subtopic,
      marksAwarded: val.marksAwarded,
      totalMarks: val.totalMarks,
      percentage,
      status,
      targetedDrillPrompt: val.recommendation,
    };
  });
}

/**
 * Paper-level grading results: totals, percentage, predicted grade and Syllabus Weakness Matrix.
 */
export function gradePaper(
  manifest: Pick<ExamManifest, 'totalMarks' | 'gradeBoundaries'>,
  evaluations: QuestionEvaluation[],
  thinkingBudget: number
): GradingResults {
  const totalMarksAwarded = evaluations.reduce((sum, e) => sum + e.marksAwarded, 0);
  const totalPossibleMarks = manifest.totalMarks || evaluations.reduce((sum, e) => sum + e.maxMarks, 0);
  const percentage = totalPossibleMarks > 0 ? Math.round((totalMarksAwarded / totalPossibleMarks) * 100) : 0;

  return {
    totalMarksAwarded,
    totalPossibleMarks,
    percentage,
    predictedGrade: calculatePredictedGrade(percentage, manifest.gradeBoundaries),
    reasoningEffortUsed: thinkingBudget >= 4096 ? 'high' : 'minimal',
    evaluations,
    syllabusBreakdown: synthesizeSyllabusBreakdown(evaluations),
  };
}
