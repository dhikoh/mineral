/**
 * src/lib/sanitize.ts
 * P2-11: Hapus 'data' dari allowedSchemes (XSS via data: URI)
 * P2-11: Tambah sanitizeText() untuk field teks polos (nama, perusahaan, alamat)
 */
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
    // P2-11: Hapus 'data' — mencegah stored XSS via data: URI
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    allowedStyles: {
      '*': {
        'text-align': [/^(left|right|center|justify)$/],
        'color': [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(.*\)$/, /^rgba\(.*\)$/],
        'font-weight': [/^\d+$/, /^(bold|normal|lighter|bolder)$/],
        'font-style': [/^(italic|normal|oblique)$/],
        'max-width': [/^\d+(%|px|em|rem)$/],
      },
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: 'noopener noreferrer',
          target: attribs.target || '_blank',
        },
      }),
    },
  });
}

/**
 * P2-11: Sanitasi teks polos — hapus semua HTML, normalisasi whitespace.
 * Gunakan untuk: nama, perusahaan, alamat, nama pengirim, dll.
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';
  // Strip semua HTML tags, decode entitas, normalisasi whitespace
  const stripped = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
  return stripped.replace(/\s+/g, ' ').trim().slice(0, 1000);
}

/**
 * Sanitasi number — pastikan nilai adalah angka valid (positif).
 * Gunakan untuk amount, price, qty yang datang dari user input.
 */
export function sanitizePositiveInt(input: unknown): number | null {
  const n = parseInt(String(input ?? ''), 10);
  return !isNaN(n) && n >= 0 ? n : null;
}
