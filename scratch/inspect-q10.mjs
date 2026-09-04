import fs from 'fs';
import katex from 'katex';

const content = fs.readFileSync('./src/lib/samplePapers.ts', 'utf-8');
const q10Match = content.match(/id:\s*'m21_q10',[\s\S]*?promptText:\s*'([\s\S]*?)',\s*subparts/);
const q10Prompt = q10Match[1].replace(/\\n/g, '\n').replace(/\\'/g, "'");

let text = q10Prompt;
text = text.replace(/\\\\([a-zA-Z\{\}\[\]\(\)\$])/g, '\\$1');

// Match the array inside $$...$$
const mathMatch = text.match(/\$\$([\s\S]*?)\$\$/);
const math = mathMatch[1];
console.log('Math string to KaTeX:');
console.log(JSON.stringify(math));

const html = katex.renderToString(math, {
  displayMode: true,
  throwOnError: false,
  output: 'htmlAndMathml',
  strict: false,
});

const withoutAnnotation = html.replace(/<annotation[\s\S]*?<\/annotation>/, '');
console.log('\nDoes KaTeX output HTML contain hline in visible spans?:', withoutAnnotation.includes('hline'));
if (withoutAnnotation.includes('hline')) {
  console.log('\nHline context:');
  const matches = [...withoutAnnotation.matchAll(/([^<]{0,30}hline[^<]{0,30})/g)];
  for (const m of matches) {
    console.log('Match:', m[0]);
  }
}
