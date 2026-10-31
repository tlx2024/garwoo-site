// Pages 预览挂在 /garwoo-site/ 子路径下，所有站内链接与静态资源都要经这里拼接 base。
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** 站内路径（以 / 开头）→ 带 base 的地址；外链与锚点原样返回。 */
export function href(path: string): string {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

/** 当前页面是否属于某个导航项（用于高亮） */
export function isActive(current: string, target: string): boolean {
  const cur = current.replace(BASE, '') || '/';
  if (target === '/') return cur === '/';
  return cur.startsWith(target);
}
