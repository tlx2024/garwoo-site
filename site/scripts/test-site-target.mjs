import test from 'node:test';
import assert from 'node:assert/strict';
import { siteTarget } from '../site-target.mjs';
import { artifactProblems } from './artifact-policy.mjs';
import remarkSiteLinks from './remark-site-links.mjs';
import { markdownToHtml } from 'satteri';

test('publication gates scan bundled scripts and reject browser business contracts', () => {
  const target = siteTarget({});
  for (const source of [
    'fetch("https://account.example.org/account/v1/orders")',
    'fetch("/oauth/token")', 'const value = {refresh_token: "sensitive"}',
    'const api = "/cloud/v1/jobs"', 'const client_secret = "credential"',
  ]) assert.ok(artifactProblems(source, target).length);
  assert.deepEqual(artifactProblems('fetch("/garwoo-site/pagefind/index.json")', target), []);
});

test('publication gates reject placeholder and loopback endpoints', () => {
  const target = siteTarget({});
  assert.ok(artifactProblems('href="http://localhost:8450/preview/account"', target).length);
  assert.ok(artifactProblems('href="https://account.garwoo.example/login"', target).length);
  assert.deepEqual(artifactProblems('href="https://account.garwoo.example/login"', { ...target, preview: true }), []);
  assert.ok(artifactProblems('http://127.0.0.1:8450/', { ...target, preview: true }).length);
});

test('Pages defaults expose no unfinished cloud endpoint', () => {
  const result = siteTarget({});
  assert.equal(result.base, '/garwoo-site');
  assert.equal(result.account, '');
  assert.equal(result.download, '');
  assert.equal(result.outDir, './dist/pages');
});
test('www artifact uses root paths and its own output directory', () => {
  const result = siteTarget({ SITE_MODE: 'www', WWW_ORIGIN: 'https://www.garwoo.example', SITE_PREVIEW: 'true' });
  assert.equal(result.base, '');
  assert.equal(result.outDir, './dist/www');
});
test('production www origin is accepted without the preview switch', () => {
  assert.equal(siteTarget({ SITE_MODE: 'www', WWW_ORIGIN: 'https://www.garwoo.cn' }).site, 'https://www.garwoo.cn');
  assert.throws(() => siteTarget({ SITE_MODE: 'www', WWW_ORIGIN: 'https://www.garwoo.example' }), /placeholder/);
});
test('www build cannot silently inherit Pages settings', () => {
  assert.throws(() => siteTarget({ SITE_MODE: 'www' }), /WWW_ORIGIN/);
  assert.throws(() => siteTarget({ SITE_MODE: 'unknown' }), /SITE_MODE/);
});
test('reject unsafe, unfinished or shared endpoint origins', () => {
  for (const ACCOUNT_ORIGIN of ['http://account.company.cn', 'https://user:secret@account.company.cn',
    'https://account.company.cn/path', 'https://account.company.cn?token=x', 'https://account.company.cn/#x',
    'https://account.garwoo.example', 'https://127.0.0.1', 'https://tlx2024.github.io']) {
    assert.throws(() => siteTarget({ ACCOUNT_ORIGIN }));
  }
});
test('Markdown links adapt to both bases; external links remain intact', () => {
  for (const base of ['', '/garwoo-site']) {
    const result = markdownToHtml('[FAQ](/docs/faq/) [External](https://example.org/docs/) [Title](#title) ![Image](/og.jpg)',
      { mdastPlugins: [remarkSiteLinks({ base })] });
    assert.match(result.html, new RegExp(`href="${base}/docs/faq/"`));
    assert.ok(result.html.includes('href="https://example.org/docs/"'));
    assert.ok(result.html.includes('href="#title"'));
    assert.ok(result.html.includes(`src="${base}/og.jpg"`));
  }
});

test('tone gate rejects reversal, jargon, em dash and stale claims; accepts plain statements', async () => {
  const { toneProblems, visibleText } = await import('./tone.mjs');
  for (const bad of ['这不是聊天框，而是一个本体', '一站式平台', '先查——再答', '全新发布！', '价格 1,284 积分', '本机工作区']) {
    assert.ok(toneProblems(bad).length, bad);
  }
  assert.deepEqual(toneProblems('回答带出处，没查到就说没查到。'), []);
  assert.deepEqual(toneProblems('本地工作区浏览、编辑照常可用', { terms: false }), []);
  assert.equal(visibleText('<p>甲</p><script>var a = "！";</script><p>乙</p>').includes('！'), false);
});
