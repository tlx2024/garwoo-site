// Check actual build artifacts: stale product claims, endpoints, local links and robots policy.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { walk } from './lib.mjs';
import { siteTarget } from '../site-target.mjs';
import { artifactProblems } from './artifact-policy.mjs';
import { toneProblems, typographyProblems, visibleText } from './tone.mjs';

const target = siteTarget(process.env);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.resolve(root, target.outDir);
const htmlFiles = walk(dist).filter((file) => file.endsWith('.html'));
if (!htmlFiles.length) throw new Error('No built HTML found');
const problems = [];
for (const file of walk(dist).filter(file => /\.(html|js|mjs|css|json|xml|txt|svg)$/i.test(file))) {
  const text = fs.readFileSync(path.join(dist, file), 'utf8');
  for (const problem of artifactProblems(text, target)) problems.push(`${file}: ${problem}`);
}
const titles = new Map();
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(dist, file), 'utf8');
  // 出网清单的正文按契约原文照搬，术语不查；其余规则照常。
  // Starlight 文档页自带界面文字（搜索、目录），只查口吻与过期说法。
  for (const problem of toneProblems(visibleText(html), { terms: !/^egress\//.test(file) && !/^docs\/./.test(file) }))
    problems.push(`${file}: ${problem}`);
  for (const problem of typographyProblems(html)) problems.push(`${file}: ${problem}`);
  {
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
    if (!title) problems.push(`${file}: missing <title>`);
    else if (titles.has(title)) problems.push(`${file}: duplicate <title> (${titles.get(title)})`);
    else titles.set(title, file);
    if (!description) problems.push(`${file}: missing meta description`);
    else if ([...description].length > 80) problems.push(`${file}: description over 80 characters`);
    if (!/<link rel="canonical" href="https?:\/\//.test(html)) problems.push(`${file}: missing canonical`);
    for (const prop of ['og:title', 'og:description', 'og:image', 'og:locale']) {
      if (!html.includes(`property="${prop}"`)) problems.push(`${file}: missing ${prop}`);
    }
    const image = html.match(/property="og:image" content="[^"]*?(\/og\/[\w-]+\.png)"/)?.[1];
    if (image && !fs.existsSync(path.join(dist, image.slice(1)))) problems.push(`${file}: og image ${image} not built`);
  }
  if (target.mode === 'www' && /(?:href|src|poster)="\/garwoo-site\//.test(html))
    problems.push(`${file}: Pages base leaked into www`);
  for (const match of html.matchAll(/\s(?:href|src|poster)="(\/[^"\s]*)"/g)) {
    const url = match[1];
    if (url.startsWith('//')) { problems.push(`${file}: protocol-relative URL`); continue; }
    const pathname = decodeURIComponent(url.split(/[?#]/)[0]);
    if (target.base && pathname !== target.base && !pathname.startsWith(`${target.base}/`)) {
      problems.push(`${file}: missing base: ${url}`); continue;
    }
    const rel = pathname.slice(target.base.length).replace(/^\//, '');
    if (!fs.existsSync(path.join(dist, rel)) && !fs.existsSync(path.join(dist, rel, 'index.html')))
      problems.push(`${file}: missing local target: ${url}`);
  }
}
// The Pages preview must not be indexed; the production build must be.
const robotsFile = path.join(dist, 'robots.txt');
if (!fs.existsSync(robotsFile)) problems.push('robots.txt missing');
else {
  const robots = fs.readFileSync(robotsFile, 'utf8');
  const blocked = /^Disallow:\s*\/\s*$/m.test(robots);
  if (target.mode === 'pages' && !blocked) problems.push('robots.txt: the Pages preview must disallow everything');
  if (target.mode === 'www' && blocked) problems.push('robots.txt: the production build must not disallow everything');
}
if (problems.length) throw new Error([...new Set(problems)].join('\n'));
console.log(`[site] ${target.mode}: ${htmlFiles.length} pages; product claims, links and robots passed`);
