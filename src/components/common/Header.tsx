'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Compass, ChevronRight, ArrowRight, BookOpen } from 'lucide-react';
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
  const { hasFormulaBooklet, toggleFormulaBooklet, isFormulaBookletOpen } = useAppShell();


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
        className="pointer-events-auto w-full max-w-5xl bg-[#1f1e1b]/90 backdrop-blur-xl border border-white/10 shadow-[0_10px_32px_-6px_rgba(0,0,0,0.5)] rounded-full px-4 sm:px-6 h-14 flex items-center justify-between transition-fluid"
      >
        {/* Brand & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group focus-ring rounded-full p-1">
            <div className="w-7 h-7 rounded-full bg-[#252320] border border-white/10 flex items-center justify-center text-[#cc785c] group-hover:bg-[#2c2a26] transition-spring">
              <SpikeMark className="w-3.5 h-3.5 text-[#cc785c]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif-display text-base font-normal text-[#faf9f5] tracking-tight group-hover:text-[#cc785c] transition-fluid">
                Criterion
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono-code text-[#a09d95] tracking-wider uppercase">
                • Official Syllabus
              </span>
            </div>
          </Link>

          {/* Paper Breadcrumb if inside an active paper */}
          {paperTitle && (
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/10 text-xs">
              <ChevronRight className="w-3.5 h-3.5 text-[#a09d95]" />
              <span className="text-[#faf9f5] font-medium truncate max-w-xs" title={paperTitle}>
                {paperTitle}
              </span>
              {category && (
                <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded-full bg-[#252320] border border-white/10 text-[#a09d95] font-medium">
                  {category}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Middle Desktop Nav Links (when on home page or non-paper page) */}
        {!paperId && (
          <nav aria-label="Page navigation" className="hidden lg:flex items-center gap-6 text-xs text-[#a09d95] font-medium">
            <Link
              href="/#specimens-section"
              className="hover:text-[#faf9f5] transition-spring"
            >
              Past Papers
            </Link>
            <Link
              href="/ingest"
              className="hover:text-[#faf9f5] transition-spring"
            >
              Add Past Papers
            </Link>
            <Link
              href="/#history-section"
              className="hover:text-[#faf9f5] transition-spring"
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
                  : 'bg-[#181715] border-white/10 text-[#faf9f5]'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${isLowTime ? 'text-[#c64545]' : 'text-[#cc785c]'}`} />
              <span className="font-semibold">{formatTime(timeRemainingSeconds)}</span>
            </div>
          )}

          {paperId && (
            <div className="relative grid grid-cols-2 items-center bg-[#1f1e1b] p-0.5 rounded-full border border-white/10 text-xs font-medium overflow-hidden select-none">
              <span
                aria-hidden="true"
                className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full pointer-events-none backdrop-blur-md transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  mode === 'TIMED_MOCK'
                    ? 'translate-x-0 bg-gradient-to-r from-[#cc785c] to-[#d98266] text-white shadow-[0_2px_8px_rgba(204,120,92,0.3)]'
                    : 'translate-x-[calc(100%+2px)] bg-gradient-to-r from-[#252320] to-[#181715] border border-white/10'
                }`}
              />
              <Link
                href={`/mock/${paperId}`}
                className={`relative z-10 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full transition-colors duration-200 focus-ring active:scale-[0.98] ${
                  mode === 'TIMED_MOCK'
                    ? 'text-white font-semibold'
                    : 'text-[#a09d95] hover:text-[#faf9f5]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0 text-[#cc785c]" />
                <span className="whitespace-nowrap">Timed Exam</span>
              </Link>

              <Link
                href={`/learn/${paperId}`}
                className={`relative z-10 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full transition-colors duration-200 focus-ring active:scale-[0.98] ${
                  mode === 'SOCRATIC_LEARN'
                    ? 'text-[#faf9f5] font-semibold'
                    : 'text-[#a09d95] hover:text-[#faf9f5]'
                }`}
              >
                <Compass className="w-3.5 h-3.5 shrink-0 text-[#5db8a6]" />
                <span className="whitespace-nowrap">Guided Practice</span>
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
                  ? 'bg-[#cc785c] border-[#cc785c] text-white shadow-xs'
                  : 'border-white/10 bg-[#252320] hover:bg-[#2c2a26] text-[#faf9f5]'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${isFormulaBookletOpen ? 'text-white' : 'text-[#cc785c]'}`} />
              <span className="hidden sm:inline">Formula Booklet</span>
            </button>
          )}


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
