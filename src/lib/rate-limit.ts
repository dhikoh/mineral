/**
 * Centralized In-Memory Rate Limiter Module
 * Mendukung pembatasan frekuensi request per-IP dengan pembersihan otomatis (TTL cleanup)
 * untuk mencegah memory leak.
 *
 * Catatan Arsitektur Skalabilitas:
 * Implementasi in-memory Map ini dirancang untuk deployment single-instance (seperti VPS/Coolify dengan Docker).
 * Untuk deployment multi-instance serverless (Vercel/AWS Lambda berskala horizontal), modul ini
 * dapat diekstensikan dengan adapter Redis/Upstash KV menggunakan interface RateLimitResult yang sama.
 */

interface RateLimitRecord {
  count: number;
  firstAttemptTime: number;
}

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  remainingMinutes: number;
  resetTime: number;
}

// Map penyimpanan rate limit berdasarkan namespace + IP/key
const store = new Map<string, RateLimitRecord>();

// Bersihkan record yang sudah kedaluwarsa secara berkala (setiap 5 menit)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function performCleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  for (const [key, record] of store.entries()) {
    // Jika record lebih tua dari 1 jam, hapus dari memory
    if (now - record.firstAttemptTime > 60 * 60 * 1000) {
      store.delete(key);
    }
  }
}

/**
 * Ekstraksi alamat IP klien dari Request / NextRequest
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

/**
 * Fungsi inti pemeriksaan rate limit
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  performCleanup();

  const now = Date.now();
  const { windowMs, maxRequests } = options;
  const record = store.get(key);

  if (!record) {
    store.set(key, { count: 1, firstAttemptTime: now });
    return {
      allowed: true,
      remainingRequests: maxRequests - 1,
      remainingMinutes: Math.ceil(windowMs / 60000),
      resetTime: now + windowMs,
    };
  }

  // Jika window waktu sudah berlalu, reset window baru
  if (now - record.firstAttemptTime > windowMs) {
    store.set(key, { count: 1, firstAttemptTime: now });
    return {
      allowed: true,
      remainingRequests: maxRequests - 1,
      remainingMinutes: Math.ceil(windowMs / 60000),
      resetTime: now + windowMs,
    };
  }

  // Jika masih dalam window waktu dan kuota habis
  if (record.count >= maxRequests) {
    const remainingMs = windowMs - (now - record.firstAttemptTime);
    return {
      allowed: false,
      remainingRequests: 0,
      remainingMinutes: Math.max(1, Math.ceil(remainingMs / 60000)),
      resetTime: record.firstAttemptTime + windowMs,
    };
  }

  // Masih dalam batas, naikkan hitungan
  record.count += 1;
  const remainingMs = windowMs - (now - record.firstAttemptTime);
  return {
    allowed: true,
    remainingRequests: maxRequests - record.count,
    remainingMinutes: Math.max(1, Math.ceil(remainingMs / 60000)),
    resetTime: record.firstAttemptTime + windowMs,
  };
}

// Preset Rate Limiting untuk Endpoint Spesifik
export const RATE_LIMIT_PRESETS = {
  // Lacak Pesanan: 30 request / 1 menit per IP
  TRACKING: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  // Detail Pesanan Publik: 30 request / 1 menit per IP
  ORDER_DETAIL: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  // Checkout Pesanan: 10 request / 5 menit per IP
  CHECKOUT: {
    windowMs: 5 * 60 * 1000,
    maxRequests: 10,
  },
  // Submit RFQ Leads: 10 request / 5 menit per IP
  LEADS: {
    windowMs: 5 * 60 * 1000,
    maxRequests: 10,
  },
  // Upload Berkas Publik: 10 request / 5 menit per IP
  UPLOAD: {
    windowMs: 5 * 60 * 1000,
    maxRequests: 10,
  },
  // Sesi #17 (Temuan R): Login Admin — 5 percobaan / 15 menit per IP+email
  // Menggantikan implementasi lokal duplikat di api/admin/auth/login/route.ts
  LOGIN: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  },
  // Sesi #21: Penawaran Jual — 3 submit / 1 jam per IP (anti-spam form publik)
  SELL_OFFER: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
  },
};

/**
 * Helper spesifik per endpoint
 */
export function checkTrackingRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`tracking:${ip}`, RATE_LIMIT_PRESETS.TRACKING);
}

export function checkOrderDetailRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`order_detail:${ip}`, RATE_LIMIT_PRESETS.ORDER_DETAIL);
}

export function checkCheckoutRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`checkout:${ip}`, RATE_LIMIT_PRESETS.CHECKOUT);
}

export function checkLeadsRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`leads:${ip}`, RATE_LIMIT_PRESETS.LEADS);
}

export function checkUploadRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`upload:${ip}`, RATE_LIMIT_PRESETS.UPLOAD);
}

/**
 * Sesi #17 (Temuan R): Login rate limit — menggantikan implementasi lokal duplikat.
 * key harus mencakup IP + email agar granularitas tidak berubah dari implementasi lama.
 * Contoh key: `login:127.0.0.1:admin@adably.id`
 */
export function checkLoginRateLimit(key: string): RateLimitResult {
  return checkRateLimit(`login:${key}`, RATE_LIMIT_PRESETS.LOGIN);
}

/**
 * Reset counter login untuk key tertentu setelah login berhasil.
 */
export function clearLoginAttempts(key: string): void {
  store.delete(`login:${key}`);
}

/**
 * Sesi #21: Rate limit untuk form penawaran jual publik — 3 submit / jam per IP.
 */
export function checkSellOfferRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`sell_offer:${ip}`, RATE_LIMIT_PRESETS.SELL_OFFER);
}
