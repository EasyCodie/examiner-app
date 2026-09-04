import katex from 'katex';

// String in JS memory has ONE backslash before begin:
const table = `\\begin{array}{|c|c|c|c|c|}\\hline x & 1 & 2 & 3 & 4 \\\\\\hline P(X=x) & p & p & p & \\frac{1}{2}p \\\\\\hline\\end{array}`;

console.log('Exact string in memory:');
console.log(table);

const html = katex.renderToString(table, {
  displayMode: true,
  throwOnError: false,
  output: 'htmlAndMathml',
  strict: false,
});

console.log('\nDoes HTML contain katex-error?:', html.includes('katex-error'));
console.log('Does HTML contain color:#cc0000?:', html.includes('#cc0000'));
console.log('HTML length:', html.length);
console.log('\nFirst 500 chars of rendered HTML:\n', html.slice(0, 500));
