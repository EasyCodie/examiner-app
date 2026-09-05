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
      className="sticky top-0 z-40 w-full bg-[var(--cursor-canvas)] border-b border-white/[0.08] px-4 sm:px-6 h-12 flex items-center justify-between"
    >
      {/* Brand & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group focus-ring rounded-md p-0.5">
          <div className="w-5 h-5 rounded bg-[var(--cursor-primary)] flex items-center justify-center text-white font-mono-code text-[10px] font-bold tracking-tight shadow-sm">
            IB
          </div>
          <span className="text-sm font-normal text-[var(--cursor-text-strong)] tracking-tight group-hover:text-white transition">
            examiner
          </span>
        </Link>

        {/* Paper Breadcrumb if inside an active paper */}
        {paperTitle && (
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/[0.08] text-xs">
            <ChevronRight className="w-3.5 h-3.5 text-[var(--cursor-text-muted)]" />
            <span className="text-[var(--cursor-text-body)] truncate max-w-xs" title={paperTitle}>
              {paperTitle}
            </span>
            {category && (
              <span className="text-[10px] font-mono-code uppercase px-1.5 py-0.5 rounded bg-[var(--cursor-surface-card)] border border-white/[0.08] text-[var(--cursor-text-body)]">
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
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono-code text-xs transition ${
              isLowTime
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 animate-pulse'
                : 'bg-[var(--cursor-canvas-soft)] border-white/[0.08] text-[var(--cursor-primary)]'
            }`}
          >
            <Clock className={`w-3 h-3 ${isLowTime ? 'text-rose-400' : 'text-[var(--cursor-primary)]'}`} />
            <span className="font-semibold">{formatTime(timeRemainingSeconds)}</span>
          </div>
        )}

        {paperId && (
          <div className="flex items-center bg-[var(--cursor-canvas-soft)] p-0.5 rounded-lg border border-white/[0.08] text-xs">
            <Link
              href={`/mock/${paperId}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition focus-ring ${
                mode === 'TIMED_MOCK'
                  ? 'bg-[var(--cursor-primary)] text-white font-medium shadow-sm'
                  : 'text-[var(--cursor-text-body)] hover:text-[var(--cursor-text-strong)]'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Timed Mock</span>
            </Link>

            <Link
              href={`/learn/${paperId}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition focus-ring ${
                mode === 'SOCRATIC_LEARN'
                  ? 'bg-[var(--cursor-surface-strong)] text-[var(--diplomatic-azure)] font-medium shadow-sm border border-[var(--diplomatic-azure)]/30'
                  : 'text-[var(--cursor-text-body)] hover:text-[var(--cursor-text-strong)]'
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
