'use client';

import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef, useMemo } from 'react';
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
  /** Reading time: the script can be read but not written on. */
  readOnly?: boolean;
  /** When false, a finger scrolls the page and only pen or mouse writes (palm rejection). */
  fingerDrawing?: boolean;
}

const calculateWorkingHeight = (marks: number, isCompact: boolean): number => {
  const base = isCompact ? 460 : 520;
  const perMark = isCompact ? 45 : 55;
  const computed = base + Math.max(1, marks) * perMark;
  return Math.min(2200, Math.max(base, computed));
};

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
  readOnly = false,
  fingerDrawing = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const boxRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const defaultBoxId = useMemo(() => {
    if (!questionsOnPage || questionsOnPage.length === 0) return 'main';
    return questionsOnPage[0].id || 'main';
  }, [questionsOnPage]);

  const activeBoxIdRef = useRef<string>(defaultBoxId);

  // Helper to partition flat stroke arrays back into their respective boxes
  const parseStrokes = useCallback((strokes: CanvasStroke[] = [], propBoxes?: Record<string, CanvasStroke[]>): Record<string, CanvasStroke[]> => {
    if (propBoxes && Object.keys(propBoxes).length > 0) {
      return { ...propBoxes };
    }
    const map: Record<string, CanvasStroke[]> = {};
    if (strokes && strokes.length > 0) {
      for (const s of strokes) {
        let bId: string = s.boxId && s.boxId !== 'main' ? s.boxId : defaultBoxId;
        // If stroke was saved with a subpart ID (e.g. q10_a), map it to question ID (q10)
        for (const q of questionsOnPage) {
          if (bId.startsWith(`${q.id}_`)) {
            bId = q.id;
            break;
          }
        }
        if (!map[bId]) map[bId] = [];
        map[bId].push(s);
      }
      return map;
    }
    return { [defaultBoxId]: [] };
  }, [defaultBoxId, questionsOnPage]);

  // Internal state for strokes by box
  const [boxStrokes, setBoxStrokes] = useState<Record<string, CanvasStroke[]>>(() => {
    return parseStrokes(initialStrokes, propBoxStrokes);
  });

  const boxStrokesRef = useRef<Record<string, CanvasStroke[]>>(boxStrokes);
  boxStrokesRef.current = boxStrokes;

  const [boxRedoStacks, setBoxRedoStacks] = useState<Record<string, CanvasStroke[][]>>({});
  const [confirmClearBoxId, setConfirmClearBoxId] = useState<string | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<CanvasStroke | null>(null);
  // A finger on the working area scrolls the page instead of drawing
  const touchScrollRef = useRef<{ pointerId: number; lastY: number } | null>(null);

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
    if (readOnly) return;
    const capture = () => {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // pointer already released
      }
    };
    if (e.pointerType === 'touch' && !fingerDrawing) {
      capture();
      touchScrollRef.current = { pointerId: e.pointerId, lastY: e.clientY };
      return;
    }
    capture();
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
    const touchScroll = touchScrollRef.current;
    if (touchScroll && touchScroll.pointerId === e.pointerId) {
      window.scrollBy(0, touchScroll.lastY - e.clientY);
      touchScroll.lastY = e.clientY;
      return;
    }
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
    if (touchScrollRef.current?.pointerId === e.pointerId) {
      touchScrollRef.current = null;
      return;
    }
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

      // Render any SVG diagrams onto composite image so examiner sees coordinate axes & curves
      const svgEls = Array.from(paper.querySelectorAll('svg'));
      for (const svgEl of svgEls) {
        try {
          const svgRect = svgEl.getBoundingClientRect();
          if (svgRect.width > 0 && svgRect.height > 0) {
            const svgXml = new XMLSerializer().serializeToString(svgEl);
            const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();
            await new Promise<void>((resolve) => {
              img.onload = () => {
                const ox = (svgRect.left - paperRect.left) * dpr;
                const oy = (svgRect.top - paperRect.top) * dpr;
                ctx.drawImage(img, ox, oy, svgRect.width * dpr, svgRect.height * dpr);
                URL.revokeObjectURL(url);
                resolve();
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve();
              };
              img.src = url;
            });
          }
        } catch {
          // ignore svg serialization failure
        }
      }

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
      className={`script-sheet paper-surface relative w-full flex flex-col select-text text-ink ${
        compact ? 'px-5 sm:px-8 py-6 sm:py-8' : 'px-5 sm:px-12 py-8 sm:py-12'
      }`}
    >
      {/* Running page head */}
      <div className={`flex items-baseline justify-between gap-4 border-b border-ink shrink-0 ${compact ? 'pb-2 mb-6' : 'pb-3 mb-8'}`}>
        <p className="font-serif text-[15px] sm:text-[16px] font-semibold text-ink truncate">{paperTitle}</p>
        <p className="tabular text-[13px] text-ink-muted shrink-0">Page {pageNumber}</p>
      </div>

      {/* Question content and designated working space */}
      {questionsOnPage.length > 0 ? (
        questionsOnPage.map((q) => {
          const hasSubparts = Array.isArray(q.subparts) && q.subparts.length > 0;
          const cleanNumber = q.number.replace(/^Question\s*/i, '').replace(/\.$/, '').trim();
          const isSectionB = q.promptText.toLowerCase().includes('section b') || q.totalMarks >= 14;
          const cleanedPromptText = q.promptText
            .replace(/^Section\s+[AB]\s*(?:\(Question\s*\d+\))?:\s*/i, '')
            .replace(/^Question\s*\d+:\s*/i, '')
            .trim();

          const workingHeight = calculateWorkingHeight(q.totalMarks, compact);

          return (
            <section key={q.id} aria-label={`Question ${cleanNumber}`} className="flex-1 flex flex-col min-h-0">
              {/* Question: number, prompt, and a right-hand margin column for marks */}
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 sm:gap-x-6 items-baseline">
                <h3 className={`font-serif font-semibold text-ink tabular ${compact ? 'text-[24px]' : 'text-[28px]'} leading-none`}>
                  {cleanNumber}.
                </h3>
                <div className="min-w-0" />
                <div className="text-right">
                  <p className="font-serif text-[15px] font-semibold text-ink whitespace-nowrap">
                    [Maximum mark: {q.totalMarks}]
                  </p>
                  {isSectionB && <p className="mt-1 text-[13px] text-ink-muted">Section B</p>}
                </div>
              </div>

              {cleanedPromptText && (
                <div className={`mt-4 font-serif text-ink leading-[1.65] ${compact ? 'text-[16px]' : 'text-[17px] sm:text-[18px]'} max-w-[68ch]`}>
                  <MathRenderer content={cleanedPromptText} lightMode={true} />
                </div>
              )}

              {q.diagram?.hasDiagram && q.diagram.svgContent && (
                <figure className="my-6 flex flex-col items-center">
                  <div
                    className="w-full max-w-lg overflow-x-auto flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
                    dangerouslySetInnerHTML={{ __html: q.diagram.svgContent }}
                  />
                  {(q.diagram.title || q.diagram.description) && (
                    <figcaption className="mt-3 max-w-[60ch] text-center font-serif italic text-[14px] text-ink-muted">
                      {q.diagram.title && <span className="not-italic font-semibold text-ink">{q.diagram.title}. </span>}
                      {q.diagram.description}
                    </figcaption>
                  )}
                </figure>
              )}

              {hasSubparts && (
                <ol className="mt-5 space-y-4">
                  {q.subparts!.map((sub) => {
                    const isNested = /^\([a-z]\)\([ivx]+\)/i.test(sub.partLetter) || /^\([ivx]+\)/i.test(sub.partLetter);
                    return (
                      <li key={sub.id} className="grid grid-cols-[auto_1fr_auto] gap-x-4 sm:gap-x-6 items-baseline">
                        <span className={`font-serif font-semibold text-[17px] text-ink select-none min-w-[2.25rem] ${isNested ? 'pl-5' : ''}`}>
                          {sub.partLetter}
                        </span>
                        <div className={`font-serif text-ink leading-[1.65] ${compact ? 'text-[16px]' : 'text-[17px] sm:text-[18px]'} max-w-[64ch]`}>
                          <MathRenderer content={sub.promptText} lightMode={true} />
                          {sub.diagram?.hasDiagram && sub.diagram.svgContent && (
                            <div className="my-3 flex justify-center [&>svg]:max-w-full [&>svg]:h-auto">
                              <div dangerouslySetInnerHTML={{ __html: sub.diagram.svgContent }} />
                            </div>
                          )}
                        </div>
                        <span className="font-serif text-[15px] font-semibold text-ink tabular select-none">[{sub.totalMarks}]</span>
                      </li>
                    );
                  })}
                </ol>
              )}

              {/* Working space, sized to the marks available */}
              <div className="mt-8 flex flex-col gap-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-[14px] font-semibold text-ink">Working for question {cleanNumber}</span>
                  <span className="text-[13px] text-ink-muted">
                    {readOnly ? 'Reading time: you cannot write yet' : 'Write your answer inside this box'}
                  </span>
                </div>

                <div
                  ref={(el) => { boxRefs.current[q.id] = el; }}
                  data-boxid={q.id}
                  style={{ minHeight: `${workingHeight}px` }}
                  className="ruled relative w-full border border-paper-rule-strong bg-paper overflow-hidden flex flex-col"
                >
                  {!readOnly && (
                    <div className="absolute top-2 right-2 z-20">
                      {confirmClearBoxId === q.id ? (
                        <div className="flex items-center gap-2 p-1.5 bg-paper border border-paper-rule-strong">
                          <span className="text-[14px] text-ink px-1">Clear this working?</span>
                          <button
                            type="button"
                            onClick={() => {
                              handleClearBox(q.id);
                              setConfirmClearBoxId(null);
                            }}
                            className="btn btn-sm btn-destructive"
                          >
                            Clear
                          </button>
                          <button type="button" onClick={() => setConfirmClearBoxId(null)} className="btn btn-sm btn-quiet-paper">
                            Keep
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmClearBoxId(q.id)}
                          aria-label={`Clear working for question ${cleanNumber}`}
                          className="btn btn-sm btn-quiet-paper"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                          <span className="hidden sm:inline">Clear</span>
                        </button>
                      )}
                    </div>
                  )}

                  <canvas
                    ref={(el) => { canvasRefs.current[q.id] = el; }}
                    role="img"
                    aria-label={`Handwritten working for question ${cleanNumber}`}
                    onPointerDown={(e) => handlePointerDown(e, q.id)}
                    onPointerMove={(e) => handlePointerMove(e, q.id)}
                    onPointerUp={(e) => handlePointerUp(e, q.id)}
                    onPointerCancel={(e) => handlePointerUp(e, q.id)}
                    className={`absolute inset-0 w-full h-full touch-none z-10 ${readOnly ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
                  />
                </div>
              </div>
            </section>
          );
        })
      ) : (
        <p className="flex-1 flex items-center justify-center font-serif italic text-ink-muted">
          No questions on this page.
        </p>
      )}
    </div>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';
