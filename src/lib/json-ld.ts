/**
 * src/lib/json-ld.ts
 * P1-N: Serialisasi aman untuk tag <script type="application/ld+json">
 * Mengamankan string dari XSS script breakout dengan meng-escape '<' dan '>'
 * menjadi unicode escape sequences yang valid untuk JSON parser.
 */

export function safeJsonLd(data: unknown): string {
  const json = JSON.stringify(data);
  if (!json) return '{}';
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
