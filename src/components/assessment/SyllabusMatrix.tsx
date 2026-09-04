'use client';

import React from 'react';
import Link from 'next/link';
import { Target, AlertCircle, CheckCircle2, BookOpen, ArrowRight } from 'lucide-react';

interface SyllabusBreakdownItem {
  subtopic: string;
  marksAwarded: number;
  totalMarks: number;
  percentage: number;
  status: 'mastered' | 'developing' | 'critical';
  targetedDrillPrompt: string;
}

interface SyllabusMatrixProps {
  syllabusBreakdown: SyllabusBreakdownItem[];
  paperId?: string;
}

export const SyllabusMatrix: React.FC<SyllabusMatrixProps> = ({ syllabusBreakdown, paperId }) => {
  return (
    <div className="bg-[#141517] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08] mb-6">
        <div>
          <h3 className="text-base font-normal text-[#f3f3f2] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#f54e00]" />
            Syllabus Subtopic Weakness Matrix &amp; Actionable Drills
          </h3>
          <p className="text-xs text-[#9b9a95] mt-0.5 font-mono-code">
            Examiner-grade diagnosis mapping points awarded to official IB curriculum subtopics
          </p>
        </div>
        <span className="text-xs font-mono-code text-[#9b9a95] bg-[#0c0d0e] px-3 py-1 rounded-lg border border-white/[0.08]">
          {syllabusBreakdown.length} Topics Assessed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {syllabusBreakdown.map((item, idx) => {
          const statusStyles = {
            mastered: {
              badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
              bar: 'bg-emerald-500',
              label: 'Mastered (Level 7)',
              icon: CheckCircle2,
            },
            developing: {
              badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
              bar: 'bg-amber-500',
              label: 'Developing (Level 5-6)',
              icon: AlertCircle,
            },
            critical: {
              badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
              bar: 'bg-[#cf2d56]',
              label: 'Critical Revision Needed',
              icon: AlertCircle,
            },
          }[item.status];

          const Icon = statusStyles.icon;

          return (
            <div
              key={idx}
              className="bg-[#0c0d0e] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="text-xs font-semibold text-[#f3f3f2] font-mono-code leading-snug">
                    {item.subtopic}
                  </h4>
                  <span
                    className={`text-[10px] font-mono-code px-2 py-0.5 rounded-full border shrink-0 flex items-center gap-1 ${statusStyles.badge}`}
                  >
                    <Icon className="w-3 h-3" />
                    {statusStyles.label}
                  </span>
                </div>

                {/* Score and Bar */}
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-[11px] font-mono-code text-[#9b9a95]">
                    <span>
                      Score: <strong className="text-white">{item.marksAwarded}</strong> / {item.totalMarks} marks
                    </span>
                    <span className="font-semibold text-white">{item.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${statusStyles.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actionable Drill Recommendation */}
              <div className="p-3 rounded-lg bg-[#141517] border border-white/[0.06] text-[11px] text-[#d6d5d1] leading-relaxed">
                <span className="font-semibold text-[#f54e00] block mb-1 flex items-center gap-1 font-mono-code">
                  <BookOpen className="w-3 h-3" /> Targeted Practice Drill:
                </span>
                <p className="line-clamp-2 text-[#9b9a95]">{item.targetedDrillPrompt}</p>

                {paperId && item.status !== 'mastered' && (
                  <Link
                    href={`/learn/${paperId}`}
                    className="inline-flex items-center gap-1 text-[11px] font-mono-code text-[#f54e00] hover:text-[#ff6a24] mt-2 font-medium transition"
                  >
                    <span>Launch Targeted Socratic Practice</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
