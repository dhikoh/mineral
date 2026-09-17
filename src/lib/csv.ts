/**
 * src/lib/csv.ts
 * P1-04: Helper CSV terpusat — mencegah formula injection + konsistensi BOM/CRLF
 * P2-03c: Menggantikan dua implementasi berbeda di pelanggan/export dan pesanan/export
 */

/**
 * Escape satu nilai CSV agar aman dari:
 * 1. Formula injection (=, +, -, @, \t, \r di awal nilai)
 * 2. Karakter khusus CSV (tanda kutip, koma, newline)
 */
export function escapeCsvField(value: unknown): string {
  const str = value == null ? '' : String(value);

  // Deteksi karakter formula injection di awal string
  const FORMULA_CHARS = new Set(['=', '+', '-', '@', '\t', '\r']);
  if (str.length > 0 && FORMULA_CHARS.has(str[0])) {
    // Prefix apostrof mencegah Excel menginterpretasi sebagai formula
    // Bungkus dengan kutip, escape kutip internal
    return `"'${str.replace(/"/g, '""')}"`;
  }

  // Escape kutip ganda dan bungkus jika mengandung karakter khusus
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  // Field aman — bungkus selalu untuk konsistensi
  return `"${str}"`;
}

/**
 * Bangun string CSV lengkap dari headers dan rows.
 * - Selalu tambahkan BOM (U+FEFF) agar Excel membaca UTF-8 dengan benar
 * - Gunakan CRLF (\r\n) sebagai pemisah baris (standar RFC 4180)
 */
export function buildCsv(
  headers: string[],
  rows: unknown[][]
): string {
  const BOM = '\uFEFF';
  const CRLF = '\r\n';

  const headerLine = headers.map(escapeCsvField).join(',');
  const dataLines = rows.map(row => row.map(escapeCsvField).join(','));

  return BOM + [headerLine, ...dataLines].join(CRLF) + CRLF;
}
