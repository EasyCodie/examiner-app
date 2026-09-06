'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  Copy,
  Check,
} from 'lucide-react';
import {
  getFormulaBooklet,
  getAllFormulas,
  findFormulaAnchor,
  FormulaItem,
  FormulaBooklet,
} from '@/lib/data/formulaBooklets';
import { MathRenderer } from '@/components/common/MathRenderer';

interface FormulaBookletDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  subjectCode?: string;
  paperTitle?: string;
  targetAnchor?: string | null;
  onAnchorHandled?: () => void;
}

export const FormulaBookletDrawer: React.FC<FormulaBookletDrawerProps> = ({
  isOpen,
  onClose,
  subjectCode,
  paperTitle,
  targetAnchor,
  onAnchorHandled,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<number | 'all'>('all');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Resolve the booklet for current subject
  const booklet: FormulaBooklet | null = useMemo(() => {
    return getFormulaBooklet(subjectCode, paperTitle);
  }, [subjectCode, paperTitle]);

  // All flattened formulas
  const allFormulas = useMemo(() => {
    return booklet ? getAllFormulas(booklet) : [];
  }, [booklet]);

  // Filter formulas based on search query and selected topic
  const filteredFormulas = useMemo(() => {
    if (!booklet) return [];

    let list = allFormulas;

    // Filter by topic tab
    if (selectedTopic !== 'all') {
      list = list.filter((f) => f.topicNumber === selectedTopic);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((f) => {
        return (
          f.code.toLowerCase().includes(q) ||
          f.title.toLowerCase().includes(q) ||
          f.latex.toLowerCase().includes(q) ||
          f.keywords.some((k) => k.toLowerCase().includes(q)) ||
          (f.variablesDescription && f.variablesDescription.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [booklet, allFormulas, selectedTopic, searchQuery]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle targetAnchor navigation & auto-scroll (e.g. from Socratic Tier 2)
  useEffect(() => {
    if (!isOpen || !targetAnchor || !booklet) return;

    const matchedItem = findFormulaAnchor(booklet, targetAnchor);
    if (!matchedItem) return;

    // Reset filters and scroll to target within a frame to prevent cascading render in effect
    const timer = setTimeout(() => {
      setSearchQuery('');
      setSelectedTopic('all');
      setHighlightedId(matchedItem.id);

      const el = document.getElementById(matchedItem.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (onAnchorHandled) {
        onAnchorHandled();
      }
    }, 50);

    // Auto-clear pulsating highlight after 3.5 seconds
    const clearPulse = setTimeout(() => {
      setHighlightedId((current) => (current === matchedItem.id ? null : current));
    }, 3550);

    return () => {
      clearTimeout(timer);
      clearTimeout(clearPulse);
    };
  }, [isOpen, targetAnchor, booklet, onAnchorHandled]);

  const handleCopyLatex = (item: FormulaItem) => {
    navigator.clipboard.writeText(item.latex);
    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  if (!isOpen || !booklet) {
    return null;
  }

  const topicTabs = [
    { id: 'all' as const, label: 'All Formulas' },
    { id: 0, label: 'Prior Learning' },
    ...booklet.topics.map((t) => ({ id: t.number, label: t.shortName })),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end pointer-events-none"
      aria-labelledby="formula-booklet-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop for tablet / mobile or quick dismiss */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs pointer-events-auto transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside
        ref={containerRef}
        aria-label="Formula Booklet"
        className="pointer-events-auto relative w-full sm:w-[540px] lg:w-[620px] h-full bg-[#181715] border-l border-white/10 shadow-2xl flex flex-col z-10 animate-slideLeft transition-transform duration-300 text-[#faf9f5]"
      >
        {/* ============================================================ */}
        {/* 1. DRAWER HEADER                                             */}
        {/* ============================================================ */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#1f1e1b]/90 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#cc785c]/15 border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c]">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2
                  id="formula-booklet-title"
                  className="font-serif-display text-lg font-normal text-[#faf9f5] leading-tight"
                >
                  {booklet.title}
                </h2>
                <div className="flex items-center gap-2 text-[10px] font-mono-code text-[#a09d95]">
                  <span>Official IB Reference</span>
                  <span>•</span>
                  <span>{booklet.version}</span>
                  <span>•</span>
                  <span className="text-[#cc785c] font-semibold">Authorized for Exam</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-[#a09d95] hover:text-[#faf9f5] hover:bg-white/10 transition-spring active:scale-95"
              title="Close Formula Booklet (Esc)"
              aria-label="Close Formula Booklet"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a09d95]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code (e.g. 5.5, 3.13), topic, or math keywords..."
              className="w-full bg-[#252320] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs font-mono-code text-[#faf9f5] placeholder-[#a09d95] focus:outline-none focus:border-[#cc785c] focus:ring-1 focus:ring-[#cc785c] shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono-code text-[#a09d95] hover:text-[#faf9f5]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Topic Tab Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {topicTabs.map((tab) => {
              const isActive = selectedTopic === tab.id;
              return (
                <button
                  key={String(tab.id)}
                  type="button"
                  onClick={() => setSelectedTopic(tab.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-mono-code whitespace-nowrap transition-fluid ${
                    isActive
                      ? 'bg-[#cc785c] text-white font-medium shadow-2xs'
                      : 'bg-[#252320] border border-white/10 text-[#a09d95] hover:text-[#faf9f5] hover:bg-[#2c2a26]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. FORMULAS SCROLL CONTAINER                                 */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredFormulas.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#252320] border border-white/10 flex items-center justify-center mx-auto text-[#a09d95]">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-serif-display text-base text-[#faf9f5]">
                No matching formulas found
              </h3>
              <p className="text-xs text-[#a09d95] max-w-xs mx-auto">
                Try searching for a different section number (e.g. &quot;5.5&quot;), calculus rule, or topic.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTopic('all');
                }}
                className="text-xs font-mono-code text-[#cc785c] hover:underline"
              >
                Reset search and filters
              </button>
            </div>
          ) : (
            filteredFormulas.map((item) => {
              const isTargeted = highlightedId === item.id;
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  id={item.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-500 bg-[#252320] ${
                    isTargeted
                      ? 'border-[#cc785c] ring-2 ring-[#cc785c] bg-[#cc785c]/[0.08] shadow-md animate-pulse'
                      : 'border-white/10 hover:border-[#cc785c]/40 hover:shadow-2xs'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-mono-code uppercase font-semibold px-2 py-0.5 rounded-md ${
                          item.isAhl
                            ? 'bg-[#7c6fcd]/15 text-[#7c6fcd] border border-[#7c6fcd]/30'
                            : 'bg-[#1f1e1b] text-[#faf9f5] border border-white/10'
                        }`}
                      >
                        {item.code}
                      </span>
                      {item.isAhl && (
                        <span className="text-[10px] font-mono-code uppercase font-bold text-[#7c6fcd]">
                          Higher Level
                        </span>
                      )}
                      <h4 className="text-xs sm:text-sm font-semibold text-[#faf9f5]">
                        {item.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyLatex(item)}
                      title="Copy LaTeX formula"
                      className="p-1.5 rounded-lg text-[#a09d95] hover:text-[#cc785c] hover:bg-white/5 transition-spring shrink-0"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-[#5db872]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Math Formula Body */}
                  <div className="bg-[#181715] border border-white/10 rounded-xl p-3 sm:p-4 my-2 overflow-x-auto text-center">
                    <MathRenderer content={`$$${item.latex}$$`} />
                  </div>

                  {/* Variables / Usage Description */}
                  {item.variablesDescription && (
                    <p className="text-[13px] text-[#d6cfc5] font-sans not-italic pt-1.5 leading-relaxed">
                      {item.variablesDescription}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ============================================================ */}
        {/* 3. DRAWER FOOTER                                             */}
        {/* ============================================================ */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#1f1e1b] text-[10px] font-mono-code text-[#a09d95] flex items-center justify-between shrink-0">
          <span>Showing {filteredFormulas.length} of {allFormulas.length} formulas</span>
          <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-[#252320] text-[#faf9f5] border border-white/10">Esc</kbd> to close</span>
        </div>
      </aside>
    </div>
  );
};
