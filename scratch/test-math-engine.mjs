import katex from 'katex';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeRenderKaTeX(tex, displayMode) {
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
      const cleaned = trimmed.replace(/\\\\/g, '\\').replace(/\s+/g, ' ');
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

function normalizeAsciiMath(expr) {
  let s = expr;

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

  s = s.replace(/\\?sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/\\?sqrt\{([^}]+)\}/g, '\\sqrt{$1}');
  s = s.replace(/\b([fghuv])\^\(([a-zA-Z0-9+\-]+)\)\(([a-z0-9,\s]+)\)/g, '$1^{($2)}($3)');
  s = s.replace(/\b([fghuv])\^\{([a-zA-Z0-9+\-]+)\}\(([a-z0-9,\s]+)\)/g, '$1^{$2}($3)');
  s = s.replace(/\b([fghuv])('{1,3})\(([a-z0-9,\s]+)\)/g, '$1$2($3)');
  s = s.replace(/([a-zA-Z0-9\)])\^\(([^\)]+)\)/g, '$1^{$2}');
  s = s.replace(/([a-zA-Z0-9\)])\^([0-9a-zA-Z]+)(?![^{])/g, '$1^{$2}');
  s = s.replace(/\b([a-zA-Z])_([0-9a-zA-Z]+)\b/g, '$1_{$2}');

  s = s
    .replace(/<=/g, '\\le ')
    .replace(/>=/g, '\\ge ')
    .replace(/!=/g, '\\ne ');

  s = s
    .replace(/\b(?:\\in|in)\s+(?:Q|\\mathbb\{Q\})\b/g, '\\in \\mathbb{Q}')
    .replace(/\b(?:\\in|in)\s+(?:R|\\mathbb\{R\})\b/g, '\\in \\mathbb{R}')
    .replace(/\b(?:\\in|in)\s+(?:Z|\\mathbb\{Z\})\b/g, '\\in \\mathbb{Z}')
    .replace(/\b(?:\\in|in)\s+(?:N|\\mathbb\{N\})\b/g, '\\in \\mathbb{N}')
    .replace(/\b(?:\\in|in)\s+(?:C|\\mathbb\{C\})\b/g, '\\in \\mathbb{C}');

  return s;
}

function renderContent(content) {
  if (!content) return '';
  let text = content.replace(/\\\\([a-zA-Z\{\}\[\]\(\)\$\\_])/g, '\\$1');

  const placeholders = new Map();
  let placeholderId = 0;

  const saveToken = (rendered) => {
    const key = `@@@MATH_TOKEN_${placeholderId++}@@@`;
    placeholders.set(key, rendered);
    return key;
  };

  text = text.replace(
    /\\begin\{(aligned|matrix|pmatrix|bmatrix|vmatrix|cases|equation|align\*?|gather\*?)\}([\s\S]*?)\\end\{\1\}/g,
    (match) => saveToken(safeRenderKaTeX(match, true))
  );

  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) =>
    saveToken(safeRenderKaTeX(normalizeAsciiMath(math), true))
  );
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) =>
    saveToken(safeRenderKaTeX(normalizeAsciiMath(math), true))
  );

  text = text.replace(/\$([^\$\n]+?)\$/g, (_, math) =>
    saveToken(safeRenderKaTeX(normalizeAsciiMath(math), false))
  );
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) =>
    saveToken(safeRenderKaTeX(normalizeAsciiMath(math), false))
  );

  text = text.replace(/`([^`\n]+?)`/g, (_, code) => {
    return saveToken(`<code>${escapeHtml(code)}</code>`);
  });

  text = text.replace(
    /(\\(?:int|frac|sqrt|sum|prod|lim|alpha|beta|gamma|theta|lambda|pi|Pi|sigma|Delta|Omega|times|cdot|le|ge|pm|infty|vec|partial|approx|ne|in|notin|mathbb)(?:\{[^}]*\}|\^\{[^}]*\}|_\{[^}]*\}|[a-zA-Z0-9+\-=*/^_\s])*(?:;|\b|$))/g,
    (match) => {
      if (match.includes('@@@MATH_TOKEN') || match.trim().length < 2) return match;
      return saveToken(safeRenderKaTeX(match.trim(), false));
    }
  );

  text = text.replace(
    /\b([fghuvy])\s*\(([a-z0-9,\s]+)\)\s*=\s*([a-zA-Z0-9_+\-*/^().\s\\]+?)(?=[.,;!?]|\s+(?:for|where|and|with|show|find|let|when|such|\b)|$)/gi,
    (fullMatch, fnName, fnArg, expr) => {
      const fullFormula = `${fnName}(${fnArg}) = ${expr.trim()}`;
      const normalized = normalizeAsciiMath(fullFormula);
      return saveToken(safeRenderKaTeX(normalized, false));
    }
  );

  text = text.replace(
    /\b([fghuv])('{1,3}|\^\([a-zA-Z0-9+\-]+\)|\^\{[a-zA-Z0-9+\-]+\})\s*\(([a-z0-9,\s]+)\)/g,
    (match) => {
      const normalized = normalizeAsciiMath(match);
      return saveToken(safeRenderKaTeX(normalized, false));
    }
  );

  text = text.replace(
    /\b([a-zA-Z](?:_[0-9a-zA-Z]+|\^[0-9a-zA-Z]+)?)\s*=\s*([a-zA-Z0-9_+\-*/^().\s\\=]+?)(?=[.,;!?]|\s+(?:for|where|and|or|with|show|find|let|when|such|\b)|$)/g,
    (fullMatch, left, right) => {
      if (/^(it|this|that|which|there|here|where)$/i.test(left.trim())) return fullMatch;
      const normalized = normalizeAsciiMath(`${left} = ${right.trim()}`);
      return saveToken(safeRenderKaTeX(normalized, false));
    }
  );

  text = text.replace(
    /\b(-?[0-9]+(?:\.[0-9]+)?\s*(?:<=|<|>=|>|\\le|\\ge)\s*)?([a-zA-Z])\s*(?:<=|<|>=|>|\\le|\\ge)\s*(-?[0-9]+(?:\.[0-9]+)?|[a-zA-Z0-9_]+)\b/g,
    (match) => {
      const normalized = normalizeAsciiMath(match);
      return saveToken(safeRenderKaTeX(normalized, false));
    }
  );

  text = text.replace(
    /\b([a-zA-Z])\s*(?:\\in|in)\s*(\\mathbb\{[A-Z]\}|[A-Z])\b/g,
    (match) => {
      const normalized = normalizeAsciiMath(match);
      return saveToken(safeRenderKaTeX(normalized, false));
    }
  );

  text = text.replace(/\b([uUSxya])_([0-9a-zA-Z]+)\b/g, (_, sym, sub) => {
    return saveToken(safeRenderKaTeX(`${sym}_{${sub}}`, false));
  });

  placeholders.forEach((html, token) => {
    text = text.split(token).join(html);
  });

  return { html: text, placeholderCount: placeholders.size };
}

// Test cases
const test1 = "f(x) = sqrt(1+x). Show f''(x), use induction for f^(n)(x), find m for h(x) = f(x)g(x).";
const res1 = renderContent(test1);
console.log("Test 1 (User Screenshot Prompt):");
console.log("Rendered tokens count:", res1.placeholderCount);
console.log("Contains KaTeX spans:", res1.html.includes("katex"));

const test2 = "Let g(x) = e^(mx), m in Q. For x > -1, show u_8 = S_8 = 8.";
const res2 = renderContent(test2);
console.log("\nTest 2 (Sequences, Exponents, Sets):");
console.log("Rendered tokens count:", res2.placeholderCount);
console.log("Contains KaTeX spans:", res2.html.includes("katex"));

const test3 = "Find the exact value of $$\\int_{0}^{2} x\\sqrt{2x^2+1}\\,dx$$";
const res3 = renderContent(test3);
console.log("\nTest 3 (LaTeX Block Math):");
console.log("Rendered tokens count:", res3.placeholderCount);
console.log("Contains KaTeX spans:", res3.html.includes("katex"));
