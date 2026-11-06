// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { satteri } from '@astrojs/markdown-satteri';
import { siteTarget } from './site-target.mjs';
import remarkSiteLinks from './scripts/remark-site-links.mjs';

const target = siteTarget(process.env);
const SITE = target.site;
const BASE = target.base;
/** @param {string} base */
function devFaviconPlugin(base) {
  if (!base) return [];
  const prefix = base.replace(/\/+$/, '');
  return [
    {
      name: 'dev-favicon-fallback',
      /** @param {any} server */
      configureServer(server) {
        return () => {
          server.middlewares.stack.unshift({
            route: '',
            /**
             * @param {any} req
             * @param {any} res
             * @param {any} next
             */
            handle(req, res, next) {
              const raw = req.originalUrl || req.url || '';
              const url = raw.split('?')[0];
              if (url.startsWith('/favicon') || url === '/apple-touch-icon.png' || url === '/site.webmanifest') {
                res.writeHead(302, { Location: prefix + url });
                return res.end();
              }
              if (url === '/' || url === '') {
                res.writeHead(302, { Location: prefix + '/' });
                return res.end();
              }
              next();
            },
          });
        };
      },
    },
  ];
}


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
      logo: {
        light: './src/assets/logo-light.png',
        dark: './src/assets/logo-dark.png',
        alt: '格物 Garwoo',
        replacesTitle: true,
      },
      favicon: '/favicon-32.png',
      defaultLocale: 'root',
      locales: { root: { label: '简体中文', lang: 'zh-CN' } },
      customCss: ['./src/styles/docs.css'],
      head: [
        { tag: 'link', attrs: { rel: 'stylesheet', href: `${BASE}/fonts/fonts.css` } },
        { tag: 'meta', attrs: { property: 'og:image', content: `${SITE}${BASE}/og/og-default.png` } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: `${SITE}${BASE}/og/og-default.png` } },
        ...(target.mode === 'pages' ? [{ tag: /** @type {'meta'} */ ('meta'), attrs: { name: 'robots', content: 'noindex, nofollow' } }] : []),
      ],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/tlx2024/garwoo-site' }],
      disable404Route: true,
      lastUpdated: false,
      sidebar: [
        {
          label: '文档',
          items: [{ label: '文档首页', link: '/docs/' }, 'docs/quickstart', 'docs/models', 'docs/trial', 'docs/faq'],
        },
        {
          label: '官网',
          items: [
            { label: '返回首页', link: '/' },
            { label: '工作方式', link: '/how/' },
            { label: '出网清单', link: '/egress/' },
            { label: '更新日志', link: '/changelog/' },
          ],
        },
      ],
    }),
  ],
  vite: { cacheDir: './.vite', resolve: { preserveSymlinks: true }, plugins: devFaviconPlugin(BASE) },
});
