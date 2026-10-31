// 文案口吻与术语门禁。规则是产品仓统一话术总表 §8、§术语表的副本，总表变化时手动同步。
// 只扫构建产物里的可见文字（去掉 script、style 与标签）。
const STOP = '[^。！？；;\\n]';

export const HARD = [
  ['翻案', new RegExp(
    `(?<!是)不是${STOP}{0,40}?而是|并非${STOP}{0,40}?而是|不在于${STOP}{0,40}?而在于|` +
    `与其说${STOP}{0,40}?不如说|看似${STOP}{0,30}?实则|你以为${STOP}{0,30}?其实|` +
    '(?<!是)不是[^。！？；;，,\\n]{1,24}[，,]\\s*是|[，,]\\s*而非|说到底|恰恰相反|回头才发现')],
  ['破折号', /——/],
  ['路标', /值得注意的是|需要指出的是|更微妙的是|从某种意义上说?|说白了|说穿了|先说结论|更深一层|换句话说|本质上/],
  ['黑话', /赋能|打造|一站式|全方位|革命性|颠覆|业内最优|自主进化|全自动|打通|抓手|全链路|无缝|降本增效|底层逻辑|颗粒度|智能化/],
  ['感叹号', /[!！]/],
];

/** 个人版语境的用词：左边不用，换成右边。 */
export const TERMS = [
  [/工作区/, '项目'],
  [/知识模型/, '本体'],
  [/AI 助手/, '智能体'],
  [/定时任务|计划任务/, '日程'],
  [/引用来源|参考资料/, '出处'],
];

/** 已知写错过的数字、名称和过期说法。 */
export const STALE = /\b(?:1,284|GX-118|B7|B9)\b|溶胀|GB\/T 11417|下载安装包|120\s*天|离线试用|桌面试用|下载试用|IAI-Trial_|原文永不上传|最终解释权/;

export function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '\n')
    .replace(/<(?:p|div|li|h[1-6]|tr|td|th|section|article|br)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

/** 返回 [{kind, text, fix}]。terms 为 false 时不查术语（出网清单按契约原文照搬）。 */
export function toneProblems(text, { terms = true } = {}) {
  const out = [];
  for (const [kind, re] of HARD) {
    const m = text.match(re);
    if (m) out.push(`${kind}：“${m[0]}”`);
  }
  if (terms) {
    for (const [re, use] of TERMS) {
      const m = text.match(re);
      if (m) out.push(`术语：“${m[0]}” 应写“${use}”`);
    }
  }
  const stale = text.match(STALE);
  if (stale) out.push(`过期或错误说法：“${stale[0]}”`);
  return out;
}

/** 排版：逐个文本节点检查，中文与拉丁字母、数字之间留空格，中文后不跟半角标点。 */
export function typographyProblems(html) {
  const nodes = html.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, '\n').replace(/<[^>]+>/g, '\n').split('\n');
  const rules = [
    ['中文与字母数字之间缺空格', /[一-鿿][A-Za-z0-9]|[A-Za-z0-9][一-鿿]/],
    ['中文旁的半角标点', /[一-鿿][,;:?!]|[一-鿿]\.(?=\s|$)|[,;:?!][一-鿿]/],
  ];
  const out = [];
  for (const node of nodes) {
    for (const [kind, re] of rules) {
      const m = node.match(re);
      if (m) out.push(`${kind}：“${node.slice(Math.max(0, m.index - 6), m.index + 8).trim()}”`);
    }
  }
  return out;
}
