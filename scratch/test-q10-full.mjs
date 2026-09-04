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

function safeRenderKaTeX(tex, displayMode) {
  const trimmed = tex.trim();
  if (!trimmed) return '';
  try {
    return katex.renderToString(trimmed, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
    });
  } catch {
    return `<span class="font-serif italic">${escapeHtml(trimmed)}</span>`;
  }
}

function parseLatexArrayToExamTable(arrayTex, lightMode = false) {
  const match = arrayTex.match(/\\begin\{array\}\{[^}]*\}([\s\S]*?)\\end\{array\}/);
  if (!match) return null;

  let body = match[1].trim();

  // Split by LaTeX row delimiters: "\\" (escaped as \\ or \\\\)
  const rawRows = body.split(/(?:\\\\|\\newline|\r?\n)(?!\s*[a-zA-Z])/);

  const parsedRows = [];

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
    : 'w-full max-w-3xl border-collapse border-2 border-white/60 text-center font-serif my-6 shadow-sm mx-auto';

  const cellBorderClass = lightMode
    ? 'border border-slate-800 px-8 py-4 text-slate-950 font-serif'
    : 'border border-white/40 px-8 py-4 text-white font-serif';

  let html = `<div class="w-full my-6 flex justify-center overflow-x-auto"><table class="${tableClass}"><tbody>`;

  parsedRows.forEach((row, rowIdx) => {
    html += '<tr>';
    const fullRow = [...row];
    while (fullRow.length < maxCols) fullRow.push('');

    fullRow.forEach((cell, cellIdx) => {
      const isFirstCol = cellIdx === 0;
      const isHeaderRow = rowIdx === 0;

      const bgClass = lightMode
        ? (isHeaderRow ? 'bg-slate-50/50' : 'bg-white')
        : (isHeaderRow ? 'bg-white/[0.03]' : 'bg-transparent');

      const fontClass = isFirstCol ? 'font-semibold' : 'font-normal';
      const cellContent = cell ? safeRenderKaTeX(cell, false) : '&nbsp;';

      html += `<td class="${cellBorderClass} ${bgClass} ${fontClass} text-center align-middle text-[17px]">${cellContent}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  return html;
}

const content = fs.readFileSync('./src/lib/samplePapers.ts', 'utf-8');
const q10Match = content.match(/id:\s*'m21_q10',[\s\S]*?promptText:\s*'([\s\S]*?)',\s*subparts/);
let q10Prompt = q10Match[1].replace(/\\n/g, '\n').replace(/\\'/g, "'");

let text = q10Prompt;
text = text.replace(/\\\\([a-zA-Z\{\}\[\]\(\)\$])/g, '\\$1');

const placeholders = new Map();
let placeholderId = 0;
const saveToken = (rendered) => {
  const key = `@@@MATH_TOKEN_${placeholderId++}@@@`;
  placeholders.set(key, rendered);
  return key;
};

// PHASE 1: Delimited block math
text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
  if (math.includes('\\begin{array}')) {
    const examTable = parseLatexArrayToExamTable(math, true);
    if (examTable) return saveToken(examTable);
  }
  return saveToken(safeRenderKaTeX(math, true));
});

// PHASE 2: Inline math
text = text.replace(/\$([^\$]+?)\$/g, (_, math) => saveToken(safeRenderKaTeX(math, false)));

// Restore
placeholders.forEach((html, token) => {
  text = text.split(token).join(html);
});

console.log('=== TEST RESULTS ON Q10 PROMPT ===');
console.log('Has @@@MATH_TOKEN?:', text.includes('@@@MATH_TOKEN'));
console.log('Has hline as visible text?:', />([^<]*hline[^<]*)</.test(text));
console.log('Table elements count:', (text.match(/<table/g) || []).length);
console.log('Table classes:', [...text.matchAll(/class="([^"]*max-w-[^"]*)"/g)].map(m => m[1]));

const rows = text.match(/<tr>[\s\S]*?<\/tr>/g);
console.log('Total table rows in page:', rows ? rows.length : 0);
