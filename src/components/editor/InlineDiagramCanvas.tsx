'use client';

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Pen, Trash2 } from 'lucide-react';

export interface InlineDiagramCanvasRef {
  getSnapshot: () => string;
  hasDiagram: () => boolean;
}

interface InlineDiagramCanvasProps {
  initialImage?: string;
  onSave?: (base64: string) => void;
}

export const InlineDiagramCanvas = forwardRef<InlineDiagramCanvasRef, InlineDiagramCanvasProps>(({
  initialImage,
  onSave,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(Boolean(initialImage));
  const [strokeHistory, setStrokeHistory] = useState<{ x: number; y: number }[][]>([]);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);

  // Setup canvas resolution
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw grid lines for economics diagrams
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    // Draw axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Y axis
    ctx.moveTo(35, 20);
    ctx.lineTo(35, 240);
    // X axis
    ctx.lineTo(380, 240);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText('Price / Cost', 10, 15);
    ctx.fillText('Quantity (Q)', 320, 255);
    ctx.fillText('0', 22, 252);
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setHasContent(true);
    const pos = getPos(e);
    currentPathRef.current = [pos];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    currentPathRef.current.push(pos);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pts = currentPathRef.current;
    if (pts.length < 2) return;

    ctx.save();
    ctx.strokeStyle = '#2563eb'; // Blue curve for diagrams
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
    ctx.restore();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDrawing(false);
    if (currentPathRef.current.length > 0) {
      setStrokeHistory((prev) => [...prev, currentPathRef.current]);
      currentPathRef.current = [];
    }
    if (onSave && canvasRef.current) {
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(35, 20);
    ctx.lineTo(35, 240);
    ctx.lineTo(380, 240);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText('Price / Cost', 10, 15);
    ctx.fillText('Quantity (Q)', 320, 255);
    ctx.fillText('0', 22, 252);

    setStrokeHistory([]);
    setHasContent(false);
    onSave?.('');
  };

  useImperativeHandle(ref, () => ({
    getSnapshot: () => {
      return canvasRef.current ? canvasRef.current.toDataURL('image/png') : '';
    },
    hasDiagram: () => hasContent && strokeHistory.length > 0,
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Pen className="w-3.5 h-3.5 text-blue-400" />
          Economic / Scientific Diagram Sketchpad
        </span>
        <button
          type="button"
          onClick={clearCanvas}
          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:bg-rose-950/40 px-2 py-1 rounded transition"
        >
          <Trash2 className="w-3 h-3" />
          Clear Axes
        </button>
      </div>

      <div className="relative bg-white rounded-lg overflow-hidden border border-slate-300 shadow-inner">
        <canvas
          ref={canvasRef}
          width={400}
          height={260}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
        <span>Draw curves (MPB, MSB, AD/AS, shifts)</span>
        <span className="text-blue-400">Attached directly to submission</span>
      </div>
    </div>
  );
});

InlineDiagramCanvas.displayName = 'InlineDiagramCanvas';
