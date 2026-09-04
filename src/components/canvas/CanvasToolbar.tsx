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
} from 'lucide-react';

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
  return (
    <aside
      aria-label="Drawing Tools"
      className="bg-[#141517]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl px-4 sm:px-5 py-2 flex items-center justify-center gap-2 sm:gap-2.5 w-fit max-w-full mx-auto text-[#f3f3f2] shadow-2xl transition-all"
    >
      {/* Tool Selection */}
      <div className="flex items-center gap-1 bg-[#0c0d0e] p-1 rounded-lg border border-white/[0.06] shrink-0">
        <button
          type="button"
          onClick={() => setTool('pen')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono-code transition ${
            tool === 'pen'
              ? 'bg-[#f54e00] text-white font-medium shadow-sm'
              : 'text-[#9b9a95] hover:text-[#f3f3f2]'
          }`}
          title="Fountain Pen (P)"
        >
          <Pen className="w-3.5 h-3.5" />
          <span>Pen</span>
        </button>

        <button
          type="button"
          onClick={() => setTool('highlighter')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono-code transition ${
            tool === 'highlighter'
              ? 'bg-amber-500 text-black font-semibold shadow-sm'
              : 'text-[#9b9a95] hover:text-[#f3f3f2]'
          }`}
          title="Highlighter (H)"
        >
          <Highlighter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Highlight</span>
        </button>

        <button
          type="button"
          onClick={() => setTool('eraser')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono-code transition ${
            tool === 'eraser'
              ? 'bg-rose-600 text-white font-medium shadow-sm'
              : 'text-[#9b9a95] hover:text-[#f3f3f2]'
          }`}
          title="Precision Eraser (E)"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Eraser</span>
        </button>
      </div>

      {/* Colors */}
      <div className="flex items-center gap-1.5 bg-[#0c0d0e] px-2 py-1 rounded-lg border border-white/[0.06] shrink-0">
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
              title={c.name}
              className={`w-3.5 h-3.5 rounded-full transition-transform border ${
                isSelected
                  ? 'scale-125 ring-2 ring-[#f54e00] ring-offset-1 ring-offset-[#0c0d0e] border-white'
                  : 'border-white/20 hover:scale-110'
              }`}
              style={{ backgroundColor: c.value }}
            />
          );
        })}
      </div>

      {/* Stroke Width Slider */}
      <div className="hidden sm:flex items-center gap-2 bg-[#0c0d0e] px-2 py-1 rounded-lg border border-white/[0.06] shrink-0">
        <span className="text-[10px] text-[#686763] font-mono-code uppercase">Size</span>
        <input
          type="range"
          min={tool === 'highlighter' ? 10 : 1}
          max={tool === 'highlighter' ? 30 : 8}
          step={tool === 'highlighter' ? 2 : 0.5}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="w-12 accent-[#f54e00] cursor-pointer h-1.5 bg-[#1a1b1e] rounded-lg appearance-none"
        />
        <span className="text-[10px] text-[#9b9a95] font-mono-code w-3">{width}</span>
      </div>

      {/* Undo, Redo, Delete / Clear Action Box */}
      <div className="flex items-center gap-1 bg-[#0c0d0e] p-1 rounded-lg border border-white/[0.06] shrink-0">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1 rounded-md text-[#9b9a95] hover:text-[#f3f3f2] hover:bg-white/[0.06] disabled:opacity-30 transition"
          title="Undo (Ctrl+Z)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1 rounded-md text-[#9b9a95] hover:text-[#f3f3f2] hover:bg-white/[0.06] disabled:opacity-30 transition"
          title="Redo (Ctrl+Y)"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3.5 bg-white/[0.08] mx-0.5" />
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono-code text-[#cf2d56] hover:text-[#e0456d] bg-[#cf2d56]/10 hover:bg-[#cf2d56]/20 border border-[#cf2d56]/20 transition active:scale-95"
          title="Delete / Clear Working"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>

      {/* Page Navigation */}
      {showPageNav && (
        <div className="flex items-center gap-1 bg-[#0c0d0e] px-2 py-1 rounded-lg border border-white/[0.06]">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1 text-[#9b9a95] hover:text-[#f3f3f2] disabled:opacity-30 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono-code text-[#9b9a95] px-1">
            {currentPage}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 text-[#9b9a95] hover:text-[#f3f3f2] disabled:opacity-30 transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </aside>
  );
};
