// 构建后门禁：扫描 dist，发现内网地址、默认账号口令、本机路径、私有仓库名、
// 密钥形态的字符串、不该出现的文件类型，或没有带 base 的站内链接，就让构建失败。
// 本仓是公开仓，写进来的东西立即可见；主仓方案文档的原文不得拷进来。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { walk } from './lib.mjs';
import { siteTarget } from '../site-target.mjs';
const target = siteTarget(process.env);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = `${target.base}/`;
const TEXT_EXT = /\.(html|js|mjs|css|json|xml|txt|md|svg|webmanifest|vtt)$/i;

const RULES = [
  { name: '内网地址 192.168.x.x', re: /\b192\.168\.\d{1,3}\.\d{1,3}\b/ },
  { name: '内网地址 10.x.x.x', re: /(?<![\d.])10\.\d{1,3}\.\d{1,3}\.\d{1,3}(?![\d.])/ },
  { name: '内网地址 172.16–31.x.x', re: /\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/ },
  { name: '默认口令', re: /\b(admin|operator|rnd)123\b/i },
  { name: '演示账号域', re: /@demo\.local\b/i },
  { name: '本机路径', re: /\b[A-Za-z]:(?:\\|\/)+(Users|0workspace)\b|\/home\/[a-z_][\w-]*\//i },
  { name: '私有源码仓库', re: /tlx2024\/(industrial-ai|iai-cloud)\b/i },
  { name: '内部展示环境', re: /\b126\s*(服务器|展示|环境)|ssh\s+studio\b/ },
  { name: '密钥形态字符串', re: /\bsk-[A-Za-z0-9]{24,}|\bghp_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{30,}|\bAKIA[0-9A-Z]{16}\b|-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];
const FORBIDDEN_FILES = /(^|\/)\.env(\.|$)|\.(db|sqlite|pem|key|pfx|p12)$/i;

const dir = path.resolve(root, target.outDir);
const problems = [];
for (const rel of walk(dir)) {
  const shown = `dist/${rel}`;
  if (FORBIDDEN_FILES.test(rel)) problems.push(`${shown}: 不应发布的文件类型`);
  if (!TEXT_EXT.test(rel)) continue;
  const text = fs.readFileSync(path.join(dir, rel), 'utf8');
  for (const { name, re } of RULES) {
    const m = text.match(re);
    if (m) {
      const at = text.slice(0, m.index).split('\n').length;
      problems.push(`${shown}:${at}: ${name} → “${m[0]}”`);
    }
  }
  // 站内绝对链接必须带 base（GitHub Pages 子路径），否则上线后 404
  if (rel.endsWith('.html')) {
    for (const m of text.matchAll(/\s(?:href|src|poster)="(\/[^"/][^"]*)"/g)) {
      if (!m[1].startsWith(BASE)) problems.push(`${shown}: 站内链接缺少 base → ${m[1]}`);
    }
  }
}

if (problems.length) {
  console.error(`[check] 去敏与链接检查未通过，共 ${problems.length} 处：`);
  for (const p of [...new Set(problems)]) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('[check] 去敏与链接检查通过');
