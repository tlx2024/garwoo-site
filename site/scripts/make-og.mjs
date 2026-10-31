// 生成 OG 图（1200x630）与 favicon 位图。产物提交进 public/，构建不依赖本脚本。
// 用法：在 site/ 下执行 node scripts/make-og.mjs。中文字用系统黑体渲染，只在本机重新生成时需要。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'og');
fs.mkdirSync(out, { recursive: true });

const FONT = "'Microsoft YaHei','PingFang SC','Noto Sans SC',sans-serif";
// 吉祥物（占位稿），颜色固定：主蓝、深蓝角与脚、浅蓝肚皮。
const mascot = `
  <path d="M37 33 43 11 54 29Z M66 29 77 11 83 33Z" fill="#1f4fd6"/>
  <ellipse cx="44" cy="108" rx="11" ry="6" fill="#1f4fd6"/><ellipse cx="76" cy="108" rx="11" ry="6" fill="#1f4fd6"/>
  <path d="M20 66q-10 4-8 14M100 66q10 4 8 14" stroke="#2f6bff" stroke-width="7" stroke-linecap="round" fill="none"/>
  <path d="M18 70C18 42 36 25 60 25s42 17 42 45c0 26-17 39-42 39S18 96 18 70Z" fill="#2f6bff"/>
  <ellipse cx="60" cy="88" rx="25" ry="16" fill="#e8efff"/>
  <circle cx="45" cy="57" r="10" fill="#fff"/><circle cx="75" cy="57" r="10" fill="#fff"/>
  <circle cx="47.5" cy="59" r="4.6" fill="#161b26"/><circle cx="77.5" cy="59" r="4.6" fill="#161b26"/>
  <circle cx="49" cy="57" r="1.4" fill="#fff"/><circle cx="79" cy="57" r="1.4" fill="#fff"/>
  <path d="M45 73Q60 99 75 73Z" fill="#161b26"/><path d="M49 73l3.5 6 3.5-6Z M64 73l3.5 6 3.5-6Z" fill="#fff"/>
  <path d="M54 86q6 5 12 0" stroke="#FF6B8A" stroke-width="4" stroke-linecap="round" fill="none"/>`;

const cards = {
  'og-default': ['格物 Garwoo', '格物致知，嘎呜开工。'],
  'og-home': ['格物 Garwoo', '从本体出发，把一个领域的问题做成方案'],
  'og-packs': ['格物本体市场', '一个包，一个领域'],
};

for (const [name, [title, sub]] of Object.entries(cards)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#2f6bff"/>
  <circle cx="930" cy="315" r="205" fill="#ffffff"/>
  <g transform="translate(775 160) scale(2.6)">${mascot}</g>
  <text x="80" y="290" font-family="${FONT}" font-size="84" font-weight="700" fill="#ffffff">${title}</text>
  <text x="80" y="370" font-family="${FONT}" font-size="32" fill="#dbe6ff">${sub}</text>
  <text x="80" y="560" font-family="${FONT}" font-size="26" fill="#bcd0ff">garwoo.cn</text>
</svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(out, `${name}.png`));
  console.log(`og/${name}.png`);
}

const mini = fs.readFileSync(path.join(root, 'public', 'favicon.svg'));
for (const size of [32, 180]) {
  await sharp(mini, { density: 384 }).resize(size, size).png().toFile(path.join(root, 'public', size === 180 ? 'apple-touch-icon.png' : 'favicon-32.png'));
}
console.log('favicon-32.png, apple-touch-icon.png');
