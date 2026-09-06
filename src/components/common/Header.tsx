'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Compass, ChevronRight, Sliders, ArrowRight, BookOpen } from 'lucide-react';
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
  const { openAiStudio, hasFormulaBooklet, toggleFormulaBooklet, isFormulaBookletOpen } = useAppShell();


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemainingSeconds !== undefined && timeRemainingSeconds < 600;

  return (
    <div className="sticky top-2.5 sm:top-4 z-40 w-full px-3 sm:px-6 pointer-events-none flex justify-center">
      <header
        aria-label="Global Examination Navigation"
        className="pointer-events-auto w-full max-w-5xl bg-[#faf9f5]/92 backdrop-blur-xl border border-[#141413]/[0.08] shadow-[0_10px_32px_-6px_rgba(20,20,19,0.08)] rounded-full px-4 sm:px-6 h-14 flex items-center justify-between transition-fluid"
      >
        {/* Brand & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group focus-ring rounded-full p-1">
            <div className="w-7 h-7 rounded-full bg-[#efe9de] border border-[#e6dfd8] flex items-center justify-center text-[#a94e32] group-hover:bg-[#e8e0d2] transition-spring">
              <SpikeMark className="w-3.5 h-3.5 text-[#a94e32]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif-display text-base font-normal text-[#141413] tracking-tight group-hover:text-[#a94e32] transition-fluid">
                IB Examiner
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono-code text-[#54524c] tracking-wider uppercase">
                • Official Syllabus
              </span>
            </div>
          </Link>

          {/* Paper Breadcrumb if inside an active paper */}
          {paperTitle && (
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[#e6dfd8] text-xs">
              <ChevronRight className="w-3.5 h-3.5 text-[#54524c]" />
              <span className="text-[#3d3d3a] font-medium truncate max-w-xs" title={paperTitle}>
                {paperTitle}
              </span>
              {category && (
                <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded-full bg-[#efe9de] border border-[#e6dfd8] text-[#54524c] font-medium">
                  {category}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Middle Desktop Nav Links (when on home page or non-paper page) */}
        {!paperId && (
          <nav aria-label="Page navigation" className="hidden lg:flex items-center gap-6 text-xs text-[#54524c] font-medium">
            <Link
              href="/#specimens-section"
              className="hover:text-[#141413] transition-spring"
            >
              Past Papers
            </Link>
            <Link
              href="/ingest"
              className="hover:text-[#141413] transition-spring"
            >
              Add Past Papers
            </Link>
            <Link
              href="/#history-section"
              className="hover:text-[#141413] transition-spring"
            >
              Past Attempts
            </Link>
          </nav>
        )}

        {/* Middle & Right: Timer, Mode Controls & Telemetry Trigger */}
        <div className="flex items-center gap-2.5">
          {mode === 'TIMED_MOCK' && timeRemainingSeconds !== undefined && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono-code text-xs transition ${
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
            <div className="flex items-center bg-[#efe9de] p-0.5 rounded-full border border-[#e6dfd8] text-xs font-medium">
              <Link
                href={`/mock/${paperId}`}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-fluid focus-ring active:scale-[0.98] ${
                  mode === 'TIMED_MOCK'
                    ? 'bg-[#a94e32] text-white shadow-xs font-semibold'
                    : 'text-[#54524c] hover:text-[#141413]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Timed Exam</span>
              </Link>

              <Link
                href={`/learn/${paperId}`}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-fluid focus-ring active:scale-[0.98] ${
                  mode === 'SOCRATIC_LEARN'
                    ? 'bg-[#181715] text-[#faf9f5] shadow-xs font-semibold'
                    : 'text-[#54524c] hover:text-[#141413]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Guided Practice</span>
              </Link>
            </div>
          )}

          {/* Official IB Formula Booklet Trigger (when applicable) */}
          {hasFormulaBooklet && (
            <button
              type="button"
              onClick={() => toggleFormulaBooklet()}
              title="Official IB Formula Booklet (Ctrl+B)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-spring active:scale-[0.98] ${
                isFormulaBookletOpen
                  ? 'bg-[#a94e32] border-[#a94e32] text-white shadow-xs'
                  : 'border-[#e6dfd8] bg-[#faf9f5] hover:bg-[#f5f0e8] text-[#3d3d3a] hover:text-[#141413]'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${isFormulaBookletOpen ? 'text-white' : 'text-[#a94e32]'}`} />
              <span className="hidden sm:inline">Formula Booklet</span>
            </button>
          )}

          {/* Telemetry / Settings Workbench Trigger */}
          <button
            type="button"
            onClick={openAiStudio}
            title="Examiner Settings & AI Controls"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#e6dfd8] bg-[#faf9f5] hover:bg-[#f5f0e8] text-[#3d3d3a] hover:text-[#141413] text-xs font-medium transition-spring active:scale-[0.98]"
          >
            <Sliders className="w-3.5 h-3.5 text-[#a94e32]" />
            <span>Settings & AI</span>
          </button>

          {/* Primary Action Button (Button-in-Button CTA) */}
          {!paperId && (
            <Link
              href="/mock/math-aa-hl-may-2021"
              className="claude-btn-pill-primary text-xs h-9 pl-4 pr-1.5 py-0 gap-2"
            >
              <span>Start Practice Exam</span>
              <span className="btn-icon-bubble w-6 h-6">
                <ArrowRight className="w-3 h-3 text-white" />
              </span>
            </Link>
          )}
        </div>
      </header>
    </div>
  );
};
