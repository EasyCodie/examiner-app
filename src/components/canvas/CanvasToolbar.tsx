'use client';

import React, { useEffect, useState } from 'react';
import { Pen, Highlighter, Eraser, RotateCcw, RotateCw, Hand, Keyboard } from 'lucide-react';

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
  /** Vertical: a rail beside the script. Horizontal: a bar docked below it. */
  orientation?: 'vertical' | 'horizontal';
  fingerDrawing?: boolean;
  setFingerDrawing?: (value: boolean) => void;
  className?: string;
}

/** Candidates write in black or blue-black; red belongs to the examiner. */
const PALETTE = [
  { name: 'Blue-black ink', value: '#1a2238' },
  { name: 'Black ink', value: '#111418' },
  { name: 'Pencil', value: '#4b5563' },
];

const SHORTCUTS_KEY = 'criterion:single-key-shortcuts';

const readShortcutsPref = () => {
  try {
    return window.localStorage.getItem(SHORTCUTS_KEY) !== 'off';
  } catch {
    return true;
  }
};

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
  orientation = 'horizontal',
  fingerDrawing,
  setFingerDrawing,
  className = '',
}) => {
  const vertical = orientation === 'vertical';
  const [shortcutsOn, setShortcutsOn] = useState(true);
  const [coarsePointer, setCoarsePointer] = useState(false);

  // Read per-device preferences after mount (browser-only APIs)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setShortcutsOn(readShortcutsPref());
      setCoarsePointer(window.matchMedia('(any-pointer: coarse)').matches);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const toggleShortcuts = () => {
    const next = !shortcutsOn;
    setShortcutsOn(next);
    try {
      window.localStorage.setItem(SHORTCUTS_KEY, next ? 'on' : 'off');
    } catch {
      // preference simply won't persist
    }
  };

  // Keyboard: Ctrl+Z / Ctrl+Y always; single keys P / H / E only when enabled (WCAG 2.1.4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) onRedo();
        } else if (canUndo) {
          onUndo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) onRedo();
        return;
      }

      if (!shortcutsOn || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'p') setTool('pen');
      else if (key === 'h') setTool('highlighter');
      else if (key === 'e') setTool('eraser');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, onUndo, onRedo, canUndo, canRedo, shortcutsOn]);

  const tools = [
    { id: 'pen' as const, label: 'Pen', key: 'P', Icon: Pen },
    { id: 'highlighter' as const, label: 'Highlighter', key: 'H', Icon: Highlighter },
    { id: 'eraser' as const, label: 'Eraser', key: 'E', Icon: Eraser },
  ];

  const group = vertical ? 'flex flex-col items-stretch' : 'flex items-center';
  const divider = vertical ? 'h-px w-full bg-shell-line my-1' : 'w-px self-stretch bg-shell-line mx-1';
  const toolButton = (active: boolean) =>
    `min-h-11 min-w-11 flex items-center justify-center gap-2 px-2.5 text-[14px] font-medium transition-colors ${
      active ? 'bg-paper text-ink' : 'text-shell-muted hover:text-shell-ink'
    }`;

  return (
    <div
      role="toolbar"
      aria-label="Writing tools"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      className={`shell-surface text-shell-ink ${
        vertical
          ? 'flex flex-col w-[152px] bg-shell-raised border border-shell-line p-1.5'
          : 'flex items-center justify-center gap-1 px-2 py-1 overflow-x-auto'
      } ${className}`.trim()}
    >
      <div className={group}>
        {tools.map(({ id, label, key, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTool(id)}
            aria-pressed={tool === id}
            title={shortcutsOn ? `${label} (${key})` : label}
            className={`${toolButton(tool === id)} ${vertical ? 'justify-start' : ''}`}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className={vertical ? '' : 'hidden md:inline'}>{label}</span>
          </button>
        ))}
      </div>

      <span className={divider} aria-hidden="true" />

      <div className={`${group} ${vertical ? '' : 'gap-0'}`} role="group" aria-label="Ink">
        {PALETTE.map((c) => {
          const selected = color === c.value && tool !== 'eraser';
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => {
                setColor(c.value);
                if (tool === 'eraser') setTool('pen');
              }}
              aria-pressed={selected}
              className={`min-h-11 min-w-11 flex items-center gap-2 px-2.5 text-[14px] ${
                selected ? 'text-shell-ink' : 'text-shell-muted hover:text-shell-ink'
              } ${vertical ? 'justify-start' : 'justify-center'}`}
            >
              <span
                className={`w-4 h-4 shrink-0 border ${selected ? 'border-paper outline-2 outline-offset-2 outline-paper' : 'border-shell-muted'}`}
                style={{ backgroundColor: c.value }}
                aria-hidden="true"
              />
              <span className={vertical ? '' : 'sr-only'}>{c.name}</span>
            </button>
          );
        })}
      </div>

      <span className={divider} aria-hidden="true" />

      <label
        className={`flex items-center gap-2 px-2.5 min-h-11 text-[13px] text-shell-muted ${vertical ? '' : 'hidden sm:flex'}`}
      >
        <span>Size</span>
        <input
          type="range"
          min={tool === 'highlighter' ? 10 : 1}
          max={tool === 'highlighter' ? 30 : 8}
          step={tool === 'highlighter' ? 2 : 0.5}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="w-full min-w-14 accent-paper cursor-pointer"
        />
      </label>

      <span className={divider} aria-hidden="true" />

      <div className={vertical ? 'grid grid-cols-2' : 'flex items-center'}>
        <button type="button" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" className={`${toolButton(false)} disabled:opacity-35`}>
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">Undo</span>
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)" className={`${toolButton(false)} disabled:opacity-35`}>
          <RotateCw className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">Redo</span>
        </button>
      </div>

      <span className={divider} aria-hidden="true" />

      <div className={group}>
        {setFingerDrawing && coarsePointer && (
          <button
            type="button"
            onClick={() => setFingerDrawing(!fingerDrawing)}
            aria-pressed={Boolean(fingerDrawing)}
            title="When off, a finger scrolls the page and only a stylus writes"
            className={`${toolButton(Boolean(fingerDrawing))} ${vertical ? 'justify-start' : ''}`}
          >
            <Hand className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className={vertical ? '' : 'hidden md:inline'}>Draw with finger</span>
          </button>
        )}
        <button
          type="button"
          onClick={toggleShortcuts}
          aria-pressed={shortcutsOn}
          title="Single-key shortcuts: P pen, H highlighter, E eraser"
          className={`min-h-11 min-w-11 flex items-center gap-2 px-2.5 text-[13px] ${
            shortcutsOn ? 'text-shell-ink' : 'text-shell-muted'
          } hover:text-shell-ink ${vertical ? 'justify-start' : 'justify-center'}`}
        >
          <Keyboard className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className={vertical ? '' : 'sr-only'}>Shortcuts {shortcutsOn ? 'on' : 'off'}</span>
        </button>
      </div>
    </div>
  );
};
