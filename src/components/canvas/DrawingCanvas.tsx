'use client';

import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { CanvasStroke, QuestionItem } from '@/types/exam';
import { MathRenderer } from '@/components/common/MathRenderer';
import { Trash2 } from 'lucide-react';

export interface DrawingCanvasRef {
  exportCompositeImage: () => Promise<string>;
  exportBoxImages: () => Promise<Record<string, string>>;
  getCanvasSnapshot: () => string;
  clear: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface DrawingCanvasProps {
  pageNumber: number;
  questionsOnPage: QuestionItem[];
  paperTitle: string;
  tool: 'pen' | 'highlighter' | 'eraser';
  color: string;
  width: number;
  initialStrokes?: CanvasStroke[];
  boxStrokes?: Record<string, CanvasStroke[]>;
  onStrokesChange?: (strokes: CanvasStroke[]) => void;
  onBoxStrokesChange?: (boxStrokes: Record<string, CanvasStroke[]>) => void;
  onToolChange?: (canUndo: boolean, canRedo: boolean) => void;
  compact?: boolean;
}

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({
  pageNumber,
  questionsOnPage,
  paperTitle,
  tool,
  color,
  width,
  initialStrokes = [],
  boxStrokes: propBoxStrokes,
  onStrokesChange,
  onBoxStrokesChange,
  onToolChange,
  compact = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const boxRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const activeBoxIdRef = useRef<string>('main');

  // Helper to partition flat stroke arrays back into their respective boxes
  const parseStrokes = useCallback((strokes: CanvasStroke[] = [], propBoxes?: Record<string, CanvasStroke[]>): Record<string, CanvasStroke[]> => {
    if (propBoxes && Object.keys(propBoxes).length > 0) {
      return { ...propBoxes };
    }
    const map: Record<string, CanvasStroke[]> = {};
    if (strokes && strokes.length > 0) {
      for (const s of strokes) {
        const bId = s.boxId || 'main';
        if (!map[bId]) map[bId] = [];
        map[bId].push(s);
      }
      return map;
    }
    return { main: [] };
  }, []);

  // Internal state for strokes by box
  const [boxStrokes, setBoxStrokes] = useState<Record<string, CanvasStroke[]>>(() => {
    return parseStrokes(initialStrokes, propBoxStrokes);
  });

  const boxStrokesRef = useRef<Record<string, CanvasStroke[]>>(boxStrokes);
  boxStrokesRef.current = boxStrokes;

  const [boxRedoStacks, setBoxRedoStacks] = useState<Record<string, CanvasStroke[][]>>({});
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<CanvasStroke | null>(null);

  // Sync with prop changes when parent provides structured boxStrokes
  useEffect(() => {
    if (propBoxStrokes && Object.keys(propBoxStrokes).length > 0) {
      setBoxStrokes(propBoxStrokes);
      boxStrokesRef.current = propBoxStrokes;
    }
  }, [propBoxStrokes]);

  // Update undo/redo availability based on active box
  useEffect(() => {
    const activeId = activeBoxIdRef.current;
    const strokes = boxStrokes[activeId] || [];
    const redoStack = boxRedoStacks[activeId] || [];
    onToolChange?.(strokes.length > 0, redoStack.length > 0);
  }, [boxStrokes, boxRedoStacks, onToolChange]);

  // Redraw strokes for a specific box
  const redrawBox = useCallback((boxId: string) => {
    const canvas = canvasRefs.current[boxId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset coordinate transform temporarily to clear the full physical canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    const strokes = boxStrokesRef.current[boxId] || [];

    strokes.forEach((s) => {
      if (!s.points || s.points.length === 0) return;

      ctx.save();
      if (s.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = s.width * 3;
      } else if (s.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width * 2;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (s.points.length === 1) {
        ctx.beginPath();
        ctx.arc(s.points[0].x, s.points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);

        for (let i = 1; i < s.points.length - 1; i++) {
          const xc = (s.points[i].x + s.points[i + 1].x) / 2;
          const yc = (s.points[i].y + s.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(s.points[i].x, s.points[i].y, xc, yc);
        }

        const last = s.points[s.points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }

      ctx.restore();
    });
  }, []);

  // Resize a specific box canvas to match its container dimensions
  const resizeBox = useCallback((boxId: string) => {
    const box = boxRefs.current[boxId];
    const canvas = canvasRefs.current[boxId];
    if (!box || !canvas) return;

    const rect = box.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.round(rect.width * dpr);
    const targetH = Math.round(rect.height * dpr);

    // Only reallocate bitmap buffer when physical dimensions actually changed
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      redrawBox(boxId);
    }
  }, [redrawBox]);

  // Set up ResizeObserver for automatic, responsive sizing of all boxes
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const targetBoxId = (entry.target as HTMLElement).dataset?.boxid;
        if (targetBoxId) {
          resizeBox(targetBoxId);
        }
      }
    });

    Object.entries(boxRefs.current).forEach(([boxId, el]) => {
      if (el) {
        el.dataset.boxid = boxId;
        observer.observe(el);
        resizeBox(boxId);
      }
    });

    const handleWindowResize = () => {
      Object.keys(boxRefs.current).forEach((boxId) => resizeBox(boxId));
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [resizeBox, pageNumber]);

  // Pointer position relative to specific box canvas
  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>, boxId: string) => {
    const canvas = canvasRefs.current[boxId];
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>, boxId: string) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    activeBoxIdRef.current = boxId;
    const pos = getPointerPos(e, boxId);

    const strokeColor = tool === 'highlighter' && !color.includes('rgba')
      ? 'rgba(250, 204, 21, 0.45)'
      : color;

    const newStroke: CanvasStroke = {
      points: [pos],
      color: strokeColor,
      width,
      tool,
      timestamp: Date.now(),
      boxId,
    };

    currentStrokeRef.current = newStroke;

    const canvas = canvasRefs.current[boxId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = width * 3;
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width * 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.restore();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>, boxId: string) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    const pos = getPointerPos(e, boxId);
    const stroke = currentStrokeRef.current;
    stroke.points.push(pos);

    const canvas = canvasRefs.current[boxId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = stroke.width * 3;
    } else if (stroke.tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width * 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pts = stroke.points;
    if (pts.length >= 2) {
      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>, boxId: string) => {
    if (!isDrawingRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    isDrawingRef.current = false;

    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      const prevStrokes = boxStrokesRef.current[boxId] || [];
      const updated = [...prevStrokes, currentStrokeRef.current];

      const newBoxStrokes = { ...boxStrokesRef.current, [boxId]: updated };
      boxStrokesRef.current = newBoxStrokes;
      setBoxStrokes(newBoxStrokes);
      setBoxRedoStacks((prev) => ({ ...prev, [boxId]: [] }));

      onBoxStrokesChange?.(newBoxStrokes);
      // Flatten all strokes for single-array backwards compatibility
      const allStrokes = Object.values(newBoxStrokes).flat();
      onStrokesChange?.(allStrokes);
    }
    currentStrokeRef.current = null;
  };

  const handleClearBox = useCallback((boxId: string) => {
    const prev = boxStrokesRef.current[boxId] || [];
    if (prev.length === 0) return;

    setBoxRedoStacks((stk) => ({ ...stk, [boxId]: [...(stk[boxId] || []), prev] }));
    const newBoxStrokes = { ...boxStrokesRef.current, [boxId]: [] };
    boxStrokesRef.current = newBoxStrokes;
    setBoxStrokes(newBoxStrokes);

    const canvas = canvasRefs.current[boxId];
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    }

    onBoxStrokesChange?.(newBoxStrokes);
    const allStrokes = Object.values(newBoxStrokes).flat();
    onStrokesChange?.(allStrokes);
  }, [onBoxStrokesChange, onStrokesChange]);

  const handleUndo = useCallback(() => {
    const activeId = activeBoxIdRef.current;
    const strokes = boxStrokesRef.current[activeId] || [];
    if (strokes.length === 0) return;

    const last = strokes[strokes.length - 1];
    const remaining = strokes.slice(0, -1);

    setBoxRedoStacks((stk) => ({
      ...stk,
      [activeId]: [...(stk[activeId] || []), [last]],
    }));

    const newBoxStrokes = { ...boxStrokesRef.current, [activeId]: remaining };
    boxStrokesRef.current = newBoxStrokes;
    setBoxStrokes(newBoxStrokes);
    redrawBox(activeId);

    onBoxStrokesChange?.(newBoxStrokes);
    onStrokesChange?.(Object.values(newBoxStrokes).flat());
  }, [onBoxStrokesChange, onStrokesChange, redrawBox]);

  const handleRedo = useCallback(() => {
    const activeId = activeBoxIdRef.current;
    const redoStack = boxRedoStacks[activeId] || [];
    if (redoStack.length === 0) return;

    const toRestore = redoStack[redoStack.length - 1];
    const remainingRedo = redoStack.slice(0, -1);
    const strokes = boxStrokesRef.current[activeId] || [];
    const updated = [...strokes, ...toRestore];

    setBoxRedoStacks((stk) => ({ ...stk, [activeId]: remainingRedo }));
    const newBoxStrokes = { ...boxStrokesRef.current, [activeId]: updated };
    boxStrokesRef.current = newBoxStrokes;
    setBoxStrokes(newBoxStrokes);
    redrawBox(activeId);

    onBoxStrokesChange?.(newBoxStrokes);
    onStrokesChange?.(Object.values(newBoxStrokes).flat());
  }, [boxRedoStacks, onBoxStrokesChange, onStrokesChange, redrawBox]);

  // Imperative handle
  useImperativeHandle(ref, () => ({
    canUndo: (boxStrokes[activeBoxIdRef.current] || []).length > 0,
    canRedo: (boxRedoStacks[activeBoxIdRef.current] || []).length > 0,
    undo: handleUndo,
    redo: handleRedo,
    clear: () => handleClearBox(activeBoxIdRef.current),
    getCanvasSnapshot: () => {
      const activeCanvas = canvasRefs.current[activeBoxIdRef.current] || Object.values(canvasRefs.current)[0];
      return activeCanvas ? activeCanvas.toDataURL('image/png') : '';
    },
    exportBoxImages: async () => {
      const result: Record<string, string> = {};
      const dpr = window.devicePixelRatio || 1;

      for (const boxId of Object.keys(boxRefs.current)) {
        const box = boxRefs.current[boxId];
        const canvas = canvasRefs.current[boxId];
        if (!box || !canvas) continue;

        const offscreen = document.createElement('canvas');
        offscreen.width = box.clientWidth * dpr;
        offscreen.height = box.clientHeight * dpr;
        const ctx = offscreen.getContext('2d');
        if (!ctx) continue;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, offscreen.width, offscreen.height);

        // Draw border
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2 * dpr;
        ctx.strokeRect(0, 0, offscreen.width, offscreen.height);

        // Draw canvas ink
        ctx.drawImage(canvas, 0, 0);
        result[boxId] = offscreen.toDataURL('image/png');
      }
      return result;
    },
    exportCompositeImage: async () => {
      const paper = containerRef.current;
      if (!paper) return '';

      const dpr = window.devicePixelRatio || 1;
      const offscreen = document.createElement('canvas');
      offscreen.width = paper.clientWidth * dpr;
      offscreen.height = paper.clientHeight * dpr;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return '';

      // Fill white authentic exam paper background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);

      const paperRect = paper.getBoundingClientRect();

      // Draw all working boxes and their strokes onto composite
      for (const boxId of Object.keys(boxRefs.current)) {
        const box = boxRefs.current[boxId];
        const canvas = canvasRefs.current[boxId];
        if (!box || !canvas) continue;

        const boxRect = box.getBoundingClientRect();
        const offsetX = (boxRect.left - paperRect.left) * dpr;
        const offsetY = (boxRect.top - paperRect.top) * dpr;
        const boxW = box.clientWidth * dpr;
        const boxH = box.clientHeight * dpr;

        // Border
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2 * dpr;
        ctx.strokeRect(offsetX, offsetY, boxW, boxH);

        // Ink
        ctx.drawImage(canvas, offsetX, offsetY);
      }

      return offscreen.toDataURL('image/png');
    },
  }));

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-white rounded-xl shadow-xl border border-slate-300 flex flex-col select-none text-slate-900 ${
        compact ? 'p-5 sm:p-7 min-h-[760px]' : 'p-6 sm:p-10 min-h-[960px]'
      }`}
    >
      {/* Clean Authentic Paper Header */}
      <div
        className={`border-b border-slate-300 flex items-start justify-between shrink-0 ${
          compact ? 'pb-2.5 mb-3.5' : 'pb-3 mb-5'
        }`}
      >
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 font-mono-code">
            International Baccalaureate Organization
          </div>
          <h2 className="text-base font-bold font-serif text-slate-950 mt-0.5">{paperTitle}</h2>
        </div>
        <div className="text-right">
          <span className="font-mono-code text-xs font-bold text-slate-800">PAGE {pageNumber}</span>
        </div>
      </div>

      {/* Question Content & Scrollable Subquestions */}
      {questionsOnPage.length > 0 ? (
        questionsOnPage.map((q) => {
          const hasSubparts = Array.isArray(q.subparts) && q.subparts.length > 0;

          return (
            <div key={q.id} className="flex-1 flex flex-col min-h-0 space-y-6">
              {/* Main Question Title & Mark Count */}
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-2 shrink-0">
                <h3 className="text-lg font-bold font-serif text-slate-950">
                  {q.number.replace(/^Question\s*/i, '')}
                </h3>
                <span className="text-xs font-bold font-mono-code text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                  [{q.totalMarks} marks]
                </span>
              </div>

              {/* Top-Level Mathematical Diagram / SVG Graph */}
              {q.diagram?.hasDiagram && q.diagram.svgContent && (
                <div className="p-4 bg-white rounded-lg border border-slate-300 shadow-sm flex flex-col items-center">
                  {q.diagram.title && (
                    <div className="text-xs font-mono-code font-bold text-slate-800 mb-2">
                      {q.diagram.title}
                    </div>
                  )}
                  <div
                    className="w-full max-w-lg overflow-x-auto flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
                    dangerouslySetInnerHTML={{ __html: q.diagram.svgContent }}
                  />
                  {q.diagram.description && (
                    <div className="text-[11px] text-slate-500 font-serif italic mt-2 text-center">
                      {q.diagram.description}
                    </div>
                  )}
                </div>
              )}

              {/* Main Question Preamble / LaTeX Prompt */}
              {q.promptText && (
                <div
                  className={`text-slate-900 leading-relaxed bg-slate-50/80 rounded-lg border border-slate-200 shrink-0 ${
                    compact ? 'text-xs sm:text-sm p-3.5' : 'text-sm p-4'
                  }`}
                >
                  <MathRenderer content={q.promptText} lightMode={true} />
                </div>
              )}

              {/* Case 1: Multiple Subparts (Scroll down to reach subquestions a, b, c) */}
              {hasSubparts ? (
                <div className="space-y-8 mt-4">
                  {q.subparts!.map((sub, sIdx) => {
                    const boxId = sub.id || `${q.id}_${sIdx}`;

                    return (
                      <div
                        key={boxId}
                        className="bg-white rounded-xl border border-slate-300 p-5 shadow-sm space-y-4"
                      >
                        {/* Subquestion Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="text-sm font-bold font-serif text-slate-900 flex items-center gap-1.5">
                            <span className="font-mono-code text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                              {sub.partLetter}
                            </span>
                            <span>Subquestion {sub.partLetter}</span>
                          </span>
                          <span className="text-xs font-mono-code font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            [{sub.totalMarks} marks]
                          </span>
                        </div>

                        {/* Subpart Prompt */}
                        <div className="text-sm text-slate-800 leading-relaxed bg-slate-50/60 p-3 rounded-lg border border-slate-200">
                          <MathRenderer content={sub.promptText} lightMode={true} />
                        </div>

                        {/* Subpart Diagram if specific to part */}
                        {sub.diagram?.hasDiagram && sub.diagram.svgContent && (
                          <div className="p-3 bg-white rounded border border-slate-200 flex justify-center [&>svg]:max-w-full [&>svg]:h-auto">
                            <div dangerouslySetInnerHTML={{ __html: sub.diagram.svgContent }} />
                          </div>
                        )}

                        {/* Subpart Working Box */}
                        <div
                          ref={(el) => { boxRefs.current[boxId] = el; }}
                          data-boxid={boxId}
                          className="relative w-full rounded-lg border-2 border-slate-400 bg-white overflow-hidden min-h-[460px] flex flex-col"
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:100%_28px] pointer-events-none" />

                          {/* Clear Button */}
                          <div className="absolute top-3 right-3 z-20 pointer-events-auto">
                            <button
                              type="button"
                              onClick={() => handleClearBox(boxId)}
                              title={`Clear working for ${sub.partLetter}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#cf2d56]/10 text-slate-700 hover:text-[#cf2d56] border border-slate-300 shadow-sm text-xs font-mono-code transition active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Clear</span>
                            </button>
                          </div>

                          <canvas
                            ref={(el) => { canvasRefs.current[boxId] = el; }}
                            onPointerDown={(e) => handlePointerDown(e, boxId)}
                            onPointerMove={(e) => handlePointerMove(e, boxId)}
                            onPointerUp={(e) => handlePointerUp(e, boxId)}
                            onPointerCancel={(e) => handlePointerUp(e, boxId)}
                            className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Case 2: Single Question (no subparts) */
                <div
                  ref={(el) => { boxRefs.current['main'] = el; }}
                  data-boxid="main"
                  className={`relative flex-1 w-full rounded-lg border-2 border-slate-400 bg-white overflow-hidden flex flex-col ${
                    compact ? 'min-h-[500px]' : 'min-h-[620px]'
                  }`}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:100%_28px] pointer-events-none" />

                  {/* Clear Button */}
                  <div className="absolute top-3 right-3 z-20 pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => handleClearBox('main')}
                      title="Clear working"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#cf2d56]/10 text-slate-700 hover:text-[#cf2d56] border border-slate-300 shadow-sm text-xs font-mono-code transition active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  </div>

                  <canvas
                    ref={(el) => { canvasRefs.current['main'] = el; }}
                    onPointerDown={(e) => handlePointerDown(e, 'main')}
                    onPointerMove={(e) => handlePointerMove(e, 'main')}
                    onPointerUp={(e) => handlePointerUp(e, 'main')}
                    onPointerCancel={(e) => handlePointerUp(e, 'main')}
                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
                  />
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 font-serif italic">
          No question items indexed on this page.
        </div>
      )}
    </div>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';
