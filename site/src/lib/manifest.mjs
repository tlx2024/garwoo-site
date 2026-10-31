// Release manifest checks. Mirrors site/src/data/release-manifest.schema.json (a copy of the product
// repo's contract) by hand so the build needs no schema library; scripts/test-releases.mjs runs the
// same example and refusal cases as the product repo's tests.

const SHA256 = /^[0-9a-f]{64}$/;
const FILE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const URL_PATTERN = /^https:\/\/[^\s/]+\.[^\s/]+\/\S*$/;
const COMMON = ['schema', 'platform', 'channel', 'public', 'version', 'published_at', 'file', 'size', 'sha256', 'urls', 'notes', 'alternates'];
const WINDOWS = ['arch', 'min_os', 'signature'];
const ANDROID = ['app_id', 'version_code', 'min_supported_version_code', 'min_os_sdk', 'cert_sha256', 'link_proto', 'relay_proto'];

const isInt = (v, min = 1) => Number.isInteger(v) && v >= min;

function checkUrls(urls, where, problems) {
  if (!Array.isArray(urls) || urls.length < 1 || urls.length > 4) return problems.push(`${where}: 1 to 4 addresses`);
  for (const url of urls) if (typeof url !== 'string' || !URL_PATTERN.test(url)) problems.push(`${where}: ${JSON.stringify(url)} is not an https address`);
}

function checkFile(item, where, problems) {
  if (typeof item.file !== 'string' || !FILE.test(item.file)) problems.push(`${where}.file: ASCII without spaces`);
  if (!isInt(item.size)) problems.push(`${where}.size: positive integer`);
  if (typeof item.sha256 !== 'string' || !SHA256.test(item.sha256)) problems.push(`${where}.sha256: 64 lowercase hex digits`);
  checkUrls(item.urls, `${where}.urls`, problems);
}

function checkRange(range, where, problems) {
  if (!range || typeof range !== 'object' || !isInt(range.min) || !isInt(range.max) || range.min > range.max
      || Object.keys(range).some((k) => !['min', 'max'].includes(k))) problems.push(`${where}: {min, max} with min <= max`);
}

/** @returns {string[]} problems; empty when the manifest is valid. */
export function manifestProblems(m) {
  const problems = [];
  if (!m || typeof m !== 'object' || Array.isArray(m)) return ['manifest: object expected'];
  if (m.schema !== 1) problems.push('schema: must be 1');
  if (!['windows', 'android'].includes(m.platform)) problems.push('platform: windows or android');
  const platformFields = m.platform === 'windows' ? WINDOWS : m.platform === 'android' ? ANDROID : [];
  const required = ['schema', 'platform', 'channel', 'public', 'version', 'published_at', 'file', 'size', 'sha256', 'urls', 'notes', ...platformFields];
  for (const key of required) if (!(key in m)) problems.push(`${key}: required`);
  const allowed = new Set([...COMMON, ...platformFields]);
  for (const key of Object.keys(m)) if (!allowed.has(key)) problems.push(`${key}: not allowed${[...WINDOWS, ...ANDROID].includes(key) ? ' for this platform' : ''}`);
  if (!['beta', 'stable'].includes(m.channel)) problems.push('channel: beta or stable');
  if (typeof m.public !== 'boolean') problems.push('public: boolean');
  if (typeof m.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(m.version)) problems.push('version: x.y.z');
  if (typeof m.published_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(m.published_at)) problems.push('published_at: UTC timestamp');
  checkFile(m, 'manifest', problems);
  if (!Array.isArray(m.notes) || m.notes.length > 30 || m.notes.some((n) => typeof n !== 'string' || !n || n.length > 300)) problems.push('notes: up to 30 short strings');
  if ('alternates' in m) {
    if (!Array.isArray(m.alternates)) problems.push('alternates: array');
    else m.alternates.forEach((a, i) => {
      checkFile(a, `alternates[${i}]`, problems);
      for (const key of Object.keys(a)) if (!['file', 'size', 'sha256', 'urls'].includes(key)) problems.push(`alternates[${i}].${key}: not allowed`);
    });
  }
  if (m.platform === 'windows') {
    if ('arch' in m && m.arch !== 'x64') problems.push('arch: x64');
    if ('min_os' in m && (typeof m.min_os !== 'string' || !m.min_os)) problems.push('min_os: non-empty string');
    const sig = m.signature;
    if (sig !== undefined) {
      if (!sig || typeof sig !== 'object' || !['Valid', 'NotSigned'].includes(sig.status)) problems.push('signature.status: Valid or NotSigned');
      else {
        for (const key of Object.keys(sig)) if (!['status', 'signer_subject', 'signer_thumbprint'].includes(key)) problems.push(`signature.${key}: not allowed`);
        if (sig.status === 'Valid') {
          if (typeof sig.signer_subject !== 'string' || !sig.signer_subject) problems.push('signature.signer_subject: required when Valid');
          if (typeof sig.signer_thumbprint !== 'string' || !/^[0-9A-Fa-f]{40}$/.test(sig.signer_thumbprint)) problems.push('signature.signer_thumbprint: 40 hex digits when Valid');
        } else if ('signer_subject' in sig || 'signer_thumbprint' in sig) problems.push('signature: an unsigned build cannot name a signer');
        if (m.channel === 'stable' && sig.status !== 'Valid') problems.push('signature.status: a stable release must be Valid');
      }
    }
  }
  if (m.platform === 'android') {
    if ('app_id' in m && !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(m.app_id)) problems.push('app_id: package name');
    for (const key of ['version_code', 'min_supported_version_code', 'min_os_sdk']) if (key in m && !isInt(m[key])) problems.push(`${key}: positive integer`);
    if ('cert_sha256' in m && !SHA256.test(m.cert_sha256)) problems.push('cert_sha256: 64 lowercase hex digits');
    for (const key of ['link_proto', 'relay_proto']) if (key in m) checkRange(m[key], key, problems);
  }
  return problems;
}

/** Every address must sit under one of the allowed prefixes (the public Release, optionally the download origin). */
export function addressProblems(m, prefixes) {
  const urls = [...m.urls, ...(m.alternates ?? []).flatMap((a) => a.urls)];
  return urls.filter((u) => !prefixes.some((p) => u.startsWith(p))).map((u) => `${u}: outside the allowed download addresses`);
}
