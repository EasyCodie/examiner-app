'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Compass, ChevronRight } from 'lucide-react';

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
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemainingSeconds !== undefined && timeRemainingSeconds < 600;

  return (
    <header
      aria-label="Global Examination Navigation"
      className="sticky top-0 z-40 w-full bg-[#0c0d0e] border-b border-white/[0.08] px-4 sm:px-6 h-12 flex items-center justify-between"
    >
      {/* Brand & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group focus-ring rounded-md p-0.5">
          <div className="w-5 h-5 rounded bg-[#f54e00] flex items-center justify-center text-white font-mono-code text-[10px] font-bold tracking-tight">
            IB
          </div>
          <span className="text-sm font-normal text-[#f3f3f2] tracking-tight group-hover:text-white transition">
            examiner
          </span>
        </Link>

        {/* Paper Breadcrumb if inside an active paper */}
        {paperTitle && (
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/[0.08] text-xs">
            <ChevronRight className="w-3.5 h-3.5 text-[#686763]" />
            <span className="text-[#9b9a95] truncate max-w-xs" title={paperTitle}>
              {paperTitle}
            </span>
            {category && (
              <span className="text-[10px] font-mono-code uppercase px-1.5 py-0.5 rounded bg-[#1a1b1e] border border-white/[0.08] text-[#9b9a95]">
                {category}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Middle & Right: Timer & Mode Controls */}
      <div className="flex items-center gap-2.5">
        {mode === 'TIMED_MOCK' && timeRemainingSeconds !== undefined && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono-code text-xs transition ${isLowTime
                ? 'bg-[#cf2d56]/15 border-[#cf2d56]/30 text-[#cf2d56] animate-pulse'
                : 'bg-[#141517] border-white/[0.08] text-[#f54e00]'
              }`}
          >
            <Clock className={`w-3 h-3 ${isLowTime ? 'text-[#cf2d56]' : 'text-[#f54e00]'}`} />
            <span className="font-semibold">{formatTime(timeRemainingSeconds)}</span>
          </div>
        )}

        {paperId && (
          <div className="flex items-center bg-[#141517] p-0.5 rounded-lg border border-white/[0.08] text-xs">
            <Link
              href={`/mock/${paperId}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition focus-ring ${mode === 'TIMED_MOCK'
                  ? 'bg-[#f54e00] text-white font-medium shadow-sm'
                  : 'text-[#9b9a95] hover:text-[#f3f3f2]'
                }`}
            >
              <Clock className="w-3 h-3" />
              <span>Timed Mock</span>
            </Link>

            <Link
              href={`/learn/${paperId}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition focus-ring ${mode === 'SOCRATIC_LEARN'
                  ? 'bg-[#222428] text-white font-medium shadow-sm'
                  : 'text-[#9b9a95] hover:text-[#f3f3f2]'
                }`}
            >
              <Compass className="w-3 h-3" />
              <span>Socratic Learn</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
