/**
 * src/lib/rate-limit.ts
 * P0-05: Fix IP spoofing via X-Forwarded-For palsu (TRUSTED_PROXY_COUNT)
 * P1-09: Fix counter naik 2× saat login gagal (pisah peek vs consume vs clear)
 */

import { getTrustedProxyCount } from './env';

interface RateLimitRecord {
  count: number;
  firstAttemptTime: number;
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  remainingMinutes: number;
  resetTime: number;
}

// Map penyimpanan rate limit berdasarkan namespace + key
const store = new Map<string, RateLimitRecord>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function performCleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, record] of store.entries()) {
    if (now - record.firstAttemptTime > 60 * 60 * 1000) store.delete(key);
  }
}

/**
 * P0-05: Ekstraksi IP klien yang aman dari header proxy.
 * Jika TRUSTED_PROXY_COUNT = N, ambil IP ke-N dari kanan rantai XFF.
 * Jika N = 0, abaikan XFF sepenuhnya — hanya gunakan header socket/real-ip.
 */
export function getClientIp(req: Request): string {
  const trustedProxyCount = getTrustedProxyCount();

  // Jika tidak ada proxy terpercaya, abaikan XFF (tidak bisa dipercaya)
  if (trustedProxyCount === 0) {
    const realIp = req.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
    return '127.0.0.1';
  }

  // Ambil IP ke-N dari kanan rantai XFF (N = jumlah proxy terpercaya)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim()).filter(Boolean);
    // IP ke-N dari kanan: index = length - N
    const idx = Math.max(0, ips.length - trustedProxyCount);
    if (ips[idx]) return ips[idx];
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

/**
 * Baca status rate limit TANPA menaikkan counter.
 * Gunakan di awal handler untuk memutuskan apakah langsung 429.
 */
export function peekRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  performCleanup();
  const now = Date.now();
  const { windowMs, maxRequests } = options;
  const record = store.get(key);

  if (!record || now - record.firstAttemptTime > windowMs) {
    return { allowed: true, remainingRequests: maxRequests, remainingMinutes: Math.ceil(windowMs / 60000), resetTime: now + windowMs };
  }
  if (record.count >= maxRequests) {
    const remainingMs = windowMs - (now - record.firstAttemptTime);
    return { allowed: false, remainingRequests: 0, remainingMinutes: Math.ceil(remainingMs / 60000), resetTime: record.firstAttemptTime + windowMs };
  }
  return { allowed: true, remainingRequests: maxRequests - record.count, remainingMinutes: Math.ceil((windowMs - (now - record.firstAttemptTime)) / 60000), resetTime: record.firstAttemptTime + windowMs };
}

/**
 * Naikkan counter rate limit. Panggil HANYA saat terjadi kegagalan/event yang dihitung.
 * P1-09: Dipisah dari peek agar login tidak menaikkan counter 2×.
 */
export function consumeRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  performCleanup();
  const now = Date.now();
  const { windowMs, maxRequests } = options;
  const record = store.get(key);

  if (!record || now - record.firstAttemptTime > windowMs) {
    store.set(key, { count: 1, firstAttemptTime: now });
    return { allowed: true, remainingRequests: maxRequests - 1, remainingMinutes: Math.ceil(windowMs / 60000), resetTime: now + windowMs };
  }

  record.count += 1;
  if (record.count > maxRequests) {
    const remainingMs = windowMs - (now - record.firstAttemptTime);
    return { allowed: false, remainingRequests: 0, remainingMinutes: Math.ceil(remainingMs / 60000), resetTime: record.firstAttemptTime + windowMs };
  }
  return { allowed: record.count <= maxRequests, remainingRequests: Math.max(0, maxRequests - record.count), remainingMinutes: Math.ceil((windowMs - (now - record.firstAttemptTime)) / 60000), resetTime: record.firstAttemptTime + windowMs };
}

/**
 * Hapus record rate limit — panggil setelah login berhasil untuk reset counter.
 */
export function clearRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Fungsi kompatibilitas mundur — peek + consume sekaligus (perilaku lama).
 * Masih dipakai di endpoint non-login yang tidak butuh pemisahan.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const peek = peekRateLimit(key, options);
  if (!peek.allowed) return peek;
  return consumeRateLimit(key, options);
}

// ─── Preset Rate Limit ────────────────────────────────────────────────────────

export const RATE_LIMIT_PRESETS = {
  LOGIN:          { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  LOGIN_EMAIL:    { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // per-email lintas IP
  CHECKOUT:       { windowMs: 60 * 1000,       maxRequests: 10 },
  RFQ:            { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  SELL_OFFER:     { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  UPLOAD:         { windowMs: 60 * 1000,       maxRequests: 20 },
  PROOF_SUBMIT:   { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  ORDER_DETAIL:   { windowMs: 60 * 1000,       maxRequests: 30 },
  VALIDATE_CART:  { windowMs: 60 * 1000,       maxRequests: 60 },
  PUBLIC_SETTINGS:{ windowMs: 60 * 1000,       maxRequests: 30 },
} as const;

// ─── Helper fungsi per-preset ─────────────────────────────────────────────────

export function checkLoginRateLimit(key: string) {
  return peekRateLimit(key, RATE_LIMIT_PRESETS.LOGIN);
}
export function consumeLoginRateLimit(key: string) {
  return consumeRateLimit(key, RATE_LIMIT_PRESETS.LOGIN);
}
export function checkLoginEmailRateLimit(key: string) {
  return checkRateLimit(key, RATE_LIMIT_PRESETS.LOGIN_EMAIL);
}
export function checkCheckoutRateLimit(key: string) {
  return checkRateLimit(key, RATE_LIMIT_PRESETS.CHECKOUT);
}
export function checkRfqRateLimit(key: string) {
  return checkRateLimit(key, RATE_LIMIT_PRESETS.RFQ);
}
export function checkSellOfferRateLimit(key: string) {
  return checkRateLimit(key, RATE_LIMIT_PRESETS.SELL_OFFER);
}
export function checkUploadRateLimit(key: string) {
  return checkRateLimit(key, RATE_LIMIT_PRESETS.UPLOAD);
}
export function checkProofSubmitRateLimit(key: string) {
  return checkRateLimit(key, RATE_LIMIT_PRESETS.PROOF_SUBMIT);
}
export function checkOrderDetailRateLimit(key: string) {
  return checkRateLimit(key, RATE_LIMIT_PRESETS.ORDER_DETAIL);
}
export function checkValidateCartRateLimit(key: string) {
  return checkRateLimit(key, RATE_LIMIT_PRESETS.VALIDATE_CART);
}
export function checkPublicSettingsRateLimit(key: string) {
  return checkRateLimit(key, RATE_LIMIT_PRESETS.PUBLIC_SETTINGS);
}
