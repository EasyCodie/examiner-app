import fs from 'fs';
import { renderContent } from './test-unified-fix.mjs';

const content = fs.readFileSync('./src/lib/samplePapers.ts', 'utf-8');
const q10Match = content.match(/id:\s*'m21_q10',[\s\S]*?promptText:\s*'([\s\S]*?)',\s*subparts/);
const q10Prompt = q10Match[1].replace(/\\n/g, '\n').replace(/\\'/g, "'");

const cleanedPromptText = q10Prompt
  .replace(/^Section\s+[AB]\s*(?:\(Question\s*\d+\))?:\s*/i, '')
  .replace(/^Question\s*\d+:\s*/i, '')
  .trim();

console.log('--- CLEANED PROMPT TEXT ---');
console.log(cleanedPromptText);

const rendered = renderContent(cleanedPromptText, true);

const cleanHtml = rendered.replace(/<annotation[\s\S]*?<\/annotation>/g, '');
console.log('Clean HTML includes hline?:', cleanHtml.includes('hline'));

// Check for hline in text
const textMatches = cleanHtml.match(/>([^<]*hline[^<]*)</g);
console.log('Text matches containing hline:', textMatches);
