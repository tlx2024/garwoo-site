// 生成 OG 图（1200x630）。先跑 make-brand.mjs。产物提交进 public/，构建不依赖本脚本。
// 用法：在 site/ 下执行 node scripts/make-og.mjs。中文字用系统黑体渲染，只在本机重新生成时需要。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'og');
fs.mkdirSync(out, { recursive: true });

const FONT = "'Microsoft YaHei','PingFang SC','Noto Sans SC',sans-serif";
// 吉祥物：设计稿 v2 的全身形象，由 make-brand.mjs 生成。
const mascotPng = fs.readFileSync(path.join(root, 'public', 'brand', 'mascot.png')).toString('base64');
const mascot = `<image href="data:image/png;base64,${mascotPng}" x="0" y="0" width="360" height="360"/>`;

const cards = {
  'og-default': ['格物 Garwoo', '格物致知，嘎呜开工。'],
  'og-home': ['格物 Garwoo', '从本体出发，把一个领域的问题做成方案'],
  'og-packs': ['格物本体市场', '一个包，一个领域'],
};

for (const [name, [title, sub]] of Object.entries(cards)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#2f6bff"/>
  <circle cx="930" cy="315" r="205" fill="#ffffff"/>
  <g transform="translate(750 135)">${mascot}</g>
  <text x="80" y="290" font-family="${FONT}" font-size="84" font-weight="700" fill="#ffffff">${title}</text>
  <text x="80" y="370" font-family="${FONT}" font-size="32" fill="#dbe6ff">${sub}</text>
  <text x="80" y="560" font-family="${FONT}" font-size="26" fill="#bcd0ff">garwoo.cn</text>
</svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(out, `${name}.png`));
  console.log(`og/${name}.png`);
}

console.log('og/*.png；favicon 位图由 make-brand.mjs 生成');
