'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Compass, ChevronRight, Sliders } from 'lucide-react';
import { SpikeMark } from './SpikeMark';
import { useAppShell } from './AppShell';

interface HeaderProps {
  paperTitle?: string;
  category?: 'STEM' | 'HUMANITIES';
  mode?: 'TIMED_MOCK' | 'SOCRATIC_LEARN';
  paperId?: string;
  timeRemainingSeconds?: number;
}

export const Header: React.FC<HeaderProps> = ({
  paperTitle,
  category,
  mode,
  paperId,
  timeRemainingSeconds,
}) => {
  const { openAiStudio } = useAppShell();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemainingSeconds !== undefined && timeRemainingSeconds < 600;

  return (
    <header
      aria-label="Global Examination Navigation"
      className="sticky top-0 z-40 w-full bg-[#faf9f5] border-b border-[#e6dfd8] px-4 sm:px-8 h-16 flex items-center justify-between transition-colors"
    >
      {/* Brand & Breadcrumbs */}
      <div className="flex items-center gap-3.5">
        <Link href="/" className="flex items-center gap-2.5 group focus-ring rounded-lg p-1">
          <div className="w-7 h-7 rounded-lg bg-[#efe9de] border border-[#e6dfd8] flex items-center justify-center text-[#cc785c] group-hover:bg-[#e8e0d2] transition">
            <SpikeMark className="w-4 h-4 text-[#cc785c]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif-display text-lg font-medium text-[#141413] tracking-tight group-hover:text-[#cc785c] transition">
              IB Examiner
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono-code text-[#8e8b82] tracking-wider uppercase">
              • Official Syllabus
            </span>
          </div>
        </Link>

        {/* Paper Breadcrumb if inside an active paper */}
        {paperTitle && (
          <div className="hidden md:flex items-center gap-2 pl-3.5 border-l border-[#e6dfd8] text-xs">
            <ChevronRight className="w-3.5 h-3.5 text-[#8e8b82]" />
            <span className="text-[#3d3d3a] font-medium truncate max-w-xs" title={paperTitle}>
              {paperTitle}
            </span>
            {category && (
              <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded-full bg-[#efe9de] border border-[#e6dfd8] text-[#6c6a64] font-medium">
                {category}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Middle Desktop Nav Links (when on home page or non-paper page) */}
      {!paperId && (
        <nav aria-label="Page navigation" className="hidden lg:flex items-center gap-6 text-xs text-[#6c6a64] font-medium">
          <Link
            href="/#specimens-section"
            className="hover:text-[#141413] transition"
          >
            Past Papers
          </Link>
          <Link
            href="/ingest"
            className="hover:text-[#141413] transition"
          >
            Add Past Papers
          </Link>
          <Link
            href="/#history-section"
            className="hover:text-[#141413] transition"
          >
            Past Attempts
          </Link>
        </nav>
      )}

      {/* Middle & Right: Timer, Mode Controls & Telemetry Trigger */}
      <div className="flex items-center gap-3">
        {mode === 'TIMED_MOCK' && timeRemainingSeconds !== undefined && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono-code text-xs transition ${
              isLowTime
                ? 'bg-[#c64545]/10 border-[#c64545]/30 text-[#c64545] animate-pulse font-bold'
                : 'bg-[#181715] border-black/20 text-[#faf9f5]'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${isLowTime ? 'text-[#c64545]' : 'text-[#cc785c]'}`} />
            <span className="font-semibold">{formatTime(timeRemainingSeconds)}</span>
          </div>
        )}

        {paperId && (
          <div className="flex items-center bg-[#efe9de] p-1 rounded-lg border border-[#e6dfd8] text-xs font-medium">
            <Link
              href={`/mock/${paperId}`}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition focus-ring active:scale-[0.98] ${
                mode === 'TIMED_MOCK'
                  ? 'bg-[#cc785c] text-white shadow-sm font-semibold'
                  : 'text-[#6c6a64] hover:text-[#141413]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timed Exam</span>
            </Link>

            <Link
              href={`/learn/${paperId}`}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition focus-ring active:scale-[0.98] ${
                mode === 'SOCRATIC_LEARN'
                  ? 'bg-[#181715] text-[#faf9f5] shadow-sm font-semibold'
                  : 'text-[#6c6a64] hover:text-[#141413]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Guided Practice</span>
            </Link>
          </div>
        )}

        {/* Telemetry Workbench Trigger */}
        <button
          type="button"
          onClick={openAiStudio}
          title="Examiner Settings & AI Controls"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e6dfd8] bg-[#faf9f5] hover:bg-[#f5f0e8] text-[#3d3d3a] hover:text-[#141413] text-xs font-medium transition active:scale-[0.98]"
        >
          <Sliders className="w-3.5 h-3.5 text-[#cc785c]" />
          <span>Settings & AI</span>
        </button>

        {/* Primary Action Button */}
        {!paperId && (
          <Link
            href="/mock/math-aa-hl-may-2021"
            className="claude-btn-primary text-xs"
          >
            <span>Start Practice Exam</span>
          </Link>
        )}
      </div>
    </header>
  );
};
