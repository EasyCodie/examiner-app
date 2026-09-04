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
  // Don't normalize ASCII inside standard LaTeX environments (like \begin{array} or \begin{pmatrix})
  if (/\\begin\{(aligned|matrix|pmatrix|bmatrix|vmatrix|cases|equation|align\*?|gather\*?|array)\}/.test(s)) {
    return s;
  }
  s = s.replace(/=>/g, '\\implies ');
  s = s.replace(/->/g, '\\to ');
  s = s.replace(/<=/g, '\\le ');
  s = s.replace(/>=/g, '\\ge ');
  s = s.replace(/!=/g, '\\ne ');
  s = s.replace(/([0-9a-zA-Z\)])\s*\*\s*([0-9a-zA-Z\(])/g, '$1 \\cdot $2');
  s = s.replace(/\b(\w+)\^\{([^}]+)\}/g, '$1^{$2}');
  s = s.replace(/\b(\w+)\^([0-9a-zA-Z]+)/g, '$1^{$2}');
  s = s.replace(/\b([a-zA-Z])_([0-9a-zA-Z]+)/g, '$1_{$2}');
  return s;
}

function runFixedMathRenderer(content) {
  let text = content;

  // Normalize escaped backslashes from JSON payloads (e.g. \\frac -> \frac),
  // but preserve double backslashes that denote LaTeX newlines (e.g. \\ or \\\hline)
  // LaTeX newlines inside matrices/arrays are "\\" or "\\ " or "\\\hline".
  // We ONLY collapse \\ when followed by single slash or command that was over-escaped like \\frac or \\begin:
  text = text.replace(/\\\\(begin|end|frac|sqrt|left|right|textbf|mathbf|text|alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|pm|mp|le|ge|ne|approx|times|cdot|div|partial|infty|int|sum|prod|lim|implies|to|in|notin|subset|cup|cap|vec|mathbb)/g, '\\$1');

  const placeholders = new Map();
  let placeholderId = 0;

  const saveToken = (rendered) => {
    const key = `@@@MATH_TOKEN_${placeholderId++}@@@`;
    placeholders.set(key, rendered);
    return key;
  };

  // STEP 1: Delimited Block math ($$...$$ and \[...\])
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    return saveToken(safeRenderKaTeX(normalizeAsciiMath(math), true));
  });
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    return saveToken(safeRenderKaTeX(normalizeAsciiMath(math), true));
  });

  // STEP 2: Delimited Inline math ($...$ and \(...\))
  text = text.replace(/\$([^\$]+?)\$/g, (_, math) => {
    return saveToken(safeRenderKaTeX(normalizeAsciiMath(math), false));
  });
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    return saveToken(safeRenderKaTeX(normalizeAsciiMath(math), false));
  });

  // STEP 3: Standalone un-delimited LaTeX environments (\begin{pmatrix}, \begin{aligned}, etc.)
  text = text.replace(
    /\\begin\{(aligned|matrix|pmatrix|bmatrix|vmatrix|cases|equation|align\*?|gather\*?|array)\}(?:\{[^}]*\})?([\s\S]*?)\\end\{\1\}/g,
    (match) => saveToken(safeRenderKaTeX(match, true))
  );

  // STEP 4: Protect inline code blocks
  text = text.replace(/`([^`\n]+?)`/g, (_, code) => {
    const codeHtml = `<code>${escapeHtml(code)}</code>`;
    return saveToken(codeHtml);
  });

  // STEP 5: Standalone LaTeX commands not delimited by $
  text = text.replace(
    /(\\(?:int|frac|sqrt|sum|prod|lim|alpha|beta|gamma|theta|lambda|pi|Pi|sigma|Delta|Omega|times|cdot|le|ge|pm|infty|vec|partial|approx|ne|in|notin|mathbb)(?:\{[^}]*\}|\^\{[^}]*\}|_\{[^}]*\}|[a-zA-Z0-9+\-=*/^_\s])*(?:;|\b|$))/g,
    (match) => {
      if (match.includes('@@@MATH_TOKEN') || match.trim().length < 2) return match;
      return saveToken(safeRenderKaTeX(match.trim(), false));
    }
  );

  // STEP 6: Markdown tables
  text = text.replace(
    /(?:(?:^|\n)\|[^\n]+\|\r?\n\|[\s\-:|]+\|\r?\n(?:\|[^\n]+\|\r?\n?)+)/g,
    (tableMatch) => {
      return saveToken(`<table class="exam-table">${tableMatch}</table>`);
    }
  );

  // STEP 7: Equations with '=': e.g. "f'(x) = 2x"
  text = text.replace(
    /(?:^|(?<=[:\n;.]\s*))([a-zA-Z0-9+\-*/^().\s\\'_!><=]+?\s*=\s*[a-zA-Z0-9+\-*/^().\s\\'_!><=]+?)(?=[.,;!?]|\s+(?:for|where|with|and|or|since|hence|when)\b|$)/g,
    (match, mathExpr) => {
      if (match.includes('@@@MATH_TOKEN')) return match;
      if (/^(it|this|that|which|there|here|where)\s*=/i.test(mathExpr.trim())) return match;
      if (!/[0-9+\-*/^()'_!\\><]/.test(mathExpr)) return match;
      return saveToken(safeRenderKaTeX(normalizeAsciiMath(mathExpr), false));
    }
  );

  // Token restoration with recursion protection
  let prev;
  let loops = 0;
  do {
    prev = text;
    placeholders.forEach((html, token) => {
      text = text.split(token).join(html);
    });
    loops++;
  } while (text !== prev && text.includes('@@@MATH_TOKEN') && loops < 5);

  return text;
}

const q10 = 'Section B (Question 10):\n\nA biased four-sided die, A, is rolled. Let $X$ be the score obtained when die A is rolled. The probability distribution for $X$ is given in the following table:\n\n$$\\begin{array}{|c|c|c|c|c|}\\hline x & 1 & 2 & 3 & 4 \\\\\\hline P(X=x) & p & p & p & \\frac{1}{2}p \\\\\\hline\\end{array}$$\n\nA second biased four-sided die, B, is rolled. Let $Y$ be the score obtained when die B is rolled with distribution:\n\n$$\\begin{array}{|c|c|c|c|c|}\\hline y & 1 & 2 & 3 & 4 \\\\\\hline P(Y=y) & q & q & q & r \\\\\\hline\\end{array}$$';

const q11 = 'Consider a second line $L_2$ defined by the vector equation $\\mathbf{r} = \\begin{pmatrix}0\\\\1\\\\2\\end{pmatrix} + t\\begin{pmatrix}a\\\\1\\\\-1\\end{pmatrix}$ where $t \\in \\mathbb{R}$ and $a \\in \\mathbb{R}.\n\nFind the possible values of $a$ when the acute angle between $L_1$ and $L_2$ is $45^\\circ$.';

console.log('=== RUNNING FIXED Q10 ===');
const resQ10 = runFixedMathRenderer(q10);
console.log('Q10 has @@@MATH_TOKEN?:', resQ10.includes('@@@MATH_TOKEN'));
console.log('Q10 has katex-error?:', resQ10.includes('katex-error'));
console.log('Q10 has array/table in output?:', resQ10.includes('mtable') || resQ10.includes('array'));

console.log('\n=== RUNNING FIXED Q11 ===');
const resQ11 = runFixedMathRenderer(q11);
console.log('Q11 has @@@MATH_TOKEN?:', resQ11.includes('@@@MATH_TOKEN'));
console.log('Q11 has katex-error?:', resQ11.includes('katex-error'));
console.log('Q11 has pmatrix/matrix in output?:', resQ11.includes('matrix') || resQ11.includes('pmatrix'));
console.log('Q11 preview snippet:', resQ11.slice(0, 300));
