import { sanitize } from '@/lib/sanitize';

interface RichTextRendererProps {
  html: string;
  className?: string;
  /** 'dark' untuk latar gelap (homepage/produk dark), 'light' untuk latar terang */
  theme?: 'dark' | 'light';
}

/**
 * Render konten HTML yang disimpan oleh RichTextEditor secara aman.
 * Semua HTML disanitasi via sanitize-html sebelum diinjeksi.
 */
export function RichTextRenderer({ html, className = '', theme = 'light' }: RichTextRendererProps) {
  if (!html || html.trim() === '<p></p>') return null;

  const clean = sanitize(html);

  const base = theme === 'dark'
    ? `
        prose-invert
        prose-headings:text-white prose-headings:font-extrabold
        prose-p:text-slate-300 prose-p:leading-relaxed
        prose-strong:text-white prose-em:text-slate-300
        prose-a:text-emerald-400 prose-a:underline prose-a:underline-offset-2
        prose-ul:text-slate-300 prose-ol:text-slate-300 prose-li:marker:text-emerald-500
        prose-blockquote:border-l-emerald-500 prose-blockquote:text-slate-400
        prose-code:text-emerald-300 prose-code:bg-slate-800 prose-code:rounded prose-code:px-1
        prose-pre:bg-slate-800/80 prose-pre:rounded-xl
        prose-hr:border-slate-700
        prose-img:rounded-xl prose-img:max-w-full
        prose-table:border-collapse prose-th:border prose-th:border-slate-700 prose-th:bg-slate-800/60 prose-th:p-2.5 prose-td:border prose-td:border-slate-700 prose-td:p-2.5
      `
    : `
        prose-headings:text-slate-900 prose-headings:font-extrabold
        prose-p:text-slate-700 prose-p:leading-relaxed
        prose-strong:text-slate-900 prose-em:text-slate-700
        prose-a:text-emerald-600 prose-a:underline prose-a:underline-offset-2
        prose-ul:text-slate-700 prose-ol:text-slate-700 prose-li:marker:text-emerald-500
        prose-blockquote:border-l-emerald-500 prose-blockquote:text-slate-500
        prose-code:text-emerald-700 prose-code:bg-emerald-50 prose-code:rounded prose-code:px-1
        prose-pre:bg-slate-100 prose-pre:rounded-xl
        prose-hr:border-slate-200
        prose-img:rounded-xl prose-img:max-w-full
        prose-table:border-collapse prose-th:border prose-th:border-slate-200 prose-th:bg-slate-50 prose-th:p-2.5 prose-td:border prose-td:border-slate-200 prose-td:p-2.5
      `;

  return (
    <div
      className={`prose prose-sm max-w-none ${base} ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

/**
 * Versi minimal tanpa prose styling — untuk hero/CMS blocks yang punya styling sendiri.
 * Tetap sanitasi HTML.
 */
export function RichTextRendererRaw({ html, className = '' }: { html: string; className?: string }) {
  if (!html || html.trim() === '<p></p>') return null;
  const clean = sanitize(html);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
