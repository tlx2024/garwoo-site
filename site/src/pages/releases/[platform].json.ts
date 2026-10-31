// /releases/windows.json、/releases/android.json：公开清单的静态副本，手机端的更新检查读它。
// 只发布 public:true 的清单；没有公开清单的平台不生成文件。
import type { APIRoute, GetStaticPaths } from 'astro';
import { PLATFORMS, loadManifest } from '../../lib/releases';

export const getStaticPaths = (async () => {
  const paths = [];
  for (const platform of PLATFORMS) {
    const manifest = await loadManifest(platform);
    if (manifest?.public) paths.push({ params: { platform }, props: { manifest } });
  }
  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify(props.manifest, null, 2) + '\n', { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
