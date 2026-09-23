'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Menu, X } from 'lucide-react';
import { CriterionMark } from './CriterionMark';
import { useAppShell } from './AppShell';

interface HeaderProps {
  paperTitle?: string;
  category?: 'STEM' | 'HUMANITIES';
  mode?: 'TIMED_MOCK' | 'SOCRATIC_LEARN';
  paperId?: string;
  timeRemainingSeconds?: number;
}

const NAV = [
  { href: '/#papers', label: 'Papers' },
  { href: '/ingest', label: 'Add a paper' },
  { href: '/#sessions', label: 'Past sessions' },
];

export const Header: React.FC<HeaderProps> = ({ paperTitle, mode, paperId }) => {
  const { hasFormulaBooklet, toggleFormulaBooklet, isFormulaBookletOpen } = useAppShell();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const segment = (active: boolean) =>
    `min-h-11 px-3 flex items-center text-[14px] font-medium border-r border-shell-line last:border-r-0 transition-colors ${
      active ? 'bg-paper text-ink' : 'text-shell-muted hover:text-shell-ink'
    }`;

  return (
    <header className="shell-surface sticky top-0 z-40 bg-shell border-b border-shell-line">
      <div className="mx-auto max-w-[1440px] h-14 px-3 sm:px-5 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 min-h-11 px-1 text-shell-ink shrink-0">
          <CriterionMark className="w-5 h-5" />
          <span className="font-sans text-[15px] font-semibold tracking-tight">Criterion</span>
        </Link>

        {paperTitle && (
          <>
            <span className="hidden md:block h-5 w-px bg-shell-line" aria-hidden="true" />
            <span className="hidden md:block truncate text-[14px] text-shell-muted max-w-[32ch]" title={paperTitle}>
              {paperTitle}
            </span>
          </>
        )}

        {!paperId && (
          <nav aria-label="Main" className="hidden lg:flex items-center gap-1 ml-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                className="min-h-11 px-3 flex items-center text-[14px] font-medium text-shell-muted hover:text-shell-ink aria-[current=page]:text-shell-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          {paperId && (
            <div role="group" aria-label="Mode" className="flex border border-shell-line">
              <Link
                href={`/mock/${paperId}`}
                aria-current={mode === 'TIMED_MOCK' ? 'page' : undefined}
                className={segment(mode === 'TIMED_MOCK')}
              >
                <span className="sm:hidden">Timed</span>
                <span className="hidden sm:inline">Timed exam</span>
              </Link>
              <Link
                href={`/learn/${paperId}`}
                aria-current={mode === 'SOCRATIC_LEARN' ? 'page' : undefined}
                className={segment(mode === 'SOCRATIC_LEARN')}
              >
                <span className="sm:hidden">Guided</span>
                <span className="hidden sm:inline">Guided practice</span>
              </Link>
            </div>
          )}

          {hasFormulaBooklet && (
            <button
              type="button"
              onClick={() => toggleFormulaBooklet()}
              aria-pressed={isFormulaBookletOpen}
              title="Formula booklet (Ctrl+B)"
              className="btn btn-sm btn-quiet-shell"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span className="hidden xl:inline">Formula booklet</span>
              <span className="sr-only xl:hidden">Formula booklet</span>
            </button>
          )}

          {!paperId && pathname !== '/ingest' && (
            <Link href="/#papers" className="hidden sm:inline-flex btn btn-sm btn-slip">
              Sit a paper
            </Link>
          )}

          {!paperId && (
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="lg:hidden min-h-11 min-w-11 flex items-center justify-center text-shell-ink"
            >
              {menuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
              <span className="sr-only">Menu</span>
            </button>
          )}
        </div>
      </div>

      {!paperId && menuOpen && (
        <nav id="mobile-nav" aria-label="Main" className="lg:hidden border-t border-shell-line">
          <ul className="mx-auto max-w-[1440px] px-3 sm:px-5 py-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="min-h-12 flex items-center text-[16px] text-shell-ink border-b border-shell-line last:border-b-0"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
};
