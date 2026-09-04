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

/**
 * Smart Math Normalizer: Converts ASCII math notations commonly found
 * in raw exam prompts or LLM extractions into valid LaTeX syntax.
 */
function normalizeAsciiMath(expr: string): string {
  let s = expr;

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

  // 2. Roots: sqrt(...) -> \sqrt{...}
  s = s.replace(/\\?sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/\\?sqrt\{([^}]+)\}/g, '\\sqrt{$1}');

  // 3. Higher order derivatives: f^(n)(x) -> f^{(n)}(x)
  s = s.replace(/\b([fghuv])\^\(([a-zA-Z0-9+\-]+)\)\(([a-z0-9,\s]+)\)/g, '$1^{($2)}($3)');
  s = s.replace(/\b([fghuv])\^\{([a-zA-Z0-9+\-]+)\}\(([a-z0-9,\s]+)\)/g, '$1^{$2}($3)');

  // 4. Prime derivatives: f''(x) -> f''(x), f'(x) -> f'(x)
  s = s.replace(/\b([fghuv])('{1,3})\(([a-z0-9,\s]+)\)/g, '$1$2($3)');

  // 5. Exponents: e^(mx) -> e^{mx}, x^(2k+1) -> x^{2k+1}, (-1/4)^(n-1) -> (-1/4)^{n-1}
  s = s.replace(/([a-zA-Z0-9\)])\^\(([^\)]+)\)/g, '$1^{$2}');
  s = s.replace(/([a-zA-Z0-9\)])\^([0-9a-zA-Z]+)(?![^{])/g, '$1^{$2}');

  // 6. Subscripts: u_1 -> u_1, S_8 -> S_8, u_n -> u_n
  s = s.replace(/\b([a-zA-Z])_([0-9a-zA-Z]+)\b/g, '$1_{$2}');

  // 7. Relations and inequalities
  s = s
    .replace(/<=/g, '\\le ')
    .replace(/>=/g, '\\ge ')
    .replace(/!=/g, '\\ne ');

  // 8. Set memberships: in Q -> \in \mathbb{Q}, in R -> \in \mathbb{R}, in Z -> \in \mathbb{Z}
  s = s
    .replace(/\b(?:\\in|in)\s+(?:Q|\\mathbb\{Q\})\b/g, '\\in \\mathbb{Q}')
    .replace(/\b(?:\\in|in)\s+(?:R|\\mathbb\{R\})\b/g, '\\in \\mathbb{R}')
    .replace(/\b(?:\\in|in)\s+(?:Z|\\mathbb\{Z\})\b/g, '\\in \\mathbb{Z}')
    .replace(/\b(?:\\in|in)\s+(?:N|\\mathbb\{N\})\b/g, '\\in \\mathbb{N}')
    .replace(/\b(?:\\in|in)\s+(?:C|\\mathbb\{C\})\b/g, '\\in \\mathbb{C}');

  return s;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  lightMode = false,
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    let text = content;

    // Normalize escaped backslashes from JSON payloads (e.g. \\frac -> \frac)
    text = text.replace(/\\\\([a-zA-Z\{\}\[\]\(\)\$\\_])/g, '\\$1');

    const placeholders = new Map<string, string>();
    let placeholderId = 0;

    const saveToken = (rendered: string): string => {
      const key = `@@@MATH_TOKEN_${placeholderId++}@@@`;
      placeholders.set(key, rendered);
      return key;
    };

    // PHASE 1: Protect and render LaTeX environments (\begin{aligned} ... \end{aligned})
    text = text.replace(
      /\\begin\{(aligned|matrix|pmatrix|bmatrix|vmatrix|cases|equation|align\*?|gather\*?)\}([\s\S]*?)\\end\{\1\}/g,
      (match) => saveToken(safeRenderKaTeX(match, true))
    );

    // PHASE 2: Protect and render block math ($$...$$ and \[...\])
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) =>
      saveToken(safeRenderKaTeX(normalizeAsciiMath(math), true))
    );
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) =>
      saveToken(safeRenderKaTeX(normalizeAsciiMath(math), true))
    );

    // PHASE 3: Protect and render inline math ($...$ and \(...\))
    text = text.replace(/\$([^\$\n]+?)\$/g, (_, math) =>
      saveToken(safeRenderKaTeX(normalizeAsciiMath(math), false))
    );
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) =>
      saveToken(safeRenderKaTeX(normalizeAsciiMath(math), false))
    );

    // PHASE 4: Protect inline code blocks
    text = text.replace(/`([^`\n]+?)`/g, (_, code) => {
      const codeHtml = `<code class="font-mono-code text-[11px] bg-[#0c0d0e] text-[#f54e00] px-1.5 py-0.5 rounded border border-white/[0.08]">${escapeHtml(code)}</code>`;
      return saveToken(codeHtml);
    });

    // PHASE 5: Detect and render un-delimited LaTeX commands (e.g. \frac{1}{2}, \sqrt{1+x})
    text = text.replace(
      /(\\(?:int|frac|sqrt|sum|prod|lim|alpha|beta|gamma|theta|lambda|pi|Pi|sigma|Delta|Omega|times|cdot|le|ge|pm|infty|vec|partial|approx|ne|in|notin|mathbb)(?:\{[^}]*\}|\^\{[^}]*\}|_\{[^}]*\}|[a-zA-Z0-9+\-=*/^_\s])*(?:;|\b|$))/g,
      (match) => {
        if (match.includes('@@@MATH_TOKEN') || match.trim().length < 2) return match;
        return saveToken(safeRenderKaTeX(match.trim(), false));
      }
    );

    // PHASE 6: Intelligent ASCII Math Detection in remaining text
    // Handles expressions like:
    // - "f(x) = sqrt(1+x)"
    // - "f''(x)" or "f^(n)(x)"
    // - "h(x) = f(x)g(x)" or "g(x) = e^(mx)"
    // - "u_8 = S_8 = 8"
    // - "x > -1" or "n >= 2"
    // - "m in Q" or "x in R"

    // 6a. Function equations: e.g. f(x) = sqrt(1+x), h(x) = f(x)g(x), g(x) = e^(mx), y = 2x^2 + 1
    text = text.replace(
      /\b([fghuvy])\s*\(([a-z0-9,\s]+)\)\s*=\s*([a-zA-Z0-9_+\-*/^().\s\\]+?)(?=[.,;!?]|\s+(?:for|where|and|with|show|find|let|when|such|\b)|$)/gi,
      (fullMatch, fnName, fnArg, expr) => {
        const fullFormula = `${fnName}(${fnArg}) = ${expr.trim()}`;
        const normalized = normalizeAsciiMath(fullFormula);
        return saveToken(safeRenderKaTeX(normalized, false));
      }
    );

    // 6b. Standalone higher order & prime derivatives: e.g. f''(x), f'(x), f^(n)(x)
    text = text.replace(
      /\b([fghuv])('{1,3}|\^\([a-zA-Z0-9+\-]+\)|\^\{[a-zA-Z0-9+\-]+\})\s*\(([a-z0-9,\s]+)\)/g,
      (match) => {
        const normalized = normalizeAsciiMath(match);
        return saveToken(safeRenderKaTeX(normalized, false));
      }
    );

    // 6c. Standalone mathematical definitions: e.g. "u_8 = S_8 = 8", "4m^2 + 4m - 15 = 0", "m = 3/2"
    text = text.replace(
      /\b([a-zA-Z](?:_[0-9a-zA-Z]+|\^[0-9a-zA-Z]+)?)\s*=\s*([a-zA-Z0-9_+\-*/^().\s\\=]+?)(?=[.,;!?]|\s+(?:for|where|and|or|with|show|find|let|when|such|\b)|$)/g,
      (fullMatch, left, right) => {
        // Guard against matching plain English clauses like "it = something"
        if (/^(it|this|that|which|there|here|where)$/i.test(left.trim())) return fullMatch;
        const normalized = normalizeAsciiMath(`${left} = ${right.trim()}`);
        return saveToken(safeRenderKaTeX(normalized, false));
      }
    );

    // 6d. Domain/interval inequalities: e.g. "x > -1", "-4 <= x <= 6", "n >= 2", "x \ge 0"
    text = text.replace(
      /\b(-?[0-9]+(?:\.[0-9]+)?\s*(?:<=|<|>=|>|\\le|\\ge)\s*)?([a-zA-Z])\s*(?:<=|<|>=|>|\\le|\\ge)\s*(-?[0-9]+(?:\.[0-9]+)?|[a-zA-Z0-9_]+)\b/g,
      (match) => {
        const normalized = normalizeAsciiMath(match);
        return saveToken(safeRenderKaTeX(normalized, false));
      }
    );

    // 6e. Set conditions: e.g. "m \in \mathbb{Q}", "m in Q", "x \in \mathbb{R}"
    text = text.replace(
      /\b([a-zA-Z])\s*(?:\\in|in)\s*(\\mathbb\{[A-Z]\}|[A-Z])\b/g,
      (match) => {
        const normalized = normalizeAsciiMath(match);
        return saveToken(safeRenderKaTeX(normalized, false));
      }
    );

    // 6f. Standalone sequence/series terms: e.g. "u_1", "S_8", "u_8", "S_n"
    text = text.replace(/\b([uUSxya])_([0-9a-zA-Z]+)\b/g, (_, sym, sub) => {
      return saveToken(safeRenderKaTeX(`${sym}_{${sub}}`, false));
    });

    // PHASE 7: Markdown formatting on the remaining prose
    const strongClass = lightMode
      ? 'font-semibold text-slate-950 tracking-normal'
      : 'font-semibold text-white tracking-normal';

    // Bold (**word** or __word__)
    text = text.replace(/\*\*(.*?)\*\*/g, (_, bold) => `<strong class="${strongClass}">${bold}</strong>`);
    text = text.replace(/__([^_]+?)__/g, (_, bold) => `<strong class="${strongClass}">${bold}</strong>`);

    // Italic (*word* or _word_)
    text = text.replace(/\*([^\*\n]+?)\*/g, (_, italic) => `<em class="italic text-inherit">${italic}</em>`);

    // Line breaks
    text = text.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');

    // PHASE 8: Re-insert all protected and rendered math tokens
    placeholders.forEach((html, token) => {
      text = text.split(token).join(html);
    });

    return text;
  }, [content, lightMode]);

  const baseStyle = lightMode
    ? 'text-slate-900 leading-relaxed math-content'
    : 'text-[#f3f3f2] leading-relaxed math-content';

  return (
    <div
      className={`${baseStyle} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
