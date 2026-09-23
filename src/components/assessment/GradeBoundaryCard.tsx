import React from 'react';

interface GradeBoundaryCardProps {
  totalAwarded: number;
  totalPossible: number;
  percentage: number;
  predictedGrade: number; // 1 to 7
  boundaries: {
    grade7: number;
    grade6: number;
    grade5: number;
    grade4: number;
    grade3: number;
    grade2: number;
    grade1: number;
  };
  ecfCount: number;
}

const GRADE_DESCRIPTORS: Record<number, string> = {
  7: 'Excellent performance across the paper, with clear, fluent working and strong problem-solving under exam conditions.',
  6: 'Strong understanding throughout, with only minor calculation or precision slips. Methods and arguments are clearly developed.',
  5: 'A good grasp of standard questions, with occasional difficulty on unfamiliar or multi-step problems.',
  4: 'A sound grasp of the basics, with room to strengthen multi-step working.',
  3: 'Understanding is developing. Focus on core formulas and regular practice with standard question types.',
  2: 'Revisit the key formulas and step-by-step methods to build a foundation.',
  1: 'Most of the core syllabus needs revisiting.',
};

const GRADES = [7, 6, 5, 4, 3, 2, 1] as const;

/**
 * The report's verdict: the predicted grade, the marks behind it, and where it
 * sits in this paper's Grade Boundary table.
 */
export const GradeBoundaryCard: React.FC<GradeBoundaryCardProps> = ({
  totalAwarded,
  totalPossible,
  percentage,
  predictedGrade,
  boundaries,
  ecfCount,
}) => {
  const nextGrade = Math.min(7, predictedGrade + 1);
  const nextBoundary = predictedGrade < 7 ? boundaries[`grade${nextGrade}` as keyof typeof boundaries] : null;
  const marksToNext = nextBoundary ? Math.max(0, Math.ceil((nextBoundary / 100) * totalPossible) - totalAwarded) : 0;

  const ecfSentence =
    ecfCount > 0
      ? ` ${ecfCount === 1 ? 'One question was' : `${ecfCount} questions were`} credited under error carried forward.`
      : '';

  return (
    <section aria-labelledby="grade-heading" className="space-y-6">
      <h2 id="grade-heading" className="font-serif text-[30px] sm:text-[36px] font-semibold leading-tight text-ink">
        Predicted grade <span className="tabular">{predictedGrade}</span>
      </h2>

      <table className="w-full border-collapse tabular text-center">
        <caption className="text-left text-[13px] text-ink-muted pb-2">
          Grade boundaries for this paper, as a minimum percentage
        </caption>
        <thead>
          <tr className="border-t-2 border-b border-ink">
            {GRADES.map((g) => (
              <th
                key={g}
                scope="col"
                aria-current={g === predictedGrade ? 'true' : undefined}
                className={`py-3 font-serif font-semibold ${
                  g === predictedGrade ? 'bg-ink text-paper text-[28px] sm:text-[34px]' : 'text-ink text-[18px] sm:text-[20px]'
                }`}
              >
                {g}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-ink">
            {GRADES.map((g) => (
              <td
                key={g}
                className={`py-2 text-[14px] ${g === predictedGrade ? 'bg-paper-tint font-semibold text-ink' : 'text-ink-muted'}`}
              >
                {boundaries[`grade${g}` as keyof typeof boundaries]}%
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <p className="font-serif text-[18px] leading-relaxed text-ink max-w-[62ch]">
        You scored <span className="tabular font-semibold">{totalAwarded}</span> of{' '}
        <span className="tabular">{totalPossible}</span> marks (<span className="tabular">{percentage}%</span>).
        {nextBoundary !== null && marksToNext > 0 && (
          <>
            {' '}
            <span className="tabular font-semibold">{marksToNext}</span> more {marksToNext === 1 ? 'mark' : 'marks'} would
            have reached grade {nextGrade}.
          </>
        )}
        {ecfSentence}
      </p>
      <p className="text-[16px] leading-relaxed text-ink-muted max-w-[62ch]">
        {GRADE_DESCRIPTORS[predictedGrade] ?? GRADE_DESCRIPTORS[4]}
      </p>
    </section>
  );
};
