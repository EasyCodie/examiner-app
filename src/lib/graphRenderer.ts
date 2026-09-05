export { QUESTION_12_MATPLOTLIB_SVG } from './graphs/q12Graph';

export interface FunctionCurveSpec {
  expression: string;
  domain?: [number, number];
  label?: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted' | '-' | '--' | ':';
  width?: number;
  numPoints?: number;
}

export interface PiecewiseSpec {
  pieces: Array<{
    domain: [number, number];
    expression: string;
  }>;
  label?: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted' | '-' | '--' | ':';
  width?: number;
}

export interface KeyPointSpec {
  x: number;
  y: number;
  type?: 'solid' | 'open';
  label?: string;
  color?: string;
  size?: number;
  ha?: 'left' | 'center' | 'right';
  va?: 'top' | 'center' | 'bottom';
  offsetX?: number;
  offsetY?: number;
}

export interface AsymptoteSpec {
  type: 'vertical' | 'horizontal';
  value: number;
  label?: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted' | '-' | '--' | ':';
  width?: number;
}

export interface ShadingRegionSpec {
  expression?: string;
  topExpression?: string;
  bottomExpression?: string;
  domain?: [number, number];
  color?: string;
  label?: string;
}

export interface TextAnnotationSpec {
  x: number;
  y: number;
  text: string;
  color?: string;
  fontsize?: number;
  ha?: 'left' | 'center' | 'right';
  va?: 'top' | 'center' | 'bottom';
}

export interface CartesianGraphSpec {
  title?: string;
  theme?: 'exam' | 'obsidian' | 'transparent';
  xRange?: [number, number];
  yRange?: [number, number];
  xStep?: number;
  yStep?: number;
  xTicks?: number[];
  yTicks?: number[];
  minorXStep?: number;
  minorYStep?: number;
  width?: number;
  height?: number;
  grid?: boolean;
  showAxes?: boolean;
  xLabel?: string;
  yLabel?: string;
  originLabel?: string;
  curves?: FunctionCurveSpec[];
  piecewise?: PiecewiseSpec[];
  points?: KeyPointSpec[];
  asymptotes?: AsymptoteSpec[];
  shading?: ShadingRegionSpec[];
  annotations?: TextAnnotationSpec[];
}

/**
 * Universal Cartesian plane graph renderer for client components and UI:
 * Dispatches a POST request to /api/render-graph to generate high-precision matplotlib SVG.
 */
export async function renderCartesianGraph(spec: CartesianGraphSpec): Promise<string> {
  const res = await fetch('/api/render-graph', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(spec),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Unknown graph rendering error' }));
    throw new Error(errData.error || 'Failed to render Cartesian graph');
  }

  const data = await res.json();
  return data.svg;
}

/**
 * Standard preset for Question 12's authentic IB piecewise function graph.
 * Fully labels all integer coordinates along x and y axes for accurate reading,
 * while omitting extraneous on-curve coordinate leaks per exam guidelines.
 */
export function getQuestion12GraphSpec(theme: 'exam' | 'obsidian' = 'exam'): CartesianGraphSpec {
  const isExam = theme === 'exam';
  return {
    theme,
    xRange: [-5, 7],
    yRange: [-7, 9],
    xStep: 1,
    yStep: 1,
    grid: true,
    showAxes: true,
    originLabel: '0',
    piecewise: [
      {
        pieces: [
          { domain: [-4, 0], expression: '4' },
          { domain: [0, 6], expression: '6 - 0.5 * (x - 2)**2' },
        ],
        color: isExam ? '#0f172a' : '#f54e00',
        width: 2.2,
      },
    ],
    points: [
      {
        x: -4,
        y: 4,
        type: 'solid',
        color: isExam ? '#0f172a' : '#f3f3f2',
        size: 5.5,
      },
      {
        x: 6,
        y: -2,
        type: 'solid',
        color: isExam ? '#0f172a' : '#f3f3f2',
        size: 5.5,
      },
    ],
  };
}
