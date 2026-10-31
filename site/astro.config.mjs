// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { satteri } from '@astrojs/markdown-satteri';
import { siteTarget } from './site-target.mjs';
import remarkSiteLinks from './scripts/remark-site-links.mjs';

const target = siteTarget(process.env);
const SITE = target.site;
const BASE = target.base;

export default defineConfig({
  site: SITE,
  base: BASE || '/',
  outDir: target.outDir,
  cacheDir: './.cache/astro',
  markdown: { processor: satteri({ mdastPlugins: [remarkSiteLinks({ base: BASE })] }) },
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: '格物 Garwoo',
      description: '格物 Garwoo 的使用指南与常见问题。',
      favicon: '/favicon.svg',
      defaultLocale: 'root',
      locales: { root: { label: '简体中文', lang: 'zh-CN' } },
      customCss: ['./src/styles/docs.css'],
      head: [{ tag: 'link', attrs: { rel: 'stylesheet', href: `${BASE}/fonts/fonts.css` } }],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/tlx2024/garwoo-site' }],
      disable404Route: true,
      lastUpdated: false,
      sidebar: [
        { label: '开始', items: [{ label: '文档首页', slug: 'docs' }] },
        { label: '官网', items: [{ label: '返回首页', link: '/' }] },
      ],
    }),
  ],
  vite: { cacheDir: './.vite', resolve: { preserveSymlinks: true } },
});
