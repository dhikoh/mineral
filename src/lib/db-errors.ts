/**
 * src/lib/db-errors.ts
 * P2-01: Klasifikasi error database terpusat
 * Hanya UNREACHABLE yang boleh memicu fallback lokal.
 * CONSTRAINT dan NOT_FOUND wajib dilempar ulang sebagai error domain.
 */

export type DbErrorKind = 'UNREACHABLE' | 'CONSTRAINT' | 'NOT_FOUND' | 'UNKNOWN';

/** Kode error Prisma yang menandakan DB tidak dapat dijangkau */
const UNREACHABLE_CODES = new Set([
  'P1001', // Can't reach database server
  'P1002', // Database server timeout
  'P1008', // Operations timed out
  'P1017', // Server has closed the connection
]);

/** Kode error Prisma constraint violation */
const CONSTRAINT_CODES = new Set([
  'P2002', // Unique constraint violation
  'P2003', // Foreign key constraint violation
  'P2000', // Value too long
  'P2011', // Null constraint violation
  'P2012', // Missing required value
]);

/** Kode error Prisma record not found */
const NOT_FOUND_CODES = new Set([
  'P2025', // Record not found
  'P2001', // Record not found in where clause
]);

/**
 * Klasifikasi error dari Prisma atau Node.js menjadi kategori yang actionable.
 */
export function classifyDbError(err: unknown): DbErrorKind {
  if (!err || typeof err !== 'object') return 'UNKNOWN';

  const e = err as Record<string, unknown>;
  const code = typeof e.code === 'string' ? e.code : '';
  const message = typeof e.message === 'string' ? e.message.toLowerCase() : '';

  if (UNREACHABLE_CODES.has(code)) return 'UNREACHABLE';
  if (CONSTRAINT_CODES.has(code)) return 'CONSTRAINT';
  if (NOT_FOUND_CODES.has(code)) return 'NOT_FOUND';

  // Network-level errors
  if (
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    message.includes('connection refused') ||
    message.includes('connect econnrefused') ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT'
  ) {
    return 'UNREACHABLE';
  }

  return 'UNKNOWN';
}

/**
 * Lempar error domain yang bisa dibaca pengguna untuk constraint violations.
 * Gunakan ini sebagai pengganti fallback ke local store.
 */
export function throwConstraintError(err: unknown, context?: string): never {
  const e = err as Record<string, unknown>;
  const code = typeof e.code === 'string' ? e.code : '';

  if (code === 'P2002') {
    // Unique constraint — coba ekstrak field dari meta
    const meta = e.meta as Record<string, unknown> | undefined;
    const target = Array.isArray(meta?.target) ? (meta.target as string[]).join(', ') : '';
    throw new Error(
      target
        ? `Data dengan nilai tersebut sudah ada (${target}).`
        : `Data duplikat: nilai yang sama sudah tersimpan${context ? ` untuk ${context}` : ''}.`
    );
  }
  if (code === 'P2025') {
    throw new Error(`Data tidak ditemukan${context ? ` (${context})` : ''}.`);
  }
  if (code === 'P2003') {
    throw new Error(`Referensi tidak valid — data terkait tidak ditemukan.`);
  }

  throw new Error(`Operasi database gagal${context ? ` (${context})` : ''}: ${String(e.message ?? err)}`);
}
