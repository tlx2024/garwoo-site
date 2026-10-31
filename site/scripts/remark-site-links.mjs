/** Prefix root-relative links using Astro 7's native Markdown processor. */
/** @param {{base: string}} options */
export default function remarkSiteLinks({ base }) {
  /** @param {any} node @param {any} context */
  const prefix = (node, context) => {
    if (typeof node.url === 'string' && node.url.startsWith('/') && !node.url.startsWith('//')) {
      if (node.url.startsWith('/garwoo-site/')) throw new Error('Markdown must use root-relative source links');
      context.setProperty(node, 'url', `${base}${node.url}`);
    }
  };
  return { name: 'garwoo-site-links', link: prefix, image: prefix, definition: prefix };
}
