/**
 * src/lib/env.ts
 * P2-14: Validasi environment variables saat startup (fail-fast)
 * Mencegah aplikasi berjalan dengan konfigurasi tidak lengkap
 */

interface EnvVar {
  key: string;
  required: boolean;
  minLength?: number;
  description: string;
}

const ENV_VARS: EnvVar[] = [
  {
    key: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
  },
  {
    key: 'AUTH_SECRET',
    required: true,
    minLength: 32,
    description: 'JWT signing secret (min 32 chars)',
  },
  {
    key: 'NEXT_PUBLIC_APP_URL',
    required: false,
    description: 'Public base URL of the application',
  },
  {
    key: 'STORAGE_PROVIDER',
    required: false,
    description: 'Storage provider: local | s3 | cloudinary',
  },
  {
    key: 'TRUSTED_PROXY_COUNT',
    required: false,
    description: 'Number of trusted reverse proxies in front of the app (default: 0)',
  },
  {
    key: 'ALLOW_LOCAL_FALLBACK',
    required: false,
    description: 'Allow local JSON fallback when DB is down (development only)',
  },
  {
    key: 'APP_BRAND_SLUG',
    required: false,
    description: 'Brand slug for cookie names and export filenames',
  },
  {
    key: 'APP_COOKIE_PREFIX',
    required: false,
    description: 'Cookie prefix for multi-tenant isolation',
  },
  {
    key: 'APP_BASE_URL',
    required: false,
    description: 'Alternate base URL env (use NEXT_PUBLIC_APP_URL instead)',
  },
];

/**
 * Validasi semua environment variables yang dibutuhkan.
 * Throw Error jika ada yang required dan kosong, atau terlalu pendek.
 * Panggil di awal modul server-side (misalnya di lib/db.ts atau layout server).
 */
export function validateEnv(): void {
  // Melewatkan pemeriksaan koneksi database saat fase static compilation build jika DB eksternal belum tersambung
  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.npm_lifecycle_event === 'build';

  const errors: string[] = [];

  for (const envVar of ENV_VARS) {
    if (isBuildPhase && envVar.key === 'DATABASE_URL') {
      continue;
    }

    const value = process.env[envVar.key];

    if (envVar.required && (!value || value.trim() === '')) {
      errors.push(`[ENV MISSING] ${envVar.key}: ${envVar.description}`);
      continue;
    }

    if (value && envVar.minLength && value.trim().length < envVar.minLength) {
      errors.push(
        `[ENV TOO SHORT] ${envVar.key}: harus minimal ${envVar.minLength} karakter (sekarang ${value.trim().length})`
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `\n[STARTUP VALIDATION FAILED]\n${errors.join('\n')}\n\nSalin .env.example ke .env dan isi semua variabel yang diperlukan.`
    );
  }
}

/**
 * Dapatkan nilai env yang sudah tervalidasi — throw jika tidak ada dan required.
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value && value.trim() !== '') return value.trim();
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`[ENV REQUIRED] Environment variable "${key}" tidak ditemukan.`);
}

/** Apakah environment adalah production? */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** 
 * Apakah fallback lokal diizinkan?
 * Di produksi (NODE_ENV=production), SELALU mengembalikan false tanpa syarat.
 * Fallback lokal hanya diizinkan untuk mode development/test.
 */
export function isLocalFallbackAllowed(): boolean {
  if (isProduction()) return false;
  return process.env.ALLOW_LOCAL_FALLBACK === 'true';
}

/** Jumlah proxy terpercaya di depan aplikasi */
export function getTrustedProxyCount(): number {
  const raw = process.env.TRUSTED_PROXY_COUNT;
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return isNaN(n) || n < 0 ? 0 : n;
}
