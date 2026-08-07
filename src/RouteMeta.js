import { useLayoutEffect } from 'react';

const SITE_NAME = 'Surachet Panto';

export default function RouteMeta({ title, description }) {
  const resolvedTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Software Engineer`;

  useLayoutEffect(() => {
    const metadata = [
      ['meta[name="description"]', 'name', 'description', description],
      ['meta[property="og:title"]', 'property', 'og:title', resolvedTitle],
      ['meta[property="og:description"]', 'property', 'og:description', description],
      ['meta[name="twitter:title"]', 'name', 'twitter:title', resolvedTitle],
      ['meta[name="twitter:description"]', 'name', 'twitter:description', description],
    ];

    metadata.forEach(([selector, attribute, key, content]) => {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    });
  }, [description, resolvedTitle]);

  return (
    <title>{resolvedTitle}</title>
  );
}
