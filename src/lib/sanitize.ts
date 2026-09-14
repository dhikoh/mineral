import sanitizeHtml from 'sanitize-html';

export function sanitize(html: string): string {
  if (!html) return '';

  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'a', 'b', 'i', 'strong', 'em', 'strike', 's', 'code', 'pre', 'hr', 'br', 'u',
      'ul', 'ol', 'li', 'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'span', 'div',
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title', 'class'],
      img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'class', 'style'],
      span: ['class', 'style'],
      div: ['class', 'style'],
      table: ['class', 'border'],
      th: ['class', 'scope', 'colspan', 'rowspan'],
      td: ['class', 'colspan', 'rowspan'],
      p: ['class', 'style'],
      h1: ['class', 'style'],
      h2: ['class', 'style'],
      h3: ['class', 'style'],
      h4: ['class', 'style'],
      ul: ['class', 'style'],
      ol: ['class', 'style'],
      li: ['class', 'style'],
      blockquote: ['class', 'style'],
      code: ['class'],
      pre: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
    allowedStyles: {
      '*': {
        // Allow text-align (from Tiptap TextAlign extension)
        'text-align': [/^(left|right|center|justify)$/],
        // Allow color (from Tiptap Color extension)
        'color': [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(.*\)$/, /^rgba\(.*\)$/],
        // Allow font properties
        'font-weight': [/^\d+$/, /^(bold|normal|lighter|bolder)$/],
        'font-style': [/^(italic|normal|oblique)$/],
        // Allow max-width for images
        'max-width': [/^\d+(%|px|em|rem)$/],
      },
    },
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
