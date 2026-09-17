/**
 * src/lib/upload-url.ts
 * P2-06 + P2-03e: Validasi URL upload terpusat
 * Mencegah SSRF, bypass validasi, dan URL eksternal sembarang sebagai gambar produk
 */

/** IP range privat/loopback yang harus ditolak (SSRF prevention) */
const PRIVATE_IP_PATTERNS = [
  /^127\./,           // loopback
  /^10\./,            // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./,  // RFC 1918
  /^192\.168\./,      // RFC 1918
  /^169\.254\./,      // link-local
  /^::1$/,            // IPv6 loopback
  /^fc00:/,           // IPv6 ULA
  /^fd/,              // IPv6 ULA
  /^localhost$/i,
  /^metadata\.google\.internal$/i,
];

/**
 * Bangun daftar hostname yang diizinkan dari environment variables.
 */
function getAllowedUploadHosts(): Set<string> {
  const hosts = new Set<string>();

  if (process.env.S3_PUBLIC_URL) {
    try {
      hosts.add(new URL(process.env.S3_PUBLIC_URL).hostname);
    } catch { /* skip invalid URL */ }
  }

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    hosts.add('res.cloudinary.com');
    hosts.add('api.cloudinary.com');
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      hosts.add(new URL(process.env.NEXT_PUBLIC_APP_URL).hostname);
    } catch { /* skip */ }
  }

  // Dev: izinkan localhost
  if (process.env.NODE_ENV === 'development') {
    hosts.add('localhost');
    hosts.add('127.0.0.1');
  }

  return hosts;
}

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validasi URL eksternal untuk mode "tempel URL" pada endpoint upload.
 * Menolak: http://, IP privat, host tidak terdaftar.
 */
export function validateUploadUrl(rawUrl: string): UrlValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, error: 'URL tidak valid.' };
  }

  // Hanya izinkan HTTPS
  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Hanya URL HTTPS yang diizinkan.' };
  }

  const hostname = parsed.hostname;

  // Tolak IP privat / loopback (SSRF prevention)
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'URL mengarah ke alamat jaringan yang tidak diizinkan.' };
    }
  }

  // Cek whitelist host
  const allowedHosts = getAllowedUploadHosts();
  if (allowedHosts.size > 0 && !allowedHosts.has(hostname)) {
    return {
      valid: false,
      error: `Host "${hostname}" tidak terdaftar sebagai penyimpanan resmi.`,
    };
  }

  return { valid: true };
}

/**
 * Validasi path upload lokal — harus diawali /uploads/ dan hanya karakter aman.
 */
export function validateLocalUploadPath(filePath: string): UrlValidationResult {
  const SAFE_PATH_PATTERN = /^\/uploads\/[A-Za-z0-9._\-/]+$/;
  if (!SAFE_PATH_PATTERN.test(filePath)) {
    return { valid: false, error: 'Path upload tidak valid.' };
  }
  return { valid: true };
}
