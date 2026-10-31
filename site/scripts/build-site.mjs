import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteTarget } from '../site-target.mjs';

const mode = process.argv[2];
const env = { ...process.env, SITE_MODE: mode };
siteTarget(env); // Reject malformed origins before producing any artifact.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const args of [
  ['node_modules/astro/bin/astro.mjs', 'build'],
  ['scripts/subset-fonts.mjs'],
  ['scripts/check-sensitive.mjs'],
  ['scripts/check-site.mjs'],
]) {
  const result = spawnSync(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
