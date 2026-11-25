// Check actual build artifacts: stale product claims, endpoints, local links and robots policy.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { walk } from './lib.mjs';
import { siteTarget } from '../site-target.mjs';
import { artifactProblems } from './artifact-policy.mjs';
import { toneProblems, typographyProblems, visibleText } from './tone.mjs';
import { manifestProblems } from '../src/lib/manifest.mjs';
import { LEGAL, legalPagePlaceholders, legalProblems } from '../src/data/legal.mjs';

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
problems.push(...legalProblems(LEGAL).map((problem) => `src/data/legal.mjs: ${problem}`));
const titles = new Map();
const knownMistranslations = [
  [/^legal\/(?:privacy|terms)\//, /mobile phone passwords|only press when/i],
  [/^egress\//, /placed on the market|not be saved outside these platforms/i],
  [/^mobile\//, /F-03 is resistant to scrubbing/i],
  [/^packs\//, /make your body into a package|what is this bag|what['’]s in the bag|starter kit|starting package|starter package/i],
  [/^pricing\//, /\d\s+points?\b|points refill|deduct points|member points/i],
  [/^download\//, /invite internal beta|invite closed beta/i],
  [/^(?:docs|enterprise|pricing)\//, /Garwoo Enterprise(?: Edition)?/i],
];
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(dist, file), 'utf8');
  const copy = visibleText(html);
  const sourcePath = file.replace(/^zh\//, '');
  const chinese = file.startsWith('zh/');
  const alternate = chinese ? sourcePath : `zh/${file}`;
  const language = chinese ? 'zh-CN' : 'en';
  if (!html.includes(`<html lang="${language}"`)) problems.push(`${file}: wrong document language`);
  if (!fs.existsSync(path.join(dist, alternate))) problems.push(`${file}: missing alternate language page`);
  const alternateUrl = `${target.base}/${alternate.replace(/index\.html$/, '')}`;
  if (!html.match(/<a\b[^>]+data-language-switch[^>]*>/g)?.some(link => link.includes(`href="${alternateUrl}"`)))
    problems.push(`${file}: missing language switch to ${alternateUrl}`);
  // 出网清单的正文按契约原文照搬，术语不查；其余规则照常。
  // Starlight 文档页自带界面文字（搜索、目录），只查口吻与过期说法。
  for (const problem of toneProblems(copy, { terms: !/^egress\//.test(sourcePath) && !/^docs\/./.test(sourcePath) }))
    problems.push(`${file}: ${problem}`);
  if (!chinese) {
    for (const [route, phrase] of knownMistranslations) {
      const match = route.test(sourcePath) && copy.match(phrase);
      if (match) problems.push(`${file}: mistranslation: ${match[0]}`);
    }
  }
  for (const problem of typographyProblems(html)) problems.push(`${file}: ${problem}`);
  if (chinese && /^legal\//.test(sourcePath))
    for (const problem of legalPagePlaceholders(LEGAL, copy)) problems.push(`${file}: ${problem}`);
  {
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
    if (!title) problems.push(`${file}: missing <title>`);
    else if (titles.has(`${language}:${title}`)) problems.push(`${file}: duplicate <title> (${titles.get(`${language}:${title}`)})`);
    else titles.set(`${language}:${title}`, file);
    if (!description) problems.push(`${file}: missing meta description`);
    else if ([...description].length > (chinese ? 80 : 160)) problems.push(`${file}: description is too long`);
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
// Published release manifests must be valid and public, and the pages must agree with them: once a public
// Windows release exists nothing may still say the beta is invitation-only, and an unsigned build must say so.
const releasesDir = path.join(dist, 'releases');
const published = fs.existsSync(releasesDir) ? fs.readdirSync(releasesDir).filter((f) => f.endsWith('.json')) : [];
const downloadPage = fs.readFileSync(path.join(dist, 'zh', 'download', 'index.html'), 'utf8');
const changelogPage = fs.readFileSync(path.join(dist, 'changelog', 'index.html'), 'utf8');
const manifests = {};
for (const file of published) {
  const manifest = JSON.parse(fs.readFileSync(path.join(releasesDir, file), 'utf8'));
  for (const problem of manifestProblems(manifest)) problems.push(`releases/${file}: ${problem}`);
  if (manifest.public !== true) problems.push(`releases/${file}: only public manifests are published`);
  if (file !== `${manifest.platform}.json`) problems.push(`releases/${file}: name does not match platform ${manifest.platform}`);
  manifests[manifest.platform] = manifest;
  const anchor = manifest.platform === 'android' ? 'android-v' : 'v';
  if (!changelogPage.includes(`id="${anchor}${manifest.version}"`))
    problems.push(`releases/${file}: published version is missing from the changelog`);
}
if (manifests.windows) {
  const stale = /邀请内测|申请内测|尚未公开发布/;
  for (const file of htmlFiles) {
    if (stale.test(visibleText(fs.readFileSync(path.join(dist, file), 'utf8')))) problems.push(`${file}: still says the Windows beta is closed although a public release is published`);
  }
  if (!downloadPage.includes(manifests.windows.sha256)) problems.push('download: the Windows SHA-256 is not shown');
  if (manifests.windows.signature.status === 'NotSigned' && !visibleText(downloadPage).includes('没有代码签名')) problems.push('download: an unsigned build must say it has no code signature');
} else if (!downloadPage.includes(`href="${target.base}/zh/docs/trial/"`)) {
  problems.push('download: the invitation fallback must link to the trial instructions');
}
if (manifests.android && !downloadPage.includes(manifests.android.cert_sha256))
  problems.push('download: the Android signing certificate fingerprint is not shown');
const packCatalog = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'pack-catalog.json'), 'utf8'));
for (const [slug, { version }] of Object.entries(packCatalog.packs)) {
  const page = path.join(dist, 'zh', 'packs', slug, 'index.html');
  if (!fs.existsSync(page) || !visibleText(fs.readFileSync(page, 'utf8')).includes(`官方精选 · ${version}`))
    problems.push(`packs/${slug}: the page does not show catalog version ${version}`);
}
if (problems.length) throw new Error([...new Set(problems)].join('\n'));
console.log(`[site] ${target.mode}: ${htmlFiles.length} pages; product claims, links and robots passed`);
