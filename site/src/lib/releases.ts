// 发布清单：构建时读取各平台的 release manifest（契约见 src/data/release-manifest.schema.json）。
//
// 数据来源（按优先级）：
//   1. 环境变量 RELEASES_DIR：本地目录，里面放 windows-manifest.json / android-manifest.json，用于本地预览和测试；
//   2. 本仓库 GitHub Releases API（公开仓库，匿名即可；CI 里带上 GITHUB_TOKEN 放宽限流）：
//      取最新的、已发布（非草稿）且带清单附件的 Release。
// CI（CI=true）下取数失败直接让构建失败，避免发布后官网误显示旧状态；本地取数失败只告警，按“没有清单”处理。
import fs from 'node:fs';
import path from 'node:path';
import { PUBLIC_REPO } from '../data/site';
import { ENDPOINTS } from './target';
import { addressProblems, manifestProblems } from './manifest.mjs';

export type Platform = 'windows' | 'android';
export type Manifest = {
  schema: 1; platform: Platform; channel: 'beta' | 'stable'; public: boolean; version: string; published_at: string;
  file: string; size: number; sha256: string; urls: string[]; notes: string[];
  alternates?: { file: string; size: number; sha256: string; urls: string[] }[];
  arch?: 'x64'; min_os?: string; signature?: { status: 'Valid' | 'NotSigned'; signer_subject?: string; signer_thumbprint?: string };
  app_id?: string; version_code?: number; min_supported_version_code?: number; min_os_sdk?: number; cert_sha256?: string;
  link_proto?: { min: number; max: number }; relay_proto?: { min: number; max: number };
};

export const PLATFORMS: Platform[] = ['windows', 'android'];
const strict = process.env.CI === 'true';

function allowedPrefixes(): string[] {
  const prefixes = [`https://github.com/${PUBLIC_REPO}/releases/download/`];
  if (ENDPOINTS.download) prefixes.push(`${ENDPOINTS.download}/`);
  return prefixes;
}

/** 校验一份清单；公开清单还要求所有下载地址落在允许的前缀下。 */
export function checkManifest(value: unknown, platform: Platform, source: string): Manifest {
  const problems = manifestProblems(value);
  const manifest = value as Manifest;
  if (!problems.length && manifest.platform !== platform) problems.push(`platform: ${manifest.platform} in the ${platform} manifest`);
  if (!problems.length) problems.push(...addressProblems(manifest, allowedPrefixes()));
  if (problems.length) throw new Error(`Invalid ${platform} release manifest (${source}):\n  ${problems.join('\n  ')}`);
  return manifest;
}

function fail(message: string): null {
  if (strict) throw new Error(message);
  console.warn(`[releases] ${message}`);
  return null;
}

type GhAsset = { name: string; browser_download_url: string };
type GhRelease = { draft: boolean; published_at: string | null; assets: GhAsset[] };

async function fromGithub(platform: Platform): Promise<Manifest | null> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  let releases: GhRelease[];
  try {
    const response = await fetch(`https://api.github.com/repos/${PUBLIC_REPO}/releases?per_page=30`, { headers });
    if (!response.ok) return fail(`GitHub Releases answered ${response.status}`);
    releases = (await response.json()) as GhRelease[];
  } catch (error) {
    return fail(`cannot read GitHub Releases: ${(error as Error).message}`);
  }
  const name = `${platform}-manifest.json`;
  const found = releases
    .filter((r) => !r.draft && r.assets.some((a) => a.name === name))
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))[0];
  if (!found) return null;
  const asset = found.assets.find((a) => a.name === name)!;
  if (!asset.browser_download_url.startsWith(`https://github.com/${PUBLIC_REPO}/releases/download/`)) return fail(`unexpected manifest address ${asset.browser_download_url}`);
  const response = await fetch(asset.browser_download_url);
  if (!response.ok) return fail(`cannot download ${name}: ${response.status}`);
  return checkManifest(await response.json(), platform, asset.browser_download_url);
}

function fromDirectory(dir: string, platform: Platform): Manifest | null {
  const file = path.join(dir, `${platform}-manifest.json`);
  if (!fs.existsSync(file)) return null;
  return checkManifest(JSON.parse(fs.readFileSync(file, 'utf8')), platform, file);
}

const cache = new Map<Platform, Promise<Manifest | null>>();

/** 某平台当前的发布清单；没有就返回 null（页面沿用手写状态）。 */
export function loadManifest(platform: Platform): Promise<Manifest | null> {
  if (!cache.has(platform)) {
    cache.set(platform, process.env.RELEASES_DIR ? Promise.resolve(fromDirectory(process.env.RELEASES_DIR, platform)) : fromGithub(platform));
  }
  return cache.get(platform)!;
}
