'use client';

import React, {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import {
  Pen,
  Minus,
  Type,
  RotateCcw,
  RotateCw,
  Trash2,
  Tag,
} from 'lucide-react';

export interface InlineDiagramCanvasRef {
  getSnapshot: () => string;
  hasDiagram: () => boolean;
}

export type AxisTemplate = 'standard' | 'cross' | 'blank';
export type DiagramTool = 'curve' | 'line' | 'text';

export interface DiagramStroke {
  type: 'stroke';
  tool: 'curve' | 'line';
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

export interface DiagramText {
  type: 'text';
  text: string;
  color: string;
  x: number;
  y: number;
}

export type DiagramItem = DiagramStroke | DiagramText;

interface InlineDiagramCanvasProps {
  initialImage?: string;
  onSave?: (base64: string) => void;
}

const TEMPLATE_CONFIGS: Record<AxisTemplate, { label: string }> = {
  standard: { label: 'Standard L-Axes' },
  cross: { label: '4-Quadrant' },
  blank: { label: 'Blank Canvas' },
};

const COLOR_PALETTE = [
  { name: 'Initial Curve', hex: '#2563eb' },
  { name: 'Shifted Curve', hex: '#cc785c' },
  { name: 'Social Optimum', hex: '#5db8a6' },
  { name: 'Welfare Loss', hex: '#c64545' },
  { name: 'Reference Line', hex: '#334155' },
];

const COMMON_NOTATIONS = [
  'P', 'Q', 'P1', 'Q1', 'P2', 'Q2', 'D', 'S', 'D1', 'S1', 'AD', 'SRAS', 'LRAS', 'Y', 'PL', 'e1',
];

export const InlineDiagramCanvas = forwardRef<InlineDiagramCanvasRef, InlineDiagramCanvasProps>(
  ({ initialImage, onSave }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [activeTemplate, setActiveTemplate] = useState<AxisTemplate>('standard');
    const [activeTool, setActiveTool] = useState<DiagramTool>('curve');
    const [activeColor, setActiveColor] = useState<string>('#2563eb');
    const lineWidth = 2.5;

    // Active label stamp state for 'text' tool
    const [activeStamp, setActiveStamp] = useState<string>('P');
    const [customLabelInput, setCustomLabelInput] = useState<string>('');

    const [items, setItems] = useState<DiagramItem[]>([]);
    const [undoStack, setUndoStack] = useState<DiagramItem[][]>([]);
    const [isDrawing, setIsDrawing] = useState(false);

    // Current in-progress stroke points
    const currentPointsRef = useRef<{ x: number; y: number }[]>([]);

    // Draw the background grid and axis system (strictly unlabelled for authentic simulation)
    const drawBackground = useCallback(
      (ctx: CanvasRenderingContext2D, width: number, height: number, tmpl: AxisTemplate) => {
        ctx.clearRect(0, 0, width, height);

        // Subtle background grid
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        for (let x = 35; x < width; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 20; y < height; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        ctx.strokeStyle = '#334155';
        ctx.fillStyle = '#334155';
        ctx.lineWidth = 2;

        if (tmpl === 'standard') {
          // Standard single quadrant L-shape
          ctx.beginPath();
          ctx.moveTo(35, 15);
          ctx.lineTo(35, 235);
          ctx.lineTo(385, 235);
          ctx.stroke();

          // Y-axis arrow
          ctx.beginPath();
          ctx.moveTo(35, 10);
          ctx.lineTo(31, 20);
          ctx.lineTo(39, 20);
          ctx.fill();

          // X-axis arrow
          ctx.beginPath();
          ctx.moveTo(392, 235);
          ctx.lineTo(382, 231);
          ctx.lineTo(382, 239);
          ctx.fill();

          // Origin indicator only (candidate must label variables)
          ctx.fillStyle = '#64748b';
          ctx.font = '11px sans-serif';
          ctx.fillText('0', 22, 246);
        } else if (tmpl === 'cross') {
          // 4-quadrant crossing axes
          const midX = 200;
          const midY = 130;

          ctx.beginPath();
          ctx.moveTo(midX, 15);
          ctx.lineTo(midX, 245);
          ctx.moveTo(25, midY);
          ctx.lineTo(375, midY);
          ctx.stroke();

          // Y-axis top arrow
          ctx.beginPath();
          ctx.moveTo(midX, 10);
          ctx.lineTo(midX - 4, 20);
          ctx.lineTo(midX + 4, 20);
          ctx.fill();

          // X-axis right arrow
          ctx.beginPath();
          ctx.moveTo(382, midY);
          ctx.lineTo(372, midY - 4);
          ctx.lineTo(372, midY + 4);
          ctx.fill();

          // Origin indicator
          ctx.fillStyle = '#64748b';
          ctx.font = '11px sans-serif';
          ctx.fillText('0', midX - 12, midY + 14);
        }
      },
      []
    );

    // Redraw canvas: background + committed items + optional live stroke
    const renderCanvas = useCallback(
      (itemList: DiagramItem[], liveStroke?: DiagramStroke) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        drawBackground(ctx, canvas.width, canvas.height, activeTemplate);

        const allToDraw: (DiagramItem | DiagramStroke)[] = liveStroke
          ? [...itemList, liveStroke]
          : itemList;

        allToDraw.forEach((item) => {
          if (item.type === 'stroke') {
            if (item.points.length < 2) return;
            ctx.save();
            ctx.strokeStyle = item.color;
            ctx.lineWidth = item.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            if (item.tool === 'line') {
              const start = item.points[0];
              const end = item.points[item.points.length - 1];
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(end.x, end.y);
            } else {
              ctx.moveTo(item.points[0].x, item.points[0].y);
              for (let i = 1; i < item.points.length; i++) {
                ctx.lineTo(item.points[i].x, item.points[i].y);
              }
            }
            ctx.stroke();
            ctx.restore();
          } else if (item.type === 'text') {
            ctx.save();
            ctx.fillStyle = item.color;
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            ctx.fillText(item.text, item.x, item.y);
            ctx.restore();
          }
        });
      },
      [activeTemplate, drawBackground]
    );

    // Initial load and redraw when template changes
    useEffect(() => {
      renderCanvas(items);
    }, [activeTemplate, renderCanvas, items]);

    // Handle saving whenever items change
    const emitSave = useCallback(
      (currentItems: DiagramItem[]) => {
        if (!onSave || !canvasRef.current) return;
        if (currentItems.length === 0) {
          onSave('');
        } else {
          onSave(canvasRef.current.toDataURL('image/png'));
        }
      },
      [onSave]
    );

    const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const pos = getPos(e);

      if (activeTool === 'text') {
        const textToPlace = (customLabelInput.trim() || activeStamp).trim();
        if (!textToPlace) return;

        const newItem: DiagramText = {
          type: 'text',
          text: textToPlace,
          color: activeColor,
          x: pos.x,
          y: pos.y,
        };

        const updated = [...items, newItem];
        setItems(updated);
        setUndoStack([]);
        renderCanvas(updated);
        emitSave(updated);
        return;
      }

      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDrawing(true);
      currentPointsRef.current = [pos];
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing || activeTool === 'text') return;
      const pos = getPos(e);
      currentPointsRef.current.push(pos);

      const liveStroke: DiagramStroke = {
        type: 'stroke',
        tool: activeTool,
        color: activeColor,
        width: lineWidth,
        points: currentPointsRef.current,
      };

      renderCanvas(items, liveStroke);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing || activeTool === 'text') return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDrawing(false);

      if (currentPointsRef.current.length >= 2) {
        const newStroke: DiagramStroke = {
          type: 'stroke',
          tool: activeTool,
          color: activeColor,
          width: lineWidth,
          points: currentPointsRef.current,
        };

        const updated = [...items, newStroke];
        setItems(updated);
        setUndoStack([]);
        renderCanvas(updated);
        emitSave(updated);
      }

      currentPointsRef.current = [];
    };

    const handleUndo = () => {
      if (items.length === 0) return;
      const last = items[items.length - 1];
      const remaining = items.slice(0, -1);
      setUndoStack((prev) => [...prev, [last]]);
      setItems(remaining);
      renderCanvas(remaining);
      emitSave(remaining);
    };

    const handleRedo = () => {
      if (undoStack.length === 0) return;
      const toRestore = undoStack[undoStack.length - 1];
      const remainingUndo = undoStack.slice(0, -1);
      const updated = [...items, ...toRestore];
      setUndoStack(remainingUndo);
      setItems(updated);
      renderCanvas(updated);
      emitSave(updated);
    };

    const handleClear = () => {
      if (items.length === 0) return;
      setUndoStack((prev) => [...prev, items]);
      setItems([]);
      renderCanvas([]);
      emitSave([]);
    };

    useImperativeHandle(ref, () => ({
      getSnapshot: () => {
        return canvasRef.current ? canvasRef.current.toDataURL('image/png') : '';
      },
      hasDiagram: () => items.length > 0 || Boolean(initialImage),
    }));

    const currentLabelPreview = customLabelInput.trim() || activeStamp;

    return (
      <div className="bg-[#181715] border border-white/[0.1] rounded-xl p-3.5 shadow-xl space-y-3">
        {/* Top Control Bar: Presets, Tools, Swatches, Undo */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-white/[0.08]">
          {/* Axis Template Presets */}
          <div className="flex items-center gap-1 bg-[#252320] p-1 rounded-lg border border-white/[0.08] text-xs font-mono-code">
            <span className="text-[10px] text-[#79766e] uppercase font-semibold px-1.5">Axes:</span>
            {(Object.keys(TEMPLATE_CONFIGS) as AxisTemplate[]).map((tmpl) => (
              <button
                key={tmpl}
                type="button"
                onClick={() => setActiveTemplate(tmpl)}
                className={`px-2 py-0.5 rounded transition ${activeTemplate === tmpl
                    ? 'bg-[#cc785c] text-white font-semibold shadow-sm'
                    : 'text-[#a09d96] hover:text-[#faf9f5] hover:bg-white/[0.04]'
                  }`}
              >
                {TEMPLATE_CONFIGS[tmpl].label}
              </button>
            ))}
          </div>

          {/* Tools: Curve vs Straight Line vs Text Label */}
          <div className="flex items-center gap-1 bg-[#252320] p-1 rounded-lg border border-white/[0.08] text-xs font-mono-code">
            <button
              type="button"
              onClick={() => setActiveTool('curve')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition ${activeTool === 'curve'
                  ? 'bg-white/[0.12] text-white font-semibold'
                  : 'text-[#a09d96] hover:text-[#faf9f5]'
                }`}
              title="Smooth Curve Tool (for demand, supply, AD, SRAS, LRAS)"
            >
              <Pen className="w-3 h-3" />
              <span>Curve</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('line')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition ${activeTool === 'line'
                  ? 'bg-white/[0.12] text-white font-semibold'
                  : 'text-[#a09d96] hover:text-[#faf9f5]'
                }`}
              title="Straight Line Tool (for linear curves, price controls, guides)"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Line</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('text')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition ${activeTool === 'text'
                  ? 'bg-[#cc785c] text-white font-semibold shadow-sm'
                  : 'text-[#a09d96] hover:text-[#faf9f5]'
                }`}
              title="Label Tool (click canvas to place axis or curve labels)"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Label</span>
            </button>
          </div>

          {/* Color Palette Swatches */}
          <div className="flex items-center gap-1.5 bg-[#252320] p-1.5 rounded-lg border border-white/[0.08]">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setActiveColor(c.hex)}
                style={{ backgroundColor: c.hex }}
                className={`w-4 h-4 rounded-full transition-all ${activeColor === c.hex
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#252320] scale-110'
                    : 'opacity-70 hover:opacity-100'
                  }`}
                title={c.name}
              />
            ))}
          </div>

          {/* Action Buttons: Undo, Redo, Clear */}
          <div className="flex items-center gap-1 text-xs font-mono-code">
            <button
              type="button"
              onClick={handleUndo}
              disabled={items.length === 0}
              className="p-1.5 rounded text-[#a09d96] hover:text-[#faf9f5] hover:bg-white/[0.06] disabled:opacity-30 transition"
              title="Undo stroke"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={undoStack.length === 0}
              className="p-1.5 rounded text-[#a09d96] hover:text-[#faf9f5] hover:bg-white/[0.06] disabled:opacity-30 transition"
              title="Redo stroke"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={items.length === 0}
              className="p-1.5 rounded text-[#fca5a5] hover:text-white hover:bg-[#c64545]/30 disabled:opacity-30 transition flex items-center gap-1 ml-1"
              title="Clear diagram curves"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[10px]">Reset</span>
            </button>
          </div>
        </div>

        {/* Secondary Bar when Text / Label tool is active */}
        {activeTool === 'text' && (
          <div className="flex flex-wrap items-center gap-2 p-2 bg-[#252320] rounded-lg border border-white/[0.08] text-xs font-mono-code animate-in fade-in duration-150">
            <div className="flex items-center gap-1 text-[#cc785c]">
              <Tag className="w-3 h-3" />
              <span className="text-[10px] font-semibold uppercase">Click canvas to place:</span>
            </div>

            {/* Quick Economic Chips */}
            <div className="flex flex-wrap items-center gap-1">
              {COMMON_NOTATIONS.map((notation) => (
                <button
                  key={notation}
                  type="button"
                  onClick={() => {
                    setActiveStamp(notation);
                    setCustomLabelInput('');
                  }}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition ${activeStamp === notation && !customLabelInput
                      ? 'bg-[#cc785c] text-white shadow-sm'
                      : 'bg-[#181715] text-[#a09d96] hover:text-[#faf9f5] border border-white/[0.08]'
                    }`}
                >
                  {notation}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[10px] text-[#79766e]">Custom:</span>
              <input
                type="text"
                value={customLabelInput}
                onChange={(e) => setCustomLabelInput(e.target.value)}
                placeholder="e.g. MSB"
                className="w-16 bg-[#181715] border border-white/[0.1] rounded px-1.5 py-0.5 text-xs text-[#faf9f5] placeholder:text-[#6b6963] outline-none focus:border-[#cc785c]"
              />
            </div>
          </div>
        )}

        {/* Canvas Drawing Surface */}
        <div className="relative bg-white rounded-lg overflow-hidden border border-slate-300 shadow-inner flex justify-center">
          <canvas
            ref={canvasRef}
            width={400}
            height={260}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`w-full max-w-[500px] h-auto aspect-[400/260] touch-none select-none ${activeTool === 'text' ? 'cursor-cell' : 'cursor-crosshair'
              }`}
            style={{ touchAction: 'none' }}
          />
        </div>

        {/* Footer Candidate Status */}
        <div className="flex items-center justify-between text-[11px] text-[#79766e] font-mono-code pt-0.5">
          <span className="text-[#a09d96]">
            {activeTool === 'text'
              ? `Placing label "${currentLabelPreview}" - click on canvas to position`
              : 'Draw curves and lines; use Label tool to mark axes & equilibria'}
          </span>
          <span className="text-[#5db8a6] font-medium">
            {items.length > 0 ? `Attached (${items.length} items)` : 'Canvas Ready'}
          </span>
        </div>
      </div>
    );
  }
);

InlineDiagramCanvas.displayName = 'InlineDiagramCanvas';
