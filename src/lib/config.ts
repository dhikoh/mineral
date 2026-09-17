/**
 * src/lib/config.ts
 * P2-03b: Konfigurasi terpusat — menghilangkan 13 literal 'https://adably.id' di kodebase
 * P2-10: Bagian dari arsitektur config-driven reusable template
 */

/**
 * Base URL aplikasi — ambil dari env, fallback ke localhost untuk development.
 * Di production: WAJIB set NEXT_PUBLIC_APP_URL di .env
 */
export function getBaseUrl(): string {
  // Server-side: gunakan NEXT_PUBLIC_APP_URL atau APP_BASE_URL
  if (typeof window === 'undefined') {
    return (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_BASE_URL ||
      'http://localhost:3000'
    );
  }
  // Client-side: gunakan origin browser
  return window.location.origin;
}

/**
 * Brand slug untuk nama file ekspor, storage keys, dll.
 * Default: 'adably' — ganti via APP_BRAND_SLUG di .env untuk re-deploy
 */
export function getBrandSlug(): string {
  return process.env.APP_BRAND_SLUG || 'adably';
}

/**
 * Prefix cookie untuk isolasi antar-instance jika deploy multi-tenant
 */
export function getCookiePrefix(): string {
  return process.env.APP_COOKIE_PREFIX || getBrandSlug();
}

/**
 * Nama cookie session admin — digunakan di auth.ts dan proxy.ts
 * Satu sumber kebenaran untuk menghilangkan duplikasi literal 'adably_admin_token'
 */
export function getAdminCookieName(): string {
  return `${getCookiePrefix()}_admin_token`;
}

/**
 * Storage key keranjang belanja localStorage
 */
export function getCartStorageKey(): string {
  return `${getCookiePrefix()}_cart_items`;
}

/**
 * URL storage publik untuk whitelist upload dan Next.js Image
 */
export function getStoragePublicUrl(): string | null {
  return process.env.S3_PUBLIC_URL || process.env.CLOUDINARY_CLOUD_NAME
    ? process.env.S3_PUBLIC_URL || null
    : null;
}

/**
 * Daftar hostname yang diizinkan untuk Next.js Image Optimizer
 */
export function getAllowedImageHostnames(): string[] {
  const hosts: string[] = [];

  if (process.env.S3_PUBLIC_URL) {
    try {
      hosts.push(new URL(process.env.S3_PUBLIC_URL).hostname);
    } catch { /* abaikan URL tidak valid */ }
  }

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    hosts.push('res.cloudinary.com');
  }

  // Host aplikasi sendiri (untuk gambar yang diupload secara lokal)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      hosts.push(new URL(process.env.NEXT_PUBLIC_APP_URL).hostname);
    } catch { /* abaikan */ }
  }

  // Fallback untuk dev: izinkan localhost dan Unsplash (seed data)
  if (process.env.NODE_ENV === 'development') {
    hosts.push('localhost', 'images.unsplash.com');
  }

  return [...new Set(hosts)]; // deduplicate
}
