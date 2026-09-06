'use client';

import React, { useEffect } from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  RotateCcw,
  RotateCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { useAppShell } from '@/components/common/AppShell';

export interface CanvasToolbarProps {
  tool: 'pen' | 'highlighter' | 'eraser';
  setTool: (tool: 'pen' | 'highlighter' | 'eraser') => void;
  color: string;
  setColor: (color: string) => void;
  width: number;
  setWidth: (width: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNav?: boolean;
  showBooklet?: boolean;
  showClear?: boolean;
  className?: string;
}

const PALETTE = [
  { name: 'Deep Ink', value: '#0f172a' },
  { name: 'Royal Blue', value: '#2563eb' },
  { name: 'Examiner Red', value: '#dc2626' },
  { name: 'Graphite Pencil', value: '#475569' },
];

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  tool,
  setTool,
  color,
  setColor,
  width,
  setWidth,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  currentPage,
  totalPages,
  onPageChange,
  showPageNav = false,
  showBooklet = false,
  showClear = false,
  className = '',
}) => {
  const { hasFormulaBooklet, toggleFormulaBooklet, isFormulaBookletOpen } = useAppShell();

  // Active keyboard shortcuts: P (pen), H (highlighter), E (eraser), Ctrl+Z (undo), Ctrl+Y (redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) onRedo();
        } else {
          if (canUndo) onUndo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) onRedo();
        return;
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setTool('pen');
        } else if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          setTool('highlighter');
        } else if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          setTool('eraser');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, onUndo, onRedo, canUndo, canRedo]);

  return (
    <aside
      aria-label="Drawing Tools"
      className={`bg-[#1f1e1b]/95 backdrop-blur-xl border border-white/10 rounded-full px-3 sm:px-4 py-1.5 flex items-center justify-center gap-1.5 sm:gap-2 w-fit max-w-full mx-auto text-[#faf9f5] shadow-2xl transition-all ${className}`.trim()}
    >
      {/* 1. Primary Tool Selection (Pen, Highlighter, Eraser) */}
      <div className="flex items-center gap-1 bg-[#252320] p-1 rounded-full border border-white/5 shrink-0">
        <button
          type="button"
          onClick={() => setTool('pen')}
          aria-label="Fountain Pen tool"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono-code transition focus-ring ${
            tool === 'pen'
              ? 'bg-[#cc785c] text-white font-semibold shadow-xs'
              : 'text-[#a09d96] hover:text-[#faf9f5]'
          }`}
          title="Fountain Pen (P)"
        >
          <Pen className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Pen</span>
        </button>

        <button
          type="button"
          onClick={() => setTool('highlighter')}
          aria-label="Fluorescent Highlighter tool"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono-code transition focus-ring ${
            tool === 'highlighter'
              ? 'bg-[#e8a55a] text-black font-semibold shadow-xs'
              : 'text-[#a09d96] hover:text-[#faf9f5]'
          }`}
          title="Highlighter (H)"
        >
          <Highlighter className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Highlight</span>
        </button>

        <button
          type="button"
          onClick={() => setTool('eraser')}
          aria-label="Precision Eraser tool"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono-code transition focus-ring ${
            tool === 'eraser'
              ? 'bg-[#c64545] text-white font-semibold shadow-xs'
              : 'text-[#a09d96] hover:text-[#faf9f5]'
          }`}
          title="Precision Eraser (E)"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Eraser</span>
        </button>
      </div>

      {/* 2. Archival Ink Palette */}
      <div className="flex items-center gap-1 bg-[#252320] px-2 py-1 rounded-full border border-white/5 shrink-0">
        {PALETTE.map((c) => {
          const isSelected = color === c.value && tool !== 'eraser';
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                setColor(c.value);
                if (tool === 'eraser') {
                  setTool('pen');
                }
              }}
              aria-label={`Select ${c.name} ink color`}
              title={c.name}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all focus-ring ${
                isSelected ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full transition-transform border ${
                  isSelected
                    ? 'scale-125 ring-2 ring-[#cc785c] ring-offset-1 ring-offset-[#181715] border-white'
                    : 'border-white/20'
                }`}
                style={{ backgroundColor: c.value }}
              />
            </button>
          );
        })}
      </div>

      {/* 3. Stroke Width Control */}
      <div className="hidden sm:flex items-center gap-1.5 bg-[#252320] px-2.5 py-1 rounded-full border border-white/5 shrink-0">
        <span className="text-[10px] text-[#a09d96] font-mono-code uppercase font-semibold">Size</span>
        <input
          type="range"
          min={tool === 'highlighter' ? 10 : 1}
          max={tool === 'highlighter' ? 30 : 8}
          step={tool === 'highlighter' ? 2 : 0.5}
          value={width}
          aria-label="Stroke width"
          onChange={(e) => setWidth(Number(e.target.value))}
          className="w-12 accent-[#cc785c] cursor-pointer h-1.5 bg-[#181715] rounded-lg appearance-none focus-ring"
        />
        <span className="text-[10px] text-[#faf9f5] font-mono-code w-3">{width}</span>
      </div>

      {/* 4. Stroke History: Undo / Redo */}
      <div className="flex items-center gap-0.5 bg-[#252320] p-1 rounded-full border border-white/5 shrink-0">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo canvas stroke"
          className="p-1.5 rounded-full text-[#a09d96] hover:text-[#faf9f5] hover:bg-white/10 disabled:opacity-30 transition focus-ring"
          title="Undo (Ctrl+Z)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo canvas stroke"
          className="p-1.5 rounded-full text-[#a09d96] hover:text-[#faf9f5] hover:bg-white/10 disabled:opacity-30 transition focus-ring"
          title="Redo (Ctrl+Y)"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5. Optional Canvas Clear Action (Only rendered if explicitly requested) */}
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear canvas working on this question"
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono-code text-[#c64545] hover:text-[#e05252] bg-[#c64545]/10 hover:bg-[#c64545]/20 border border-[#c64545]/20 transition active:scale-95 focus-ring shrink-0"
          title="Clear Working"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Clear</span>
        </button>
      )}

      {/* 6. Optional Formula Booklet Trigger */}
      {showBooklet && hasFormulaBooklet && (
        <div className="flex items-center bg-[#252320] p-1 rounded-full border border-white/5 shrink-0">
          <button
            type="button"
            onClick={() => toggleFormulaBooklet()}
            aria-label="Toggle official IB Formula Booklet"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono-code transition focus-ring ${
              isFormulaBookletOpen
                ? 'bg-[#cc785c] text-white font-semibold shadow-xs'
                : 'text-[#a09d96] hover:text-[#faf9f5]'
            }`}
            title="Formula Booklet (Ctrl+B)"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Booklet</span>
          </button>
        </div>
      )}

      {/* 7. Optional Multi-Page Navigation */}
      {showPageNav && (
        <div className="flex items-center gap-1 bg-[#252320] px-2 py-0.5 rounded-full border border-white/5 shrink-0">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            aria-label="Previous question page"
            className="p-1 text-[#a09d96] hover:text-[#faf9f5] disabled:opacity-30 transition focus-ring"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono-code text-[#a09d96] px-1">
            {currentPage}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            aria-label="Next question page"
            className="p-1 text-[#a09d96] hover:text-[#faf9f5] disabled:opacity-30 transition focus-ring"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </aside>
  );
};
