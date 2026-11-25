// 法律文本的待定项只在这里填。全部填完并经运营主体或法务审定后，把 draft 改为 false 再发布。
export const LEGAL = {
  draft: true,
  version: '2026.11.25-draft.2',
  updated: '2026-11-25',
  /** 生效日期，YYYY-MM-DD */
  effective: '',
  operator: '',
  address: '',
  email: '',
  /** 查阅、复制、更正与注销请求的受理渠道 */
  requestChannel: '',
  /** 运维日志保存天数 */
  logDays: '',
  /** 注销完成后安全审计记录的保存天数；须与云端 IAI_CLOUD_PRIVACY_AUDIT_RETENTION_DAYS 一致 */
  auditDays: '',
  /** 注销完成后积分、订单等账务记录的保存天数；须与 IAI_CLOUD_PRIVACY_FACTS_RETENTION_DAYS 一致 */
  factsDays: '',
  /** 责任限制、适用法律与争议解决，由运营主体或法务提供 */
  disputes: '',
};

const REQUIRED = ['effective', 'operator', 'address', 'email', 'requestChannel', 'logDays', 'auditDays', 'factsDays', 'disputes'];

export function legalProblems(legal) {
  const problems = [];
  if (legal.draft) {
    if (!/draft/.test(legal.version)) problems.push('draft legal text needs a draft version');
    return problems;
  }
  for (const key of REQUIRED) if (!String(legal[key] ?? '').trim()) problems.push(`legal text is final but ${key} is empty`);
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(legal.version) || /draft/i.test(legal.version)) problems.push('final legal text needs a non-draft version');
  if (legal.effective && !/^\d{4}-\d{2}-\d{2}$/.test(legal.effective)) problems.push('effective must be YYYY-MM-DD');
  if (legal.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(legal.email)) problems.push('email is not an address');
  for (const key of ['logDays', 'auditDays', 'factsDays'])
    if (legal[key] && !/^[1-9]\d*$/.test(String(legal[key]))) problems.push(`${key} must be a whole number of days`);
  return problems;
}

/** 构建产物里的残留占位：正式文本不允许出现【】或未决说明。 */
export function legalPagePlaceholders(legal, text) {
  if (legal.draft) return [];
  const found = [];
  if (/【[^】]*】/.test(text)) found.push('placeholder 【】 in final legal text');
  if (/待核|待定稿|待审定/.test(text)) found.push('unresolved note in final legal text');
  return found;
}

export const fill = (value, label) => value || `【${label}】`;
