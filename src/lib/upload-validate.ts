/**
 * src/lib/upload-validate.ts
 * Sesi #19 (Fix #8): Helper validasi upload terpusat — menghilangkan duplikasi logika
 * antara /api/upload (publik) dan /api/admin/upload (admin).
 *
 * Sebelumnya: detectFileTypeFromMagicBytes() diduplikasi identik 100% di dua file route.
 * Sekarang: satu sumber kebenaran — perubahan logic hanya perlu dilakukan di sini.
 */

// Tipe berkas yang diizinkan — SVG dilarang untuk mencegah stored XSS
export const UPLOAD_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export type AllowedMimeType = (typeof UPLOAD_ALLOWED_TYPES)[number];

/**
 * Deteksi tipe berkas fisik sesungguhnya dari magic bytes header buffer.
 * Jangan percaya Content-Type yang dideklarasikan klien — selalu verifikasi fisik.
 *
 * @param buffer - Buffer biner berkas yang diupload
 * @returns MIME type yang terdeteksi, atau null jika tidak dikenali / tidak valid
 */
export function detectFileTypeFromMagicBytes(buffer: Buffer): AllowedMimeType | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // PDF: %PDF- (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  return null;
}
