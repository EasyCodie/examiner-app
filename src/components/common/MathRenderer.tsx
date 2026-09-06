'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  lightMode?: boolean;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeRenderKaTeX(tex: string, displayMode: boolean): string {
  if (!tex || !tex.trim()) return '';
  const trimmed = tex.trim();

  try {
    return katex.renderToString(trimmed, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
    });
  } catch {
    try {
      // Clean common syntax slips and retry
      const cleaned = trimmed
        .replace(/\\\\/g, '\\')
        .replace(/\s+/g, ' ');
      return katex.renderToString(cleaned, {
        displayMode,
        throwOnError: false,
        output: 'htmlAndMathml',
        strict: false,
      });
    } catch {
      return `<span class="font-serif italic tracking-wide">${escapeHtml(trimmed)}</span>`;
    }
  }
}

const MATH_FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'arcsin', 'arccos', 'arctan',
  'sinh', 'cosh', 'tanh',
  'ln', 'log', 'exp',
  'lim', 'max', 'min',
  'det', 'dim', 'ker',
  'gcd', 'lcm', 'mod',
  'deg', 'arg',
  'fof', 'gog', 'fog', 'gof',
  'dx', 'dy', 'dt', 'du', 'dv', 'dz'
]);

function isProseWord(word: string): boolean {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length < 2) return false;
  return !MATH_FUNCTIONS.has(clean);
}

function hasProseWords(str: string): boolean {
  const words = str.match(/[a-zA-Z]+/g);
  if (!words) return false;
  for (const w of words) {
    if (isProseWord(w)) return true;
  }
  return false;
}

/**
 * Smart Math Normalizer: Converts ASCII math notations commonly found
 * in raw exam prompts or LLM extractions into valid LaTeX syntax.
 */
function normalizeAsciiMath(expr: string): string {
  let s = expr.trim();

  // If already a structured LaTeX environment (matrix, array, etc.), pass through untouched
  if (/\\begin\{(aligned|matrix|pmatrix|bmatrix|vmatrix|cases|equation|align\*?|gather\*?|array)\}/.test(s)) {
    return s;
  }

  // Normalize composite functions like (fof)(x) -> (f \circ f)(x)
  s = s.replace(/\b([fgh])o([fgh])\b/gi, '$1 \\circ $2');

  // 1. Unicode mathematical symbols to standard LaTeX
  s = s
    .replace(/×/g, '\\times ')
    .replace(/÷/g, '\\div ')
    .replace(/≤/g, '\\le ')
    .replace(/≥/g, '\\ge ')
    .replace(/≠/g, '\\ne ')
    .replace(/≈/g, '\\approx ')
    .replace(/±/g, '\\pm ')
    .replace(/∞/g, '\\infty ')
    .replace(/∈/g, '\\in ')
    .replace(/∉/g, '\\notin ')
    .replace(/∪/g, '\\cup ')
    .replace(/∩/g, '\\cap ')
    .replace(/⊂/g, '\\subset ')
    .replace(/θ/g, '\\theta ')
    .replace(/π/g, '\\pi ')
    .replace(/α/g, '\\alpha ')
    .replace(/β/g, '\\beta ')
    .replace(/λ/g, '\\lambda ')
    .replace(/σ/g, '\\sigma ')
    .replace(/Δ/g, '\\Delta ')
    .replace(/ℤ/g, '\\mathbb{Z}')
    .replace(/ℝ/g, '\\mathbb{R}')
    .replace(/ℚ/g, '\\mathbb{Q}')
    .replace(/ℕ/g, '\\mathbb{N}')
    .replace(/ℂ/g, '\\mathbb{C}')
    .replace(/∫/g, '\\int ')
    .replace(/∑/g, '\\sum ');

  // 2. Implication and function arrows
  s = s.replace(/=>/g, ' \\implies ');
  s = s.replace(/->/g, ' \\to ');

  // 3. Roots: √(1+x) or \sqrt(1+x)
  s = s.replace(/√\(([^)]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/√\{([^}]+)\}/g, '\\sqrt{$1}');
  s = s.replace(/√([0-9a-zA-Z]+)/g, '\\sqrt{$1}');
  s = s.replace(/√/g, '\\surd ');
  s = s.replace(/\\?sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/\\?sqrt\{([^}]+)\}/g, '\\sqrt{$1}');

  // 4. Calculus derivatives: d/dx [ ... ] -> \frac{d}{dx}\left[ ... \right]
  s = s.replace(/\bd\/dx\s*\[(.*?)\]/g, '\\frac{d}{dx}\\left[$1\\right]');
  s = s.replace(/\bd\/dx\s*\((.*?)\)/g, '\\frac{d}{dx}\\left($1\\right)');

  // 5. Higher order derivatives: f^(n)(x) -> f^{(n)}(x)
  s = s.replace(/\b([fghuvy])\^\(([a-zA-Z0-9+\-]+)\)\(([a-z0-9,\s]+)\)/g, '$1^{($2)}($3)');
  s = s.replace(/\b([fghuvy])\^\{([a-zA-Z0-9+\-]+)\}\(([a-z0-9,\s]+)\)/g, '$1^{$2}($3)');

  // 6. Prime derivatives: f''(x) -> f''(x), f'(x) -> f'(x)
  s = s.replace(/\b([fghuvy])('{1,3})\(([a-z0-9,\s]+)\)/g, '$1$2($3)');

  // 7. Negative fraction powers: (-1/4)^(n-1) -> \left(-\frac{1}{4}\right)^{n-1}
  s = s.replace(/\(-([0-9]+)\/([0-9]+)\)\^([a-zA-Z0-9+\-]+)/g, '\\left(-\\frac{$1}{$2}\\right)^{$3}');
  s = s.replace(/\(-([0-9]+)\/([0-9]+)\)\^\(([^)]+)\)/g, '\\left(-\\frac{$1}{$2}\\right)^{$3}');
  s = s.replace(/([a-zA-Z0-9\)])\^\(([^\)]+)\)/g, '$1^{$2}');
  s = s.replace(/([a-zA-Z0-9\)])\^([0-9a-zA-Z]+)(?![^{])/g, '$1^{$2}');

  // 8. Fractions: a/b where both are numbers or simple expressions in parens
  s = s.replace(/\b([0-9]+)\/([0-9]+)\b/g, '\\frac{$1}{$2}');

  // 9. Factorials: (2k-3)! / (k-2)! -> \frac{(2k-3)!}{(k-2)!}
  s = s.replace(/\(([^)]+)\)!\s*\/\s*\(([^)]+)\)!/g, '\\frac{($1)!}{($2)!}');

  // 10. Subscripts: u_1 -> u_1, S_8 -> S_8, u_n -> u_n
  s = s.replace(/\b([a-zA-Z])_([0-9a-zA-Z]+)\b/g, '$1_{$2}');

  // 11. Relations and inequalities
  s = s
    .replace(/<=/g, '\\le ')
    .replace(/>=/g, '\\ge ')
    .replace(/!=/g, '\\ne ');

  // 12. Multiplication asterisks: * -> \times
  s = s.replace(/\s*\*\s*/g, ' \\times ');

  // 13. Set memberships: in Q -> \in \mathbb{Q}, in R -> \in \mathbb{R}, in Z -> \in \mathbb{Z}
  s = s
    .replace(/\b(?:\\in|in)\s+(?:Q|\\mathbb\{Q\})\b/g, '\\in \\mathbb{Q}')
    .replace(/\b(?:\\in|in)\s+(?:R|\\mathbb\{R\})\b/g, '\\in \\mathbb{R}')
    .replace(/\b(?:\\in|in)\s+(?:Z|\\mathbb\{Z\})\b/g, '\\in \\mathbb{Z}')
    .replace(/\b(?:\\in|in)\s+(?:N|\\mathbb\{N\})\b/g, '\\in \\mathbb{N}')
    .replace(/\b(?:\\in|in)\s+(?:C|\\mathbb\{C\})\b/g, '\\in \\mathbb{C}');

  return s;
}

/**
 * Converts a LaTeX \begin{array} table into a beautifully stretched, authentic IB exam HTML table.
 */
function parseLatexArrayToExamTable(arrayTex: string, lightMode = false): string | null {
  const match = arrayTex.match(/\\begin\{array\}\{[^}]*\}([\s\S]*?)\\end\{array\}/);
  if (!match) return null;

  const body = match[1].trim();

  // Split by LaTeX row delimiters: "\\" (escaped as \\ or \\\\)
  const rawRows = body.split(/(?:\\\\|\\newline|\r?\n)(?!\s*[a-zA-Z])/);

  const parsedRows: string[][] = [];

  for (const rawRow of rawRows) {
    const cleanRow = rawRow.replace(/\\*hline/g, '').trim();
    if (!cleanRow) continue;

    const cells = cleanRow.split('&').map((c) => c.trim());
    if (cells.length > 0 && cells.some((c) => c.length > 0)) {
      parsedRows.push(cells);
    }
  }

  if (parsedRows.length < 2) return null;

  const maxCols = Math.max(...parsedRows.map((r) => r.length));

  const tableClass = lightMode
    ? 'w-full max-w-3xl border-collapse border-2 border-slate-900 text-center font-serif my-6 shadow-sm mx-auto'
    : 'w-full max-w-3xl border-collapse border-2 border-white/20 text-center font-serif my-6 shadow-sm mx-auto';

  const cellBorderClass = lightMode
    ? 'border border-slate-800 px-8 py-4 text-slate-950 font-serif'
    : 'border border-white/10 px-8 py-4 text-[#faf9f5] font-serif';

  let html = `<div class="w-full my-6 flex justify-center overflow-x-auto"><table class="${tableClass}"><tbody>`;

  parsedRows.forEach((row, rowIdx) => {
    html += '<tr>';
    const fullRow = [...row];
    while (fullRow.length < maxCols) fullRow.push('');

    fullRow.forEach((cell, cellIdx) => {
      const isFirstCol = cellIdx === 0;
      const isHeaderRow = rowIdx === 0;

      const bgClass = lightMode
        ? (isHeaderRow ? 'bg-slate-50/60 font-semibold' : 'bg-white')
        : (isHeaderRow ? 'bg-white/[0.04] font-semibold text-[#faf9f5]' : 'bg-transparent text-[#faf9f5]');

      const fontClass = isFirstCol ? 'font-semibold' : 'font-normal';
      const cellContent = cell ? safeRenderKaTeX(cell, false) : '&nbsp;';

      html += `<td class="${cellBorderClass} ${bgClass} ${fontClass} text-center align-middle text-[15px]">${cellContent}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  return html;
}

export const MathRenderer: React.FC<MathRendererProps> = React.memo(({
  content,
  className = '',
  lightMode = false,
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    let text = content;

    // Normalize escaped backslashes from JSON payloads (e.g. \\frac -> \frac),
    // but preserve double backslashes that represent newlines (\\).
    text = text.replace(/\\\\([a-zA-Z\{\}\[\]\(\)\$])/g, '\\$1');

    const placeholders = new Map<string, string>();
    let placeholderId = 0;

    const saveToken = (rendered: string): string => {
      const key = `@@@MATH_TOKEN_${placeholderId++}@@@`;
      placeholders.set(key, rendered);
      return key;
    };

    // PHASE 1: Delimited block math ($$...$$ and \[...\])
    // If the block contains a LaTeX \begin{array} table, convert to stretched authentic exam table.
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      if (math.includes('\\begin{array}')) {
        const examTable = parseLatexArrayToExamTable(math, lightMode);
        if (examTable) return saveToken(examTable);
      }
      return saveToken(safeRenderKaTeX(normalizeAsciiMath(math), true));
    });
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
      if (math.includes('\\begin{array}')) {
        const examTable = parseLatexArrayToExamTable(math, lightMode);
        if (examTable) return saveToken(examTable);
      }
      return saveToken(safeRenderKaTeX(normalizeAsciiMath(math), true));
    });

    // PHASE 2: Delimited inline math ($...$ and \(...\))
    text = text.replace(/\$([^\$]+?)\$/g, (_, math) =>
      saveToken(safeRenderKaTeX(normalizeAsciiMath(math), false))
    );
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) =>
      saveToken(safeRenderKaTeX(normalizeAsciiMath(math), false))
    );

    // PHASE 3: Standalone un-delimited LaTeX environments (\begin{aligned}, \begin{pmatrix}, \begin{array}, etc.)
    text = text.replace(
      /\\begin\{(aligned|matrix|pmatrix|bmatrix|vmatrix|cases|equation|align\*?|gather\*?|array)\}(?:\{[^}]*\})?([\s\S]*?)\\end\{\1\}/g,
      (match, envName) => {
        if (envName === 'array') {
          const examTable = parseLatexArrayToExamTable(match, lightMode);
          if (examTable) return saveToken(examTable);
        }
        return saveToken(safeRenderKaTeX(match, true));
      }
    );

    // PHASE 4: Protect inline code blocks
    text = text.replace(/`([^`\n]+?)`/g, (_, code) => {
      const codeHtml = lightMode
        ? `<code class="font-mono-code text-[11px] bg-[#efe9de] text-[#cc785c] px-1.5 py-0.5 rounded border border-[#e6dfd8]">${escapeHtml(code)}</code>`
        : `<code class="font-mono-code text-[11px] bg-[#181715] text-[#cc785c] px-1.5 py-0.5 rounded border border-white/[0.1]">${escapeHtml(code)}</code>`;
      return saveToken(codeHtml);
    });

    // PHASE 5: Detect and render un-delimited LaTeX commands (e.g. \frac{1}{2}, \sqrt{1+x}, \text{IQR})
    // Strictly bounded so commands do not swallow trailing prose words.
    text = text.replace(
      /(\\(?:frac|sqrt|vec|mathbb|mathbf|mathrm|text|operatorname)\{[^}]*\}(?:\{[^}]*\})?|\\(?:alpha|beta|gamma|theta|lambda|pi|Pi|sigma|Delta|Omega|times|cdot|le|ge|pm|infty|partial|approx|ne|in|notin|sin|cos|tan|cot|sec|csc|ln|log|exp|circ)\b|\\(?:int|sum|prod|lim)(?:_\{[^}]*\}|\^\{[^}]*\}|_[a-zA-Z0-9]|\^[a-zA-Z0-9])*)/g,
      (match) => {
        if (match.includes('@@@MATH_TOKEN') || match.trim().length < 2) return match;
        return saveToken(safeRenderKaTeX(match.trim(), false));
      }
    );

    // PHASE 6: Authentic Examination Tables (Markdown table formatting)
    text = text.replace(
      /(?:(?:^|\n)\|[^\n]+\|\r?\n\|[\s\-:|]+\|\r?\n(?:\|[^\n]+\|\r?\n?)+)/g,
      (tableMatch) => {
        const lines = tableMatch.trim().split(/\r?\n/).map((l) => l.trim());
        if (lines.length < 3) return tableMatch;
        const parseRow = (rowStr: string) =>
          rowStr
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.trim());

        const headers = parseRow(lines[0]);
        const rows = lines.slice(2).map(parseRow);

        const tableClass = lightMode
          ? 'w-full max-w-3xl border-collapse border-2 border-slate-900 text-center font-serif my-6 shadow-sm mx-auto'
          : 'w-full max-w-3xl border-collapse border-2 border-white/20 text-center font-serif my-6 shadow-sm mx-auto';
        const cellClass = lightMode
          ? 'border border-slate-800 px-8 py-4 text-slate-950 font-serif text-[15px]'
          : 'border border-white/10 px-8 py-4 text-[#faf9f5] font-serif text-[15px]';

        let tableHtml = `<div class="w-full overflow-x-auto my-6 flex justify-center"><table class="${tableClass}"><thead><tr>`;
        headers.forEach((h) => {
          tableHtml += `<th class="${cellClass} bg-slate-50/60 font-semibold">${h}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;
        rows.forEach((r) => {
          tableHtml += `<tr>`;
          r.forEach((cell) => {
            tableHtml += `<td class="${cellClass} align-middle text-center">${cell}</td>`;
          });
          tableHtml += `</tr>`;
        });
        tableHtml += `</tbody></table></div>`;

        return saveToken(tableHtml);
      }
    );

    // PHASE 7: Explicit Calculus expressions: d/dx [ ... ]
    text = text.replace(
      /\bd\/dx\s*\[(.*?)\]/g,
      (match) => {
        if (match.includes('@@@MATH_TOKEN')) return match;
        return saveToken(safeRenderKaTeX(normalizeAsciiMath(match), false));
      }
    );

    // PHASE 8: Clean un-delimited equations around '=', '≈', '≠', '<=', '>=' etc.
    // Strictly bounded to protect natural English prose from being swallowed into KaTeX math mode.
    const eqRegex = /(?:^|(?<=[\s,;:([{"']))([a-zA-Z0-9+\-*/^().'\\_]+(?:\s*[+\-*/]\s*[a-zA-Z0-9+\-*/^().'\\_]+)*)\s*(=|≈|≠|<=|>=|!=|\\le|\\ge|\\ne|\\approx)\s*([+-]?[a-zA-Z0-9+\-*/^().'\\_]+(?:\s*[+\-*/]\s*[a-zA-Z0-9+\-*/^().'\\_]+)*)(?=[.,;:!?)]|\s|$)/g;

    text = text.replace(eqRegex, (match, lhs, op, rhs) => {
      if (match.includes('@@@MATH_TOKEN')) return match;
      if (hasProseWords(lhs) || hasProseWords(rhs)) return match;
      if (!/[a-zA-Z0-9]/.test(lhs) || !/[a-zA-Z0-9]/.test(rhs)) return match;

      // Balance trailing parens on rhs (e.g. "(at y ≈ 5.3)" -> math is "y ≈ 5.3", trailing ")" preserved in prose)
      let cleanRhs = rhs.trim();
      let trailingParen = '';
      while (cleanRhs.endsWith(')') && (cleanRhs.split('(').length - 1 < cleanRhs.split(')').length)) {
        cleanRhs = cleanRhs.slice(0, -1).trim();
        trailingParen = ')' + trailingParen;
      }

      const fullExpr = `${lhs.trim()} ${op} ${cleanRhs}`;
      return saveToken(safeRenderKaTeX(normalizeAsciiMath(fullExpr), false)) + trailingParen;
    });

    // PHASE 9: Standalone complex algebraic expressions with exponents, factorials or paren fractions
    text = text.replace(
      /(?:^|(?<=[^a-zA-Z0-9_]|\s))((?:\(-?[0-9a-zA-Z\/+\-]+\)\^[0-9a-zA-Z+\-()]+|\([0-9a-zA-Z+\-]+\)!|\b[fghuvy]('{1,3}|\^\([a-zA-Z0-9+\-]+\))\([a-z0-9,\s]+\)))(?=[.,;:!?)\s]|$)/g,
      (match, expr) => {
        const trimmed = expr.trim();
        if (trimmed.length < 3) return match;
        if (trimmed.includes('@@@MATH_TOKEN')) return match;
        if (hasProseWords(trimmed)) return match;
        return saveToken(safeRenderKaTeX(normalizeAsciiMath(trimmed), false));
      }
    );

    // PHASE 10: Domain/interval inequalities: e.g. "x > -1", "-4 <= x <= 6", "n >= 2"
    text = text.replace(
      /\b(-?[0-9]+(?:\.[0-9]+)?\s*(?:<=|<|>=|>|\\le|\\ge)\s*)?([a-zA-Z])\s*(?:<=|<|>=|>|\\le|\\ge)\s*(-?[0-9]+(?:\.[0-9]+)?|[a-zA-Z0-9_]+)\b/g,
      (match) => {
        if (match.includes('@@@MATH_TOKEN')) return match;
        if (hasProseWords(match)) return match;
        const normalized = normalizeAsciiMath(match);
        return saveToken(safeRenderKaTeX(normalized, false));
      }
    );

    // PHASE 11: Set conditions: e.g. "m \in \mathbb{Q}", "m in Q", "x \in \mathbb{R}"
    text = text.replace(
      /\b([a-zA-Z])\s*(?:\\in|in)\s*(\\mathbb\{[A-Z]\}|[A-Z])\b/g,
      (match) => {
        if (match.includes('@@@MATH_TOKEN')) return match;
        const normalized = normalizeAsciiMath(match);
        return saveToken(safeRenderKaTeX(normalized, false));
      }
    );

    // PHASE 12: Standalone sequence/series terms: e.g. "u_1", "S_8", "u_8", "S_n"
    text = text.replace(/\b([uUSxya])_([0-9a-zA-Z]+)\b/g, (_, sym, sub) => {
      return saveToken(safeRenderKaTeX(`${sym}_{${sub}}`, false));
    });

    // PHASE 13: Markdown formatting on the remaining prose
    const strongClass = lightMode
      ? 'font-semibold text-slate-950 tracking-normal'
      : 'font-semibold text-[#faf9f5] tracking-normal';

    // Bold (**word** or __word__)
    text = text.replace(/\*\*(.*?)\*\*/g, (_, bold) => `<strong class="${strongClass}">${bold}</strong>`);
    text = text.replace(/__([^_]+?)__/g, (_, bold) => `<strong class="${strongClass}">${bold}</strong>`);

    // Italic (*word*)
    text = text.replace(/\*([^\*\n]+?)\*/g, (_, italic) => `<em class="italic text-inherit">${italic}</em>`);

    // Line breaks
    text = text.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');

    // PHASE 14: Re-insert all protected and rendered math tokens (with recursion protection)
    let prevText: string;
    let passes = 0;
    do {
      prevText = text;
      placeholders.forEach((html, token) => {
        text = text.split(token).join(html);
      });
      passes++;
    } while (text !== prevText && text.includes('@@@MATH_TOKEN') && passes < 10);

    return text;
  }, [content, lightMode]);

  const hasCustomTextColor = /\btext-/.test(className);
  const defaultTextColor =
    lightMode === true
      ? 'text-[#141413]'
      : 'text-[#faf9f5]';
  const baseStyle = `${hasCustomTextColor ? '' : defaultTextColor} leading-relaxed math-content`;

  return (
    <div
      className={`${baseStyle} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
});

MathRenderer.displayName = 'MathRenderer';
