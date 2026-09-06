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
    title: 'Grade 7 — Exceptional Mastery',
    color: 'from-amber-400 to-amber-600',
    desc: 'Demonstrates comprehensive understanding of syllabus concepts, impeccable mathematical/economic arguments, and fluent problem-solving under authentic timed constraints.',
  },
  6: {
    title: 'Grade 6 — Very Good Understanding',
    color: 'from-emerald-400 to-emerald-600',
    desc: 'Shows deep comprehension with minor arithmetic or precision slips. Analytical arguments and method structures are thoroughly developed.',
  },
  5: {
    title: 'Grade 5 — Good Competence',
    color: 'from-blue-400 to-blue-600',
    desc: 'Demonstrates consistent familiarity with standard questions; occasional difficulty applying theory to non-routine or extended multi-step problems.',
  },
  4: {
    title: 'Grade 4 — Satisfactory Standard',
    color: 'from-cyan-400 to-cyan-600',
    desc: 'Pass mark standard. Basic knowledge of core syllabus algorithms; needs targeted reinforcement in multi-stage algebraic derivations.',
  },
  3: {
    title: 'Grade 3 — Developing Knowledge',
    color: 'from-orange-400 to-orange-600',
    desc: 'Inconsistent grasp of fundamental syllabus definitions. Focus on routine drills and formula booklet memorization.',
  },
  2: {
    title: 'Grade 2 — Emergent Understanding',
    color: 'from-rose-400 to-rose-600',
    desc: 'Limited recall of core methods. Foundational revision of prerequisite algebra and functions strongly recommended.',
  },
  1: {
    title: 'Grade 1 — Minimal Achievement',
    color: 'from-rose-600 to-rose-800',
    desc: 'Very limited demonstration of syllabus criteria.',
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
    <div className="bg-[#141517] border border-white/[0.08] rounded-xl p-5 relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
        {/* Grade Badge */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[#f54e00] flex flex-col items-center justify-center shrink-0 text-white shadow-sm">
            <span className="text-[10px] font-mono-code uppercase tracking-wider font-semibold opacity-85">
              IB GRADE
            </span>
            <span className="text-3xl font-semibold font-mono-code">
              {predictedGrade}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-normal text-[#f3f3f2] tracking-tight">{descriptor.title}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-[#1a1b1e] text-[#9b9a95] border border-white/[0.08]">
                Official 1–7 Scale
              </span>
            </div>
            <p className="text-xs text-[#9b9a95] max-w-xl mt-1 leading-relaxed">
              {descriptor.desc}
            </p>
          </div>
        </div>

        {/* Score Stats */}
        <div className="flex items-center gap-4 bg-[#0c0d0e] border border-white/[0.08] px-4 py-3 rounded-lg">
          <div className="text-center pr-4 border-r border-white/[0.08]">
            <span className="text-[10px] font-mono-code text-[#686763] block uppercase">Score</span>
            <div className="text-xl font-medium font-mono-code text-[#f3f3f2]">
              {totalAwarded} <span className="text-xs text-[#686763]">/ {totalPossible}</span>
            </div>
          </div>

          <div className="text-center pr-4 border-r border-white/[0.08]">
            <span className="text-[10px] font-mono-code text-[#686763] block uppercase">Percentage</span>
            <div className="text-xl font-medium font-mono-code text-[#f54e00]">
              {percentage}%
            </div>
          </div>

          {ecfCount > 0 && (
            <div className="text-center">
              <span className="text-[10px] font-mono-code text-[#dfa88f] block uppercase flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" /> ECF
              </span>
              <div className="text-lg font-medium font-mono-code text-[#dfa88f]">
                {ecfCount} <span className="text-xs text-[#686763]">applied</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress to next boundary */}
      {nextBoundary && marksToNext > 0 && (
        <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#9b9a95]">
            <TrendingUp className="w-3.5 h-3.5 text-[#9fc9a2]" />
            <span>
              Targeting <strong className="text-[#f3f3f2]">Grade {nextGrade}</strong> ({nextBoundary}%):
              Need <strong className="text-[#f54e00] font-mono-code">+{marksToNext} mark{marksToNext > 1 ? 's' : ''}</strong>.
            </span>
          </div>

          {/* Mini boundary scale */}
          <div className="flex items-center gap-1 font-mono-code text-[10px] text-[#686763]">
            <span>G4: {boundaries.grade4}%</span>
            <span>•</span>
            <span>G5: {boundaries.grade5}%</span>
            <span>•</span>
            <span>G6: {boundaries.grade6}%</span>
            <span>•</span>
            <span className="text-[#f54e00] font-semibold">G7: {boundaries.grade7}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
