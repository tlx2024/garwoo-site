(() => {
  const current = new URL(location.href);
  const requested = current.searchParams.get('lang');
  const links = Array.from(document.querySelectorAll('[data-language-switch]'));
  const language = document.documentElement.lang;

  // Older links used a query parameter. Keep other parameters and the fragment.
  if (links.length && (requested === 'en' || requested === 'zh')) {
    const requestedLanguage = requested === 'zh' ? 'zh-CN' : 'en';
    if (requestedLanguage !== language) current.pathname = new URL(links[0].href).pathname;
    current.searchParams.delete('lang');
    location.replace(current);
    return;
  }

  for (const link of links) {
    const update = () => {
      const destination = new URL(link.href);
      destination.search = location.search;
      destination.searchParams.delete('lang');
      // Marketing sections share IDs across translations. Document headings have localized IDs.
      destination.hash = document.body.hasAttribute('data-localize-site') ? location.hash : '';
      link.href = destination;
    };
    update();
    addEventListener('hashchange', update);
  }
})();
