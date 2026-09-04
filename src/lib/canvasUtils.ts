import { CanvasStroke } from '@/types/exam';

/**
 * Headless offscreen renderer that turns raw vector CanvasStroke[]
 * into a high-DPI authentic examination canvas PNG image.
 */
export function renderStrokesToPng(
  strokes: CanvasStroke[],
  width = 800,
  height = 900
): string {
  if (typeof document === 'undefined') return '';
  const offscreen = document.createElement('canvas');
  const dpr = 2; // High-DPI rasterization
  offscreen.width = width * dpr;
  offscreen.height = height * dpr;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return '';

  ctx.scale(dpr, dpr);

  // 1. Crisp white paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 2. Working box boundary border
  const margin = 20;
  const boxX = margin;
  const boxY = 60;
  const boxW = width - margin * 2;
  const boxH = height - boxY - margin;

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // 3. Exam paper subtle rule lines
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  for (let y = boxY + 28; y < boxY + boxH; y += 28) {
    ctx.beginPath();
    ctx.moveTo(boxX + 2, y);
    ctx.lineTo(boxX + boxW - 2, y);
    ctx.stroke();
  }

  // 4. Render all strokes onto the offscreen working box
  for (const stroke of strokes) {
    if (!stroke.points || stroke.points.length === 0) continue;
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
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  return offscreen.toDataURL('image/png');
}
