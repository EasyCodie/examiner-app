'use client';

import React from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';

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

const GRADE_DESCRIPTORS: Record<number, { title: string; color: string; desc: string }> = {
  7: {
    title: 'Grade 7: Exceptional Mastery',
    color: 'from-amber-400 to-amber-600',
    desc: 'Exceptional performance across all concepts, with clear, fluent working and strong problem-solving under exam conditions.',
  },
  6: {
    title: 'Grade 6: Very Good Understanding',
    color: 'from-emerald-400 to-emerald-600',
    desc: 'Strong understanding throughout, with only minor calculation or precision slips. Methods and arguments are clearly developed.',
  },
  5: {
    title: 'Grade 5: Good Competence',
    color: 'from-blue-400 to-blue-600',
    desc: 'Good grasp of standard questions, with occasional difficulty on unfamiliar or multi-step problems.',
  },
  4: {
    title: 'Grade 4: Satisfactory Standard',
    color: 'from-cyan-400 to-cyan-600',
    desc: 'Meets the standard pass requirements. Sound grasp of the basics, with room to strengthen multi-step working.',
  },
  3: {
    title: 'Grade 3: Developing Knowledge',
    color: 'from-orange-400 to-orange-600',
    desc: 'Developing understanding. Focus on core formulas and regular practice with standard question types.',
  },
  2: {
    title: 'Grade 2: Emergent Understanding',
    color: 'from-rose-400 to-rose-600',
    desc: 'Needs foundational review. Revisiting key formulas and step-by-step methods will help build confidence.',
  },
  1: {
    title: 'Grade 1: Minimal Achievement',
    color: 'from-rose-600 to-rose-800',
    desc: 'Needs substantial review across core syllabus topics.',
  },
};

export const GradeBoundaryCard: React.FC<GradeBoundaryCardProps> = ({
  totalAwarded,
  totalPossible,
  percentage,
  predictedGrade,
  boundaries,
  ecfCount,
}) => {
  const descriptor = GRADE_DESCRIPTORS[predictedGrade] || GRADE_DESCRIPTORS[4];

  // Next grade boundary calculation
  const nextGrade = Math.min(7, predictedGrade + 1);
  const nextBoundary = predictedGrade < 7 ? boundaries[`grade${nextGrade}` as keyof typeof boundaries] : null;
  const marksToNext = nextBoundary ? Math.max(0, Math.ceil((nextBoundary / 100) * totalPossible) - totalAwarded) : 0;

  return (
    <div className="double-bezel-outer-dark">
      <div className="double-bezel-inner-dark p-6 sm:p-8 relative overflow-hidden">
        {/* Ambient subtle glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#cc785c]/[0.08] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          {/* Grade Badge */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#cc785c] to-[#a9583e] flex flex-col items-center justify-center shrink-0 text-white shadow-[0_8px_20px_-4px_rgba(204,120,92,0.4)] border border-white/20">
              <span className="text-[9px] font-mono-code uppercase tracking-wider font-semibold opacity-90">
                IB GRADE
              </span>
              <span className="text-3xl font-semibold font-mono-code">
                {predictedGrade}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#faf9f5] tracking-tight">{descriptor.title}</h2>
                <span className="eyebrow-pill bg-[#252320] text-[#a09d96] border border-white/10 px-2.5 py-0.5">
                  Official 1-7 Scale
                </span>
              </div>
              <p className="text-xs text-[#a09d96] max-w-xl mt-1 leading-relaxed">
                {descriptor.desc}
              </p>
            </div>
          </div>

          {/* Score Stats */}
          <div className="flex items-center gap-4 bg-[#141413] border border-white/10 px-5 py-3 rounded-2xl shadow-inner">
            <div className="text-center pr-4 border-r border-white/10">
              <span className="text-[10px] font-mono-code text-[#a09d96] block uppercase">Score</span>
              <div className="text-xl font-medium font-mono-code text-[#faf9f5]">
                {totalAwarded} <span className="text-xs text-[#a09d96]">/ {totalPossible}</span>
              </div>
            </div>

            <div className="text-center pr-4 border-r border-white/10">
              <span className="text-[10px] font-mono-code text-[#a09d96] block uppercase">Percentage</span>
              <div className="text-xl font-medium font-mono-code text-[#cc785c]">
                {percentage}%
              </div>
            </div>

            {ecfCount > 0 && (
              <div className="text-center">
                <span className="text-[10px] font-mono-code text-[#e8a55a] block uppercase flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" /> ECF
                </span>
                <div className="text-lg font-medium font-mono-code text-[#e8a55a]">
                  {ecfCount} <span className="text-xs text-[#a09d96]">protected</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress to next boundary */}
        {nextBoundary && marksToNext > 0 && (
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs relative z-10">
            <div className="flex items-center gap-2 text-[#a09d96]">
              <TrendingUp className="w-3.5 h-3.5 text-[#5db8a6]" />
              <span>
                To reach <strong className="text-[#faf9f5]">Grade {nextGrade}</strong> ({nextBoundary}%):
                You need <strong className="text-[#cc785c] font-mono-code">{marksToNext} more mark{marksToNext > 1 ? 's' : ''}</strong>.
              </span>
            </div>

            {/* Mini boundary scale */}
            <div className="flex items-center gap-1.5 font-mono-code text-[10px] text-[#a09d96]">
              <span>G4: {boundaries.grade4}%</span>
              <span>•</span>
              <span>G5: {boundaries.grade5}%</span>
              <span>•</span>
              <span>G6: {boundaries.grade6}%</span>
              <span>•</span>
              <span className="text-[#cc785c] font-semibold">G7: {boundaries.grade7}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
