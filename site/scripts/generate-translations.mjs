import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { translations } from '../src/data/translations.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist', 'pages', 'zh');
const output = path.join(root, 'src', 'data', 'translations.ts');
const han = /[\u3400-\u9fff]/;

function decode(value) {
  return value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

const files = [];
async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}
await walk(dist);

const phrases = new Set();
for (const file of files) {
  const html = await fs.readFile(file, 'utf8');
  for (const match of html.matchAll(/>([^<>]*[\u3400-\u9fff][^<>]*)</g)) {
    const value = decode(match[1].trim());
    if (value && han.test(value)) phrases.add(value);
  }
  for (const match of html.matchAll(/(?:alt|aria-label|title|placeholder|content)="([^"]*[\u3400-\u9fff][^"]*)"/g)) {
    const value = decode(match[1].trim());
    if (value && han.test(value)) phrases.add(value);
  }
}

// Keep reviewed English copy when seeding translations for new Chinese phrases.
const translated = new Map(Object.entries(translations));
const entries = [...phrases].filter(phrase => !translated.has(phrase));
let cursor = 0;
async function worker() {
  while (cursor < entries.length) {
    const phrase = entries[cursor++];
    if (phrase.length > 1800) {
      translated.set(phrase, phrase);
      continue;
    }
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=${encodeURIComponent(phrase)}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const result = Array.isArray(data?.[0]) ? data[0].map((part) => part?.[0] ?? '').join('') : phrase;
      translated.set(phrase, result || phrase);
    } catch {
      translated.set(phrase, phrase);
    }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));

const object = Object.fromEntries([...translated.entries()].sort(([a], [b]) => a.localeCompare(b)));
await fs.writeFile(output, `// Generated from the rendered site. Chinese remains the source locale.\nexport const translations: Record<string, string> = ${JSON.stringify(object, null, 2)};\n`);
console.log(`[translations] ${entries.length} new phrases → ${path.relative(root, output)}`);
