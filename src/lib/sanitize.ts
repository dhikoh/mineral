import sanitizeHtml from 'sanitize-html';

export function sanitize(html: string): string {
  if (!html) return '';

  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'a', 'b', 'i', 'strong', 'em', 'strike', 'code', 'pre', 'hr', 'br', 'u',
      'ul', 'ol', 'li', 'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'span', 'div'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title', 'class'],
      img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'class'],
      span: ['class'],
      div: ['class'],
      table: ['class', 'border'],
      th: ['class', 'scope', 'colspan', 'rowspan'],
      td: ['class', 'colspan', 'rowspan'],
      p: ['class'],
      h1: ['class'],
      h2: ['class'],
      h3: ['class'],
      h4: ['class'],
      ul: ['class'],
      ol: ['class'],
      li: ['class'],
      blockquote: ['class'],
      code: ['class'],
      pre: ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: (tagName, attribs) => {
        return {
          tagName,
          attribs: {
            ...attribs,
            rel: 'noopener noreferrer',
            target: attribs.target || '_blank',
          },
        };
      },
    },
  });
}
