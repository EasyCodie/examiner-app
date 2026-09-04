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
  // Don't normalize ASCII if already a LaTeX environment or structured expression
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

function processMathRenderer(content) {
  let text = content;

  // Normalize over-escaped backslashes from JSON payloads (e.g. \\frac -> \frac),
  // but DO NOT collapse double backslashes that represent newlines (\\).
  text = text.replace(/\\\\([a-zA-Z\{\}\[\]\(\)\$])/g, (match, letter) => {
    // If it's \\ followed by \hline, we want \\ \hline or \\\hline
    return '\\' + letter;
  });

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

const fileContent = fs.readFileSync('./src/lib/samplePapers.ts', 'utf-8');
const q10Match = fileContent.match(/id:\s*'m21_q10',[\s\S]*?promptText:\s*'([\s\S]*?)',\s*subparts/);
const q10Prompt = q10Match ? q10Match[1].replace(/\\n/g, '\n').replace(/\\'/g, "'") : '';

const q11bMatch = fileContent.match(/id:\s*'m21_q11_b',[\s\S]*?promptText:\s*'([\s\S]*?)',\s*markCodes/);
const q11bPrompt = q11bMatch ? q11bMatch[1].replace(/\\n/g, '\n').replace(/\\'/g, "'") : '';

console.log('=== RUNNING PROCESSED Q10 ===');
const renderedQ10 = processMathRenderer(q10Prompt);
console.log('Q10 has @@@MATH_TOKEN?:', renderedQ10.includes('@@@MATH_TOKEN'));
console.log('Q10 has katex-error?:', renderedQ10.includes('katex-error'));
console.log('Q10 has menclose/mtable (array table)?:', renderedQ10.includes('mtable') || renderedQ10.includes('menclose'));

console.log('\n=== RUNNING PROCESSED Q11(b) ===');
const renderedQ11b = processMathRenderer(q11bPrompt);
console.log('Q11b has @@@MATH_TOKEN?:', renderedQ11b.includes('@@@MATH_TOKEN'));
console.log('Q11b has katex-error?:', renderedQ11b.includes('katex-error'));
console.log('Q11b has pmatrix/matrix?:', renderedQ11b.includes('matrix') || renderedQ11b.includes('pmatrix'));
