'use client';

import React from 'react';
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
}

const PALETTE = [
  { name: 'Deep Ink', value: '#0f172a' },
  { name: 'Royal Blue', value: '#2563eb' },
  { name: 'Examiner Red', value: '#dc2626' },
  { name: 'Graphite', value: '#475569' },
  { name: 'Fluorescent Highlighter', value: 'rgba(250, 204, 21, 0.45)' },
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
  showPageNav = true,
}) => {
  const { hasFormulaBooklet, toggleFormulaBooklet, isFormulaBookletOpen } = useAppShell();

  return (
    <aside
      aria-label="Drawing Tools"
      className="bg-[#181715]/95 backdrop-blur-xl border border-white/10 rounded-2xl px-4 sm:px-5 py-2 flex items-center justify-center gap-2 sm:gap-2.5 w-fit max-w-full mx-auto text-[#faf9f5] shadow-2xl transition-all"
    >
      {/* Tool Selection */}
      <div className="flex items-center gap-1 bg-[#252320] p-1 rounded-lg border border-white/5 shrink-0">
        <button
          type="button"
          onClick={() => setTool('pen')}
          aria-label="Fountain Pen tool"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono-code transition focus-ring ${tool === 'pen'
            ? 'bg-[#cc785c] text-white font-medium shadow-sm'
            : 'text-[#a09d96] hover:text-[#faf9f5]'
            }`}
          title="Fountain Pen (P)"
        >
          <Pen className="w-3.5 h-3.5" />
          <span>Pen</span>
        </button>

        <button
          type="button"
          onClick={() => setTool('highlighter')}
          aria-label="Fluorescent Highlighter tool"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono-code transition focus-ring ${tool === 'highlighter'
            ? 'bg-[#e8a55a] text-black font-semibold shadow-sm'
            : 'text-[#a09d96] hover:text-[#faf9f5]'
            }`}
          title="Highlighter (H)"
        >
          <Highlighter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Highlight</span>
        </button>

        <button
          type="button"
          onClick={() => setTool('eraser')}
          aria-label="Precision Eraser tool"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono-code transition focus-ring ${tool === 'eraser'
            ? 'bg-[#c64545] text-white font-medium shadow-sm'
            : 'text-[#a09d96] hover:text-[#faf9f5]'
            }`}
          title="Precision Eraser (E)"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Eraser</span>
        </button>
      </div>

      {/* Colors */}
      <div className="flex items-center gap-1 bg-[#252320] px-1.5 py-1 rounded-lg border border-white/5 shrink-0">
        {PALETTE.map((c) => {
          const isSelected = color === c.value && tool !== 'eraser';
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                setColor(c.value);
                if (c.name === 'Fluorescent Highlighter') {
                  setTool('highlighter');
                } else if (tool === 'eraser') {
                  setTool('pen');
                }
              }}
              aria-label={`Select ${c.name} ink color`}
              title={c.name}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-all focus-ring ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full transition-transform border ${isSelected
                  ? 'scale-125 ring-2 ring-[#cc785c] ring-offset-1 ring-offset-[#181715] border-white'
                  : 'border-white/20'
                  }`}
                style={{ backgroundColor: c.value }}
              />
            </button>
          );
        })}
      </div>

      {/* Stroke Width Slider */}
      <div className="hidden sm:flex items-center gap-2 bg-[#252320] px-2 py-1 rounded-lg border border-white/5 shrink-0">
        <span className="text-[10px] text-[#a09d96] font-mono-code uppercase">Size</span>
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
        <span className="text-[10px] text-[#a09d96] font-mono-code w-3">{width}</span>
      </div>

      {/* Undo, Redo, Delete / Clear Action Box */}
      <div className="flex items-center gap-1 bg-[#252320] p-1 rounded-lg border border-white/5 shrink-0">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo canvas stroke"
          className="p-1.5 rounded-md text-[#a09d96] hover:text-[#faf9f5] hover:bg-white/10 disabled:opacity-30 transition focus-ring"
          title="Undo (Ctrl+Z)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo canvas stroke"
          className="p-1.5 rounded-md text-[#a09d96] hover:text-[#faf9f5] hover:bg-white/10 disabled:opacity-30 transition focus-ring"
          title="Redo (Ctrl+Y)"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
        <button
          type="button"
          onClick={onClear}
          aria-label="Delete all canvas working on this page"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono-code text-[#c64545] hover:text-[#e05252] bg-[#c64545]/10 hover:bg-[#c64545]/20 border border-[#c64545]/20 transition active:scale-95 focus-ring"
          title="Delete / Clear Working"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>

      {/* Official IB Formula Booklet Fast Trigger */}
      {hasFormulaBooklet && (
        <div className="flex items-center bg-[#252320] p-1 rounded-lg border border-white/5 shrink-0">
          <button
            type="button"
            onClick={() => toggleFormulaBooklet()}
            aria-label="Toggle official IB Formula Booklet"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono-code transition focus-ring ${
              isFormulaBookletOpen
                ? 'bg-[#cc785c] text-white font-medium shadow-sm'
                : 'text-[#a09d96] hover:text-[#faf9f5]'
            }`}
            title="Formula Booklet (Ctrl+B)"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Booklet</span>
          </button>
        </div>
      )}

      {/* Page Navigation */}
      {showPageNav && (
        <div className="flex items-center gap-1 bg-[#252320] px-2 py-1 rounded-lg border border-white/5">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            aria-label="Previous question page"
            className="p-1.5 text-[#a09d96] hover:text-[#faf9f5] disabled:opacity-30 transition focus-ring"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono-code text-[#a09d96] px-1">
            {currentPage}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            aria-label="Next question page"
            className="p-1.5 text-[#a09d96] hover:text-[#faf9f5] disabled:opacity-30 transition focus-ring"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </aside>
  );
};
