// 构建后：按 dist 里所有 HTML 的实际用字，生成 Noto Sans SC 可变字重（400–700）子集。
// 输出 dist/fonts/NotoSansSC-subset.woff2，并同步一份到 public/fonts/（已 gitignore），供本地 dev 使用。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';
import { walk } from './lib.mjs';
import { siteTarget } from '../site-target.mjs';
const target = siteTarget(process.env);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.resolve(root, target.outDir);
const SOURCE = path.join(root, 'fonts', 'NotoSansSC-VF.woff2');
const OUT = 'fonts/NotoSansSC-subset.woff2';

// 只收中文排版会用到的区段；其余字符（如各语言的搜索界面文案）交给回退字体
const RANGES = [
  [0x20, 0x7e], [0xa0, 0xff], [0x2000, 0x206f], [0x2190, 0x21ff], [0x2200, 0x22ff],
  [0x2460, 0x24ff], [0x2500, 0x257f], [0x25a0, 0x25ff], [0x2600, 0x27bf],
  [0x3000, 0x303f], [0x3400, 0x4dbf], [0x4e00, 0x9fff], [0xff00, 0xffef],
];
const keep = (cp) => RANGES.some(([a, b]) => cp >= a && cp <= b);

const files = walk(dist).filter((f) => f.endsWith('.html'));
if (!files.length) {
  console.error('[fonts] dist 里没有 HTML，先运行 astro build');
  process.exit(1);
}
const chars = new Set();
for (const f of files) {
  for (const ch of fs.readFileSync(path.join(dist, f), 'utf8')) {
    if (keep(ch.codePointAt(0))) chars.add(ch);
  }
}
// 常用标点与数字总是保留，避免少量动态文案缺字
for (const ch of '，。、；：？！“”‘’（）《》【】—…·0123456789') chars.add(ch);

const text = [...chars].join('');
const font = await subsetFont(fs.readFileSync(SOURCE), text, {
  targetFormat: 'woff2',
  variationAxes: { wght: { min: 400, max: 700 } },
});
for (const dir of [dist, path.join(root, 'public')]) {
  fs.mkdirSync(path.join(dir, 'fonts'), { recursive: true });
  fs.writeFileSync(path.join(dir, OUT), font);
}
const cjk = [...chars].filter((c) => c.codePointAt(0) >= 0x3400).length;
console.log(`[fonts] ${files.length} 个页面，${chars.size} 个字符（其中中日韩 ${cjk} 个）→ ${OUT} ${(font.length / 1024).toFixed(0)} KB`);
