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
  standard: { label: 'L-axes' },
  cross: { label: 'Four quadrants' },
  blank: { label: 'Blank' },
};

/** Plain ink colours: named for the ink, never for an economic meaning (ADR-0002). */
const COLOR_PALETTE = [
  { name: 'Blue-black', hex: '#1a2238' },
  { name: 'Blue', hex: '#1d5bbf' },
  { name: 'Green', hex: '#2f7d4f' },
  { name: 'Red', hex: '#b3261e' },
  { name: 'Grey', hex: '#4b5563' },
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

    const segment = (active: boolean) =>
      `min-h-11 px-3 flex items-center gap-1.5 text-[14px] font-medium border-r border-paper-rule last:border-r-0 transition-colors ${
        active ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-paper-tint'
      }`;

    return (
      <div className="paper-surface space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Axes" className="flex border border-paper-rule-strong">
            {(Object.keys(TEMPLATE_CONFIGS) as AxisTemplate[]).map((tmpl) => (
              <button
                key={tmpl}
                type="button"
                onClick={() => setActiveTemplate(tmpl)}
                aria-pressed={activeTemplate === tmpl}
                className={segment(activeTemplate === tmpl)}
              >
                {TEMPLATE_CONFIGS[tmpl].label}
              </button>
            ))}
          </div>

          <div role="group" aria-label="Drawing tool" className="flex border border-paper-rule-strong">
            <button type="button" onClick={() => setActiveTool('curve')} aria-pressed={activeTool === 'curve'} className={segment(activeTool === 'curve')}>
              <Pen className="w-4 h-4" aria-hidden="true" />
              Curve
            </button>
            <button type="button" onClick={() => setActiveTool('line')} aria-pressed={activeTool === 'line'} className={segment(activeTool === 'line')}>
              <Minus className="w-4 h-4" aria-hidden="true" />
              Line
            </button>
            <button type="button" onClick={() => setActiveTool('text')} aria-pressed={activeTool === 'text'} className={segment(activeTool === 'text')}>
              <Type className="w-4 h-4" aria-hidden="true" />
              Label
            </button>
          </div>

          <div role="group" aria-label="Ink colour" className="flex items-center">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setActiveColor(c.hex)}
                aria-pressed={activeColor === c.hex}
                aria-label={`${c.name} ink`}
                title={c.name}
                className="min-h-11 min-w-11 flex items-center justify-center"
              >
                <span
                  className={`w-5 h-5 border ${activeColor === c.hex ? 'border-ink outline-2 outline-offset-2 outline-ink' : 'border-paper-rule-strong'}`}
                  style={{ backgroundColor: c.hex }}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center ml-auto">
            <button type="button" onClick={handleUndo} disabled={items.length === 0} title="Undo" className="min-h-11 min-w-11 flex items-center justify-center text-ink disabled:opacity-35">
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Undo</span>
            </button>
            <button type="button" onClick={handleRedo} disabled={undoStack.length === 0} title="Redo" className="min-h-11 min-w-11 flex items-center justify-center text-ink disabled:opacity-35">
              <RotateCw className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Redo</span>
            </button>
            <button type="button" onClick={handleClear} disabled={items.length === 0} className="btn btn-sm btn-quiet-paper ml-1">
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Clear diagram
            </button>
          </div>
        </div>

        {activeTool === 'text' && (
          <div className="flex flex-wrap items-center gap-2 border-t border-paper-rule pt-3">
            <span className="flex items-center gap-1.5 text-[14px] text-ink">
              <Tag className="w-4 h-4" aria-hidden="true" />
              Label to place:
            </span>
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Common labels">
              {COMMON_NOTATIONS.map((notation) => (
                <button
                  key={notation}
                  type="button"
                  onClick={() => {
                    setActiveStamp(notation);
                    setCustomLabelInput('');
                  }}
                  aria-pressed={activeStamp === notation && !customLabelInput}
                  className={`min-h-9 min-w-9 px-2 text-[14px] font-semibold border ${
                    activeStamp === notation && !customLabelInput
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-paper text-ink border-paper-rule-strong hover:bg-paper-tint'
                  }`}
                >
                  {notation}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 ml-auto text-[14px] text-ink-muted">
              Custom
              <input
                type="text"
                value={customLabelInput}
                onChange={(e) => setCustomLabelInput(e.target.value)}
                placeholder="e.g. MSB"
                className="w-24 min-h-9 bg-paper border border-paper-rule-strong px-2 text-[14px] text-ink placeholder:text-ink-muted"
              />
            </label>
          </div>
        )}

        <div className="relative bg-paper border border-paper-rule-strong flex justify-center">
          <canvas
            ref={canvasRef}
            width={400}
            height={260}
            role="img"
            aria-label="Diagram sketchpad"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`w-full max-w-[560px] h-auto aspect-[400/260] touch-none select-none ${activeTool === 'text' ? 'cursor-cell' : 'cursor-crosshair'}`}
            style={{ touchAction: 'none' }}
          />
        </div>

        <p className="text-[13px] text-ink-muted">
          {activeTool === 'text'
            ? `Click the diagram to place "${currentLabelPreview}".`
            : 'Draw curves and lines; use Label to name your axes and curves.'}
          {items.length > 0 && <span className="tabular"> {items.length} marks on the diagram.</span>}
        </p>
      </div>
    );
  }
);

InlineDiagramCanvas.displayName = 'InlineDiagramCanvas';
