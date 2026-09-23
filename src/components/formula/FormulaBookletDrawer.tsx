'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Search, Copy, Check } from 'lucide-react';
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

  // Native modal dialog: traps focus, makes the page inert, handles Esc via `cancel`
  const dialogRef = useRef<HTMLDialogElement>(null);
  const shouldShow = isOpen && Boolean(booklet);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (shouldShow && !dialog.open) {
      dialog.showModal();
      searchInputRef.current?.focus();
    }
    if (!shouldShow && dialog.open) dialog.close();
  }, [shouldShow]);

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

  if (!booklet) {
    return null;
  }

  const topicTabs = [
    { id: 'all' as const, label: 'All' },
    { id: 0, label: 'Prior learning' },
    ...booklet.topics.map((t) => ({ id: t.number, label: t.shortName })),
  ];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="formula-booklet-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click on the backdrop (the dialog box itself, outside the panel) closes it
        if (e.target === e.currentTarget) onClose();
      }}
      className="paper-surface fixed m-0 ml-auto h-dvh max-h-none w-full sm:w-[560px] lg:w-[640px] max-w-full p-0 border-0 bg-paper text-ink backdrop:bg-[rgba(10,12,15,0.6)]"
    >
      <div className="h-full flex flex-col">
        {/* Booklet head */}
        <div className="px-5 sm:px-8 pt-6 pb-4 border-b border-ink space-y-4 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="formula-booklet-title" className="font-serif text-[24px] font-semibold leading-tight text-ink">
                {booklet.title}
              </h2>
              <p className="mt-1 text-[14px] text-ink-muted">
                {booklet.version} · Permitted in the exam
              </p>
            </div>
            <button type="button" onClick={onClose} className="btn btn-sm btn-quiet-paper shrink-0" title="Close (Esc)">
              <X className="w-4 h-4" aria-hidden="true" />
              Close
            </button>
          </div>

          <label className="relative block">
            <span className="sr-only">Search the formula booklet</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by section (5.5), topic or keyword"
              className="w-full min-h-11 bg-paper border border-paper-rule-strong pl-9 pr-3 text-[15px] text-ink placeholder:text-ink-muted"
            />
          </label>

          <div role="group" aria-label="Topic" className="flex overflow-x-auto border border-paper-rule-strong">
            {topicTabs.map((tab) => {
              const isActive = selectedTopic === tab.id;
              return (
                <button
                  key={String(tab.id)}
                  type="button"
                  onClick={() => setSelectedTopic(tab.id)}
                  aria-pressed={isActive}
                  className={`min-h-11 px-3 text-[14px] font-medium whitespace-nowrap border-r border-paper-rule last:border-r-0 ${
                    isActive ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-paper-tint'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Formula entries */}
        <div className="flex-1 overflow-y-auto">
          {filteredFormulas.length === 0 ? (
            <div className="px-5 sm:px-8 py-16 space-y-3">
              <p className="font-serif text-[20px] font-semibold text-ink">No formulas match</p>
              <p className="text-[15px] text-ink-muted max-w-[46ch]">
                Try a section number such as 5.5, a rule such as &ldquo;chain rule&rdquo;, or a topic name.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTopic('all');
                }}
                className="btn btn-sm btn-quiet-paper"
              >
                Clear search and topic
              </button>
            </div>
          ) : (
            <ol>
              {filteredFormulas.map((item) => {
                const isTargeted = highlightedId === item.id;
                const isCopied = copiedId === item.id;

                return (
                  <li
                    key={item.id}
                    id={item.id}
                    className={`grid grid-cols-[4.5rem_1fr] gap-x-4 px-5 sm:px-8 py-5 border-b border-paper-rule transition-colors duration-500 ${
                      isTargeted ? 'bg-paper-tint outline-2 -outline-offset-2 outline-ink' : ''
                    }`}
                  >
                    <div className="pt-0.5">
                      <p className="tabular text-[15px] font-semibold text-ink">{item.code}</p>
                      {item.isAhl && <p className="mt-0.5 text-[12px] font-semibold text-ink-muted">AHL</p>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[15px] font-semibold text-ink">{item.title}</h3>
                        <button
                          type="button"
                          onClick={() => handleCopyLatex(item)}
                          className="min-h-9 min-w-9 -mt-1.5 flex items-center justify-center text-ink-muted hover:text-ink shrink-0"
                          title="Copy as LaTeX"
                        >
                          {isCopied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                          <span className="sr-only">{isCopied ? 'Copied' : `Copy ${item.title} as LaTeX`}</span>
                        </button>
                      </div>
                      <div className="my-3 overflow-x-auto text-ink">
                        <MathRenderer content={`$$${item.latex}$$`} lightMode={true} />
                      </div>
                      {item.variablesDescription && (
                        <p className="text-[14px] leading-relaxed text-ink-muted">{item.variablesDescription}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="px-5 sm:px-8 py-3 border-t border-paper-rule text-[13px] text-ink-muted flex items-center justify-between shrink-0 tabular">
          <span>
            {filteredFormulas.length} of {allFormulas.length} formulas
          </span>
          <span>Esc to close</span>
        </div>
      </div>
    </dialog>
  );
};
