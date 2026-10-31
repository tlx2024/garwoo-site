// 从设计稿 v2 生成官网用的品牌图。产物提交进 public/，构建不依赖本脚本。
// 用法：在 site/ 下执行 node scripts/make-brand.mjs "<设计稿目录>"
// 目录里需要 cartoon.png、head-light.png、head-dark.png、logo-light.png、logo-dark.png（带透明通道）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const src = process.argv[2];
if (!src) throw new Error('用法：node scripts/make-brand.mjs "<设计稿目录>"');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'brand');
fs.mkdirSync(out, { recursive: true });

const open = (name) => sharp(path.join(src, `${name}.png`));
/** 去掉透明边，留一点余量，再缩放。 */
async function trimmed(name, options) {
  const trimmedBuffer = await open(name).trim({ threshold: 8 }).png().toBuffer();
  return sharp(trimmedBuffer).resize(options);
}
const webp = { quality: 88, effort: 6 };

// 全身形象：单张，明暗背景都用。
await (await trimmed('cartoon', { width: 640, height: 640, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })).webp(webp).toFile(path.join(out, 'mascot.webp'));
await (await trimmed('cartoon', { width: 512, height: 512, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })).png({ compressionLevel: 9 }).toFile(path.join(out, 'mascot.png'));
// 头像：light 用于浅色主题，dark 用于暗色主题。
for (const name of ['head-light', 'head-dark']) {
  await (await trimmed(name, { width: 256, height: 256, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })).webp(webp).toFile(path.join(out, `${name}.webp`));
}
// 横版字标。
for (const name of ['logo-light', 'logo-dark']) {
  await (await trimmed(name, { width: 1200 })).webp(webp).toFile(path.join(out, `${name}.webp`));
}
// 浏览器图标与 iOS 图标：头像放在透明底上。
await (await trimmed('head-light', { width: 32, height: 32, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })).png().toFile(path.join(root, 'public', 'favicon-32.png'));
await (await trimmed('head-light', { width: 144, height: 144, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }))
  .extend({ top: 18, bottom: 18, left: 18, right: 18, background: '#ffffff' }).flatten({ background: '#ffffff' }).png().toFile(path.join(root, 'public', 'apple-touch-icon.png'));
console.log('public/brand/*, favicon-32.png, apple-touch-icon.png');
