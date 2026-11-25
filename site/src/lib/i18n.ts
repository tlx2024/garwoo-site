export type Locale = 'en' | 'zh';

export function getLocale(url: URL): Locale {
  return url.searchParams.get('lang') === 'zh' ? 'zh' : 'en';
}

export function languageHref(url: URL, locale: Locale): string {
  const params = new URLSearchParams(url.searchParams);
  params.set('lang', locale);
  return `${url.pathname}?${params.toString()}${url.hash}`;
}

export const chrome = {
  en: { products: 'Products', desktop: 'Desktop', mobile: 'Mobile companion', wechat: 'WeChat mini program', packs: 'Pack market', enterprise: 'Enterprise', pricing: 'Pricing', how: 'How it works', docs: 'Docs', account: 'Account', menu: 'Menu', download: 'Download', learnBeta: 'Learn about the beta', switchTo: '中文', slogan: 'One bark, and Garwoo gets to work.', product: 'Product', resources: 'Resources', legal: 'Legal', personal: 'Personal', credits: 'Credits', changelog: 'Changelog', about: 'About', brand: 'Brand', privacy: 'Privacy policy', terms: 'Terms of use', egress: 'Data & network access', contact: 'Deployment & consulting' },
  zh: { products: '产品', desktop: '桌面端', mobile: '手机伴侣', wechat: '微信小程序', packs: '本体市场', enterprise: '企业版', pricing: '价格', how: '工作方式', docs: '文档', account: '账号', menu: '菜单', download: '下载', learnBeta: '了解内测', switchTo: 'English', slogan: '嘎呜一声，格物开工。', product: '产品', resources: '资源', legal: '法律', personal: '个人', credits: '积分', changelog: '更新日志', about: '关于', brand: '品牌', privacy: '隐私政策', terms: '用户协议', egress: '资料与出网', contact: '部署与咨询' },
} as const;

export function t(locale: Locale) { return chrome[locale]; }

const titles: Record<string, string> = { '桌面端': 'Desktop', '手机伴侣': 'Mobile companion', '企业版': 'Enterprise', '价格': 'Pricing', '本体市场': 'Pack market', '工作方式': 'How it works', '文档': 'Docs', '下载': 'Download', '更新日志': 'Changelog', '关于': 'About', '品牌': 'Brand', '出网清单': 'Data & network access', '账号': 'Account', '隐私政策': 'Privacy policy', '用户协议': 'Terms of use' };
export function localizedTitle(title: string | undefined, locale: Locale): string | undefined { return !title || locale === 'zh' ? title : titles[title] ?? title; }
