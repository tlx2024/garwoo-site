import test from 'node:test';
import assert from 'node:assert/strict';
import { addressProblems, manifestProblems } from '../src/lib/manifest.mjs';

const REPO = 'https://github.com/tlx2024/garwoo-site/releases/download/';
const windows = () => ({
  schema: 1, platform: 'windows', channel: 'beta', public: true, version: '0.2.1', published_at: '2026-11-01T08:00:00Z',
  file: 'Garwoo_0.2.1_x64-setup.exe', size: 76064186, sha256: 'a'.repeat(64), urls: [`${REPO}v0.2.1/Garwoo_0.2.1_x64-setup.exe`],
  alternates: [{ file: 'Garwoo_0.2.1_x64_zh-CN.msi', size: 91779731, sha256: 'b'.repeat(64), urls: [`${REPO}v0.2.1/Garwoo_0.2.1_x64_zh-CN.msi`] }],
  arch: 'x64', min_os: 'Windows 10', signature: { status: 'NotSigned' }, notes: ['A change.'],
});
const android = () => ({
  schema: 1, platform: 'android', channel: 'beta', public: true, version: '1.0.0', published_at: '2026-11-20T08:00:00Z',
  file: 'iai-mobile-release.apk', size: 3422783, sha256: 'c'.repeat(64), urls: [`${REPO}android-v1.0.0/iai-mobile-release.apk`],
  app_id: 'ltd.xianjian.iai.mobile', version_code: 1, min_supported_version_code: 1, min_os_sdk: 26, cert_sha256: 'd'.repeat(64),
  link_proto: { min: 1, max: 1 }, relay_proto: { min: 2, max: 2 }, notes: ['A change.'],
});
const without = (m, key) => { const copy = structuredClone(m); delete copy[key]; return copy; };
const mentions = (m, text) => manifestProblems(m).some((p) => p.includes(text));

test('valid Windows and Android manifests pass', () => {
  assert.deepEqual(manifestProblems(windows()), []);
  assert.deepEqual(manifestProblems(android()), []);
});

test('required fields, formats and unknown fields are refused', () => {
  for (const key of ['sha256', 'urls', 'signature', 'notes', 'public']) assert.ok(mentions(without(windows(), key), key), key);
  for (const [field, value] of [['sha256', 'ABC'], ['urls', ['http://github.com/x/releases/download/v/f.exe']], ['file', 'has space.exe'],
    ['file', '安装.exe'], ['version', '0.2'], ['channel', 'nightly']]) {
    assert.ok(mentions({ ...windows(), [field]: value }, field), field);
  }
  for (const extra of ['revision', 'cloudPin', 'accountOrigin', 'testSigning']) assert.ok(mentions({ ...windows(), [extra]: 'x' }, extra), extra);
});

test('a stable Windows release must be validly signed; a beta may be unsigned', () => {
  const stable = { ...windows(), channel: 'stable' };
  assert.ok(mentions(stable, 'stable'));
  stable.signature = { status: 'Valid', signer_subject: 'CN=Example', signer_thumbprint: 'A'.repeat(40) };
  assert.deepEqual(manifestProblems(stable), []);
  assert.ok(mentions({ ...stable, signature: { status: 'Valid' } }, 'signer_subject'));
  assert.ok(mentions({ ...windows(), signature: { status: 'NotSigned', signer_subject: 'CN=Example' } }, 'unsigned'));
});

test('platform fields do not cross', () => {
  assert.ok(mentions({ ...windows(), cert_sha256: 'a'.repeat(64) }, 'cert_sha256'));
  assert.ok(mentions({ ...android(), signature: { status: 'NotSigned' } }, 'signature'));
  assert.ok(mentions(without(android(), 'cert_sha256'), 'cert_sha256'));
  assert.ok(mentions({ ...android(), relay_proto: { min: 3, max: 2 } }, 'relay_proto'));
});

test('addresses must sit under the public Release of this repository (or the configured download origin)', () => {
  const prefixes = [REPO];
  assert.deepEqual(addressProblems(windows(), prefixes), []);
  assert.equal(addressProblems({ ...windows(), urls: ['https://evil.example.com/a.exe'] }, prefixes).length, 1);
  assert.equal(addressProblems(windows(), ['https://download.example.cn/']).length, 2);
});
