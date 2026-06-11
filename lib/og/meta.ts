import { OgMetaInput, OgMetaTag } from './types';

export function buildOgMetaTags(input: OgMetaInput): OgMetaTag[] {
  const tags: OgMetaTag[] = [
    { tag: 'meta', property: 'og:url', content: input.url },
    { tag: 'meta', property: 'og:title', content: input.title },
    { tag: 'meta', property: 'og:description', content: input.description },
    { tag: 'meta', property: 'og:site_name', content: input.siteName },
    { tag: 'meta', property: 'og:type', content: 'website' },
  ];

  for (const image of input.images) {
    tags.push(
      { tag: 'meta', property: 'og:image', content: image.url },
      { tag: 'meta', property: 'og:image:secure_url', content: image.url },
      { tag: 'meta', property: 'og:image:width', content: String(image.width) },
      { tag: 'meta', property: 'og:image:height', content: String(image.height) },
      { tag: 'meta', property: 'og:image:alt', content: image.alt },
    );
  }

  tags.push(
    { tag: 'meta', name: 'twitter:card', content: 'summary_large_image' },
    { tag: 'meta', name: 'twitter:title', content: input.title },
    { tag: 'meta', name: 'twitter:description', content: input.description },
    {
      tag: 'meta',
      name: 'twitter:image',
      content: input.twitterImage || input.images[0]?.url || '',
    },
  );

  if (input.themeColor) {
    tags.push({ tag: 'meta', name: 'theme-color', content: input.themeColor });
  }

  return tags;
}

export function renderOgMetaHtml(input: OgMetaInput): string {
  return buildOgMetaTags(input)
    .map((tag) => {
      const attribute = tag.property ? `property="${tag.property}"` : `name="${tag.name}"`;
      return `<meta ${attribute} content="${escapeHtmlAttribute(tag.content)}" />`;
    })
    .join('\n');
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}