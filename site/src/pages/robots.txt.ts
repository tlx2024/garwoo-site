import type { APIRoute } from 'astro';
import { siteTarget } from '../../site-target.mjs';

const target = siteTarget(process.env);

// Pages 预览站不让搜索引擎收录；生产构建放开并指向 sitemap。
export const GET: APIRoute = () => {
  const body =
    target.mode === 'pages'
      ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nAllow: /\n\nSitemap: ${target.site}/sitemap-index.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
