import fs from 'fs';
import katex from 'katex';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeRenderKaTeX(math, displayMode = false) {
  try {
    return katex.renderToString(math, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
    });
  } catch (err) {
    console.error('KaTeX render error:', err);
    return `<span class="katex-fallback font-mono text-[#f54e00]">${escapeHtml(math)}</span>`;
  }
}

function normalizeAsciiMath(expr) {
  let s = expr.trim();

  // If already a structured LaTeX environment, pass through untouched
  if (/\\begin\{(aligned|matrix|pmatrix|bmatrix|vmatrix|cases|equation|align\*?|gather\*?|array)\}/.test(s)) {
    return s;
  }

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

export function smartRender(content, lightMode = false) {
  if (!content) return '';
  let text = content;

  text = text.replace(/\\\\([a-zA-Z\{\}\[\]\(\)\$])/g, '\\$1');

  const placeholders = new Map();
  let placeholderId = 0;

  const saveToken = (rendered) => {
    const key = `@@@MATH_TOKEN_${placeholderId++}@@@`;
    placeholders.set(key, rendered);
    return key;
  };

  // PHASE 1: Delimited block math ($$...$$ and \[...\])
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) =>
    saveToken(safeRenderKaTeX(normalizeAsciiMath(math), true))
  );
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) =>
    saveToken(safeRenderKaTeX(normalizeAsciiMath(math), true))
  );

  // PHASE 2: Delimited inline math ($...$ and \(...\))
  text = text.replace(/\$([^\$]+?)\$/g, (_, math) =>
    saveToken(safeRenderKaTeX(normalizeAsciiMath(math), false))
  );
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) =>
    saveToken(safeRenderKaTeX(normalizeAsciiMath(math), false))
  );

  // PHASE 3: Standalone un-delimited LaTeX environments
  text = text.replace(
    /\\begin\{(aligned|matrix|pmatrix|bmatrix|vmatrix|cases|equation|align\*?|gather\*?|array)\}(?:\{[^}]*\})?([\s\S]*?)\\end\{\1\}/g,
    (match) => saveToken(safeRenderKaTeX(match, true))
  );

  // PHASE 4: Protect inline code blocks
  text = text.replace(/`([^`\n]+?)`/g, (_, code) => {
    const codeHtml = `<code class="font-mono-code text-[11px] bg-[#0c0d0e] text-[#f54e00] px-1.5 py-0.5 rounded border border-white/[0.08]">${escapeHtml(code)}</code>`;
    return saveToken(codeHtml);
  });

  // PHASE 5: Un-delimited LaTeX commands
  text = text.replace(
    /(\\(?:int|frac|sqrt|sum|prod|lim|alpha|beta|gamma|theta|lambda|pi|Pi|sigma|Delta|Omega|times|cdot|le|ge|pm|infty|vec|partial|approx|ne|in|notin|mathbb)(?:\{[^}]*\}|\^\{[^}]*\}|_\{[^}]*\}|[a-zA-Z0-9+\-=*/^_\s])*(?:;|\b|$))/g,
    (match) => {
      if (match.includes('@@@MATH_TOKEN') || match.trim().length < 2) return match;
      return saveToken(safeRenderKaTeX(match.trim(), false));
    }
  );

  // PHASE 6: Authentic Examination Tables
  text = text.replace(
    /(?:(?:^|\n)\|[^\n]+\|\r?\n\|[\s\-:|]+\|\r?\n(?:\|[^\n]+\|\r?\n?)+)/g,
    (tableMatch) => {
      const lines = tableMatch.trim().split(/\r?\n/).map((l) => l.trim());
      if (lines.length < 3) return tableMatch;
      const parseRow = (rowStr) =>
        rowStr
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim());

      const headers = parseRow(lines[0]);
      const rows = lines.slice(2).map(parseRow);

      const tableClass = lightMode
        ? 'my-3.5 border-collapse border-2 border-slate-900 text-center text-sm font-serif shadow-sm mx-auto'
        : 'my-3.5 border-collapse border-2 border-white/50 text-center text-sm font-serif shadow-sm mx-auto';
      const cellClass = lightMode
        ? 'border border-slate-800 px-5 py-2.5 text-slate-950 font-serif font-medium'
        : 'border border-white/40 px-5 py-2.5 text-white font-serif font-medium';

      let tableHtml = `<div class="w-full overflow-x-auto my-3 flex justify-center"><table class="${tableClass}"><thead><tr>`;
      headers.forEach((h) => {
        tableHtml += `<th class="${cellClass}">${h}</th>`;
      });
      tableHtml += `</tr></thead><tbody>`;
      rows.forEach((r) => {
        tableHtml += `<tr>`;
        r.forEach((cell) => {
          tableHtml += `<td class="${cellClass}">${cell}</td>`;
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

  // PHASE 8: Equations with '=' and arrows '=>'
  text = text.replace(
    /(?:^|(?<=[:\n;.]\s*))([a-zA-Z0-9+\-*/^().\s\\'_!><=]+?\s*=\s*[a-zA-Z0-9+\-*/^().\s\\'_!><=]+?)(?=[.,;!?]|\s+(?:for|where|with|and|or|since|hence|when)\b|$)/g,
    (match, mathExpr) => {
      if (match.includes('@@@MATH_TOKEN')) return match;
      if (/^(it|this|that|which|there|here|where)\s*=/i.test(mathExpr.trim())) return match;
      if (!/[0-9+\-*/^()'_!\\><]/.test(mathExpr)) return match;
      return saveToken(safeRenderKaTeX(normalizeAsciiMath(mathExpr), false));
    }
  );

  // PHASE 9: Standalone complex algebraic expressions
  text = text.replace(
    /(?:^|(?<=[^a-zA-Z0-9_]|\s))((?:\(-?[0-9a-zA-Z\/+\-]+\)\^[0-9a-zA-Z+\-()]+|\([0-9a-zA-Z+\-]+\)!|\b[fghuvy]('{1,3}|\^\([a-zA-Z0-9+\-]+\))\([a-z0-9,\s]+\))[a-zA-Z0-9+\-*/^().\s\\'_!><]*)/g,
    (match, expr) => {
      const trimmed = expr.trim();
      if (trimmed.length < 3) return match;
      if (trimmed.includes('@@@MATH_TOKEN')) return match;
      return saveToken(safeRenderKaTeX(normalizeAsciiMath(trimmed), false));
    }
  );

  // PHASE 10: Domain/interval inequalities
  text = text.replace(
    /\b(-?[0-9]+(?:\.[0-9]+)?\s*(?:<=|<|>=|>|\\le|\\ge)\s*)?([a-zA-Z])\s*(?:<=|<|>=|>|\\le|\\ge)\s*(-?[0-9]+(?:\.[0-9]+)?|[a-zA-Z0-9_]+)\b/g,
    (match) => {
      if (match.includes('@@@MATH_TOKEN')) return match;
      const normalized = normalizeAsciiMath(match);
      return saveToken(safeRenderKaTeX(normalized, false));
    }
  );

  // PHASE 11: Set conditions
  text = text.replace(
    /\b([a-zA-Z])\s*(?:\\in|in)\s*(\\mathbb\{[A-Z]\}|[A-Z])\b/g,
    (match) => {
      if (match.includes('@@@MATH_TOKEN')) return match;
      const normalized = normalizeAsciiMath(match);
      return saveToken(safeRenderKaTeX(normalized, false));
    }
  );

  // PHASE 12: Standalone sequence/series terms
  text = text.replace(/\b([uUSxya])_([0-9a-zA-Z]+)\b/g, (_, sym, sub) => {
    return saveToken(safeRenderKaTeX(`${sym}_{${sub}}`, false));
  });

  // PHASE 13: Markdown formatting
  const strongClass = lightMode
    ? 'font-semibold text-slate-950 tracking-normal'
    : 'font-semibold text-white tracking-normal';

  text = text.replace(/\*\*(.*?)\*\*/g, (_, bold) => `<strong class="${strongClass}">${bold}</strong>`);
  text = text.replace(/__([^_]+?)__/g, (_, bold) => `<strong class="${strongClass}">${bold}</strong>`);
  text = text.replace(/\*([^\*\n]+?)\*/g, (_, italic) => `<em class="italic text-inherit">${italic}</em>`);
  text = text.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');

  // PHASE 14: Re-insert all protected tokens (with recursion protection)
  let prevText;
  let passes = 0;
  do {
    prevText = text;
    placeholders.forEach((html, token) => {
      text = text.split(token).join(html);
    });
    passes++;
  } while (text !== prevText && text.includes('@@@MATH_TOKEN') && passes < 10);

  return text;
}

// Verification suite
console.log('=== Testing Full Suite ===');
const testExpressions = [
  "Base step n = 2: f^(2)(x) = (-1/4)^1 * (1! / 0!) * (1+x)^(-3/2)",
  "Differentiating f^(k)(x) to find f^(k+1)(x): d/dx [(-1/4)^(k-1) * ((2k-3)! / (k-2)!) * (1+x)^(1/2 - k)]",
  "(1/2 - k)(1+x)^(-1/2 - k) = -(2k-1)/2 * (1+x)^(1/2 - (k+1))",
  "Rewrite factor -(2k-1)/2 = (-1/4) * (2k-1) * 2",
  "((2k-3)! / (k-2)!) * (2k-1) * 2 = ((2k-1)! / (k-1)!)",
  "Obtaining (-1/4)^k * ((2(k+1)-3)! / ((k+1)-2)!) * (1+x)^(1/2 - (k+1))",
  "Equate to 7/4: m^2/2 + m/2 - 1/8 = 7/4 => 4m^2 + 4m - 15 = 0",
  "f'(x) = (1/2)(1+x)^(-1/2). f''(x) = (-1/4)(1+x)^(-3/2). f'''(x) = (3/8)(1+x)^(-5/2)."
];

let passed = 0;
for (const expr of testExpressions) {
  const rendered = smartRender(expr);
  const mathMatches = (rendered.match(/class="katex"/g) || []).length;
  const hasToken = rendered.includes('@@@MATH_TOKEN');
  if (mathMatches > 0 && !hasToken) {
    console.log(`✅ PASS: ${expr.slice(0, 55)}... (${mathMatches} math tokens)`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${expr.slice(0, 55)}... (Tokens: ${mathMatches}, Leak: ${hasToken})`);
  }
}
console.log(`\nResult: ${passed}/${testExpressions.length} expressions rendered into KaTeX!`);

// Test Question 10 Table
const fileContent = fs.readFileSync('./src/lib/samplePapers.ts', 'utf-8');
const q10Match = fileContent.match(/id:\s*'m21_q10',[\s\S]*?promptText:\s*'([\s\S]*?)',\s*subparts/);
const q10Prompt = q10Match ? q10Match[1].replace(/\\n/g, '\n').replace(/\\'/g, "'") : '';

const q11bMatch = fileContent.match(/id:\s*'m21_q11_b',[\s\S]*?promptText:\s*'([\s\S]*?)',\s*markCodes/);
const q11bPrompt = q11bMatch ? q11bMatch[1].replace(/\\n/g, '\n').replace(/\\'/g, "'") : '';

console.log('\n=== Question 10 Probability Table Test ===');
const q10Rendered = smartRender(q10Prompt, true);
const q10Ok = !q10Rendered.includes('@@@MATH_TOKEN') && (q10Rendered.includes('mtable') || q10Rendered.includes('menclose'));
console.log(q10Ok ? '✅ PASS: Question 10 table rendered without placeholder leakage!' : '❌ FAIL: Question 10 failed table render!');

console.log('\n=== Question 11 Vector Equation Test ===');
const q11bRendered = smartRender(q11bPrompt, true);
const q11Ok = !q11bRendered.includes('@@@MATH_TOKEN') && (q11bRendered.includes('matrix') || q11bRendered.includes('pmatrix'));
console.log(q11Ok ? '✅ PASS: Question 11 vector equation rendered into column vectors without placeholder leakage!' : '❌ FAIL: Question 11 failed vector render!');
