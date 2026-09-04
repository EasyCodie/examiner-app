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
  const trimmed = math.trim();
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

/**
 * Converts a LaTeX \begin{array} table into a beautifully stretched, authentic IB exam HTML table.
 */
export function parseLatexArrayToExamTable(arrayTex, lightMode = false) {
  const match = arrayTex.match(/\\begin\{array\}\{[^}]*\}([\s\S]*?)\\end\{array\}/);
  if (!match) return null;

  let body = match[1].trim();

  // Normalize any trailing row breaks or hlines
  console.log('INPUT arrayTex:', JSON.stringify(arrayTex));
  console.log('body:', JSON.stringify(body));
  const rawRows = body.split(/(?:\\\\|\\newline|\r?\n)(?!\s*[a-zA-Z])/);
  console.log('rawRows length:', rawRows.length, 'rawRows:', rawRows);

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

  // Maximum columns among rows
  const maxCols = Math.max(...parsedRows.map((r) => r.length));

  const tableClass = lightMode
    ? 'w-full max-w-3xl border-collapse border-2 border-slate-900 text-center font-serif my-6 shadow-sm mx-auto'
    : 'w-full max-w-3xl border-collapse border-2 border-white/60 text-center font-serif my-6 shadow-sm mx-auto';

  const cellBorderClass = lightMode
    ? 'border border-slate-800 px-7 py-4 text-slate-950 font-serif'
    : 'border border-white/40 px-7 py-4 text-white font-serif';

  let html = `<div class="w-full my-6 flex justify-center overflow-x-auto"><table class="${tableClass}"><tbody>`;

  parsedRows.forEach((row, rowIdx) => {
    html += '<tr>';
    // Pad row with empty cells if needed
    const fullRow = [...row];
    while (fullRow.length < maxCols) fullRow.push('');

    fullRow.forEach((cell, cellIdx) => {
      // First column is usually the variable/label ($x$, $P(X=x)$)
      const isFirstCol = cellIdx === 0;
      const isHeaderRow = rowIdx === 0;

      const bgClass = lightMode
        ? (isHeaderRow ? 'bg-slate-50/50' : 'bg-white')
        : (isHeaderRow ? 'bg-white/[0.03]' : 'bg-transparent');

      const fontClass = isFirstCol ? 'font-semibold' : 'font-normal';

      const cellContent = cell ? safeRenderKaTeX(cell, false) : '&nbsp;';

      html += `<td class="${cellBorderClass} ${bgClass} ${fontClass} text-center align-middle text-[16px]">${cellContent}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  return html;
}

// Read sample paper Q10
const content = fs.readFileSync('./src/lib/samplePapers.ts', 'utf-8');
const q10Match = content.match(/id:\s*'m21_q10',[\s\S]*?promptText:\s*'([\s\S]*?)',\s*subparts/);
let q10Prompt = q10Match[1].replace(/\\n/g, '\n').replace(/\\'/g, "'");

// Run backslash normalization like MathRenderer does
q10Prompt = q10Prompt.replace(/\\\\([a-zA-Z\{\}\[\]\(\)\$])/g, '\\$1');

const arrayMatches = [...q10Prompt.matchAll(/\\begin\{array\}\{[^}]*\}[\s\S]*?\\end\{array\}/g)];
console.log(`Found ${arrayMatches.length} array tables in Q10!`);

arrayMatches.forEach((m, idx) => {
  console.log(`\n=== PARSING TABLE ${idx + 1} ===`);
  const html = parseLatexArrayToExamTable(m[0], true);
  console.log('HTML length:', html ? html.length : 0);
  console.log('Contains hline text?:', html ? html.includes('hline') : false);
  const rows = html ? html.match(/<tr>[\s\S]*?<\/tr>/g) : [];
  console.log(`Row count: ${rows.length}`);
  rows.forEach((r, ri) => console.log(` Row ${ri + 1} cell count: ${(r.match(/<td/g) || []).length}`));
});
