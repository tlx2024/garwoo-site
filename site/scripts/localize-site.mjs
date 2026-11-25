import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, parseFragment, serialize } from 'parse5';
import { siteTarget } from '../site-target.mjs';
import { chrome } from '../src/lib/i18n.ts';
import { translations } from '../src/data/translations.ts';
import { walk } from './lib.mjs';

const target = siteTarget(process.env);
const dist = fileURLToPath(new URL(`../${target.outDir}/`, import.meta.url));
const overrides = {
  ...Object.fromEntries(Object.keys(chrome.zh).map(key => [chrome.zh[key], chrome.en[key]])),
  '格物': 'Garwoo',
  '格物 Garwoo': 'Garwoo',
  '格物首页': 'Garwoo home',
  '切换明暗': 'Toggle theme',
  '从本体出发，把一个领域的问题做成方案。': 'Turn a domain problem into a plan with an ontology.',
  '跟随一项任务，从设定目标到记录结果。': 'Follow a task from goal to recorded result.',
  '构建你自己的专业领域': 'Build your own professional domain',
  '把资料整理成本体与对象，再按目标排出能核对出处的行动。': 'Turn evidence into ontologies and objects, then map goals to actions with traceable sources.',
  '个人项目 / 01': 'PERSONAL PROJECT / 01',
  '示例项目：配方研发': 'Example project: formulation R&D',
  '正在按本体整理项目资料': 'Organizing project evidence by ontology',
  '选择领域': 'Choose a domain',
  '看案例': 'See an example',
  '你想先做哪件事？': 'What do you want to work on first?',
  '查看任务': 'View the task',
  '设定目标': 'Set a goal',
  '整理资料': 'Organize evidence',
  '核对结果': 'Review results',
  '完成闭环': 'Close the loop',
  '开始自己的任务': 'Start your own task',
  '看第一个项目': 'See your first project',
  '/ 月': '/ month',
  '资料': 'Materials',
  '目标': 'Goal',
  '格物个人版逐条列出什么会发出去：发送什么、发到哪、云端保留多久、费用和离线时的行为。': 'See what Garwoo sends, where it goes, how long it is kept, what it costs, and what works offline.',
  '从目标与专业包开始，组织知识、配置智能体，把决策交给具体任务，再将结果带回项目。': 'Organize project evidence, configure agents, and record the results of delegated tasks.',
  '用手机连接格物桌面端，查看项目、发送资料。了解浏览器、Android、微信小程序和 iOS 的开放状态。': 'Connect to Garwoo from your phone to view projects and send materials. Check availability by platform.',
  '从专业包开始构建自己的领域。查看一人公司、配方研发组、隐形眼镜工厂起步包，以及七种项目任务示例。': 'Explore starter packs for solo companies, formulation R&D teams, and contact lens factories, plus seven example projects.',
  '格物价格：客户端免费，官方 AI 按积分；接自己的模型不扣积分。页面金额为示例。': 'Garwoo is free to install. Official AI uses credits. Bring your own model to use it without Garwoo credits.',
};
const languageScriptVersion = createHash('sha256').update(fs.readFileSync(path.join(dist, 'language.js'))).digest('hex').slice(0, 12);
const absoluteUrl = pathname => `${target.site}${target.base}${pathname}`;

const files = walk(dist).filter(file => /(?:index|404)\.html$/.test(file));
const documents = files.map(file => {
  const source = fs.readFileSync(path.join(dist, file), 'utf8');
  const document = parse(source);
  const html = document.childNodes.find(node => node.tagName === 'html');
  const body = html.childNodes.find(node => node.tagName === 'body');
  const route = '/' + file.replace(/index\.html$/, '');
  return { file, source, route, marketing: body.attrs.some(attr => attr.name === 'data-localize-site') };
});
const routes = new Set(documents.map(({ route }) => route));
for (const { marketing, route } of documents) {
  if (marketing) routes.add(`/zh${route}`);
}

for (const page of documents) {
  if (page.marketing) {
    writePage(page, 'zh');
    writePage(page, 'en');
  } else {
    writePage(page, page.route.startsWith('/zh/') ? 'zh' : 'en');
  }
}

const sitemap = path.join(dist, 'sitemap-0.xml');
if (fs.existsSync(sitemap)) {
  let xml = fs.readFileSync(sitemap, 'utf8');
  const chineseEntries = [];
  for (const { marketing, route } of documents) {
    const url = absoluteUrl(route);
    const original = `<url><loc>${url}</loc></url>`;
    if (!marketing || !xml.includes(original)) continue;
    const chineseUrl = absoluteUrl(`/zh${route}`);
    const alternates = `<xhtml:link rel="alternate" hreflang="en" href="${url}"/><xhtml:link rel="alternate" hreflang="zh-CN" href="${chineseUrl}"/>`;
    xml = xml.replace(original, `<url><loc>${url}</loc>${alternates}</url>`);
    chineseEntries.push(`<url><loc>${chineseUrl}</loc>${alternates}</url>`);
  }
  fs.writeFileSync(sitemap, xml.replace('</urlset>', `${chineseEntries.join('')}</urlset>`));
}

function writePage({ file, source, route, marketing }, locale) {
  const document = parse(source);
  const html = document.childNodes.find(node => node.tagName === 'html');
  const chinese = locale === 'zh';
  const localizedRoute = marketing && chinese ? `/zh${route}` : route;
  const output = marketing && chinese ? `zh/${file}` : file;
  const head = html.childNodes.find(node => node.tagName === 'head');
  const language = chinese ? 'zh-CN' : 'en';
  const rootRoute = localizedRoute.replace(/^\/zh\//, '/');
  const alternate = chinese ? rootRoute : `/zh${rootRoute}`;
  const canonical = absoluteUrl(localizedRoute);

  visit(html, node => {
    if (marketing && !chinese && node.nodeName === '#text' &&
        !['script', 'style', 'code', 'pre', 'noscript'].includes(node.parentNode.tagName) &&
        !node.parentNode.attrs?.some(attr => attr.name === 'data-language-switch')) {
      node.value = translate(node.value);
    }
    if (!node.attrs) return;
    const attributes = Object.fromEntries(node.attrs.map(attr => [attr.name, attr]));
    if (node === html && marketing) attributes.lang.value = language;
    if (marketing && !chinese) {
      for (const name of ['alt', 'aria-label', 'title', 'placeholder', 'content', 'data-record', 'data-pending']) {
        if (attributes[name]) attributes[name].value = translate(attributes[name].value);
      }
    }
    if (node.tagName === 'link' && attributes.rel?.value === 'canonical') attributes.href.value = canonical;
    if (attributes.property?.value === 'og:url') attributes.content.value = canonical;
    if (attributes.property?.value === 'og:locale') attributes.content.value = chinese ? 'zh_CN' : 'en_US';
    if (marketing && !chinese && rootRoute.startsWith('/packs/') && rootRoute !== '/packs/' &&
        ['description', 'og:description', 'twitter:description'].includes((attributes.name ?? attributes.property)?.value)) {
      const title = head.childNodes.find(child => child.tagName === 'title').childNodes[0].value.split(' · ')[0];
      attributes.content.value = `${title}. Review the version, license, contents, and permissions before installing.`;
    }
    if (Object.hasOwn(attributes, 'data-language-switch')) {
      attributes.href.value = `${target.base}${alternate}`;
      attributes.lang.value = attributes.hreflang.value = chinese ? 'en' : 'zh-CN';
      attributes['aria-label'].value = chinese ? 'Switch to English' : '切换到中文';
      node.childNodes.find(child => child.nodeName === '#text').value = chinese ? 'English' : '中文';
    } else if (chinese && node.tagName === 'a' && attributes.href) {
      const link = new URL(attributes.href.value, canonical);
      const pathname = link.pathname.slice(target.base.length);
      if (link.origin === target.site && link.pathname.startsWith(`${target.base}/`) && routes.has(`/zh${pathname}`)) {
        attributes.href.value = `${target.base}/zh${pathname}${link.search}${link.hash}`;
      }
    }
  });

  const extra = parseFragment([
    routes.has(alternate) && !head.childNodes.some(node => node.attrs?.some(attr => attr.name === 'hreflang'))
      ? `<link rel="alternate" hreflang="en" href="${absoluteUrl(rootRoute)}"><link rel="alternate" hreflang="zh-CN" href="${absoluteUrl(`/zh${rootRoute}`)}"><link rel="alternate" hreflang="x-default" href="${absoluteUrl(rootRoute)}">`
      : '',
    `<script defer src="${target.base}/language.js?v=${languageScriptVersion}"></script>`,
  ].join(''));
  head.childNodes.push(...extra.childNodes);
  const destination = path.join(dist, output);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, serialize(document));
}

function visit(node, callback) {
  callback(node);
  for (const child of node.childNodes ?? []) visit(child, callback);
}

function translate(value) {
  const phrase = value.trim();
  const mapped = overrides[phrase] ?? translations[phrase];
  if (typeof mapped === 'string') return value.replace(phrase, () => mapped.replace(/\bgewu\b/gi, 'Garwoo'));
  const suffix = ' · 格物 Garwoo';
  if (phrase.endsWith(suffix)) {
    return `${translate(phrase.slice(0, -suffix.length))} · Garwoo`;
  }
  return value;
}
