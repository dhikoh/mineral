/**
 * Audit Log Helper — Sesi #17 (Temuan K)
 * Helper terpusat untuk mencatat aksi admin secara persisten ke tabel AuditLog.
 *
 * Fitur:
 * - Fallback graceful: jika DB tidak tersedia, tulis ke console.warn (tidak throw)
 * - Tidak pernah mencatat field 'password' ke metadata
 * - Snapshot actorName & actorRole agar riwayat tidak berubah meski data staf diperbarui
 */

import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export interface AuditLogParams {
  actorId?: string | null;
  actorName: string;
  actorRole: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}

// Konstanta aksi audit — gunakan ini agar action string konsisten
export const AUDIT_ACTIONS = {
  // Auth
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',

  // User management
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  DEACTIVATE_USER: 'DEACTIVATE_USER',
  ACTIVATE_USER: 'ACTIVATE_USER',

  // Pesanan
  UPDATE_ORDER_STATUS: 'UPDATE_ORDER_STATUS',
  VERIFY_PAYMENT_APPROVED: 'VERIFY_PAYMENT_APPROVED',
  VERIFY_PAYMENT_REJECTED: 'VERIFY_PAYMENT_REJECTED',

  // Produk & Katalog
  CREATE_PRODUCT: 'CREATE_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',

  // Pengaturan Situs
  UPDATE_SITE_SETTINGS: 'UPDATE_SITE_SETTINGS',
  UPDATE_BANK_ACCOUNTS: 'UPDATE_BANK_ACCOUNTS',
} as const;

/**
 * Hapus field sensitif sebelum disimpan ke metadata.
 */
function sanitizeMetadata(
  meta: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!meta) return null;
  const SENSITIVE_KEYS = ['password', 'token', 'secret', 'accessKey', 'secretKey'];
  const cleaned = { ...meta };
  for (const key of SENSITIVE_KEYS) {
    if (key in cleaned) delete cleaned[key];
  }
  return cleaned;
}

/**
 * Rekam satu entri audit log.
 * Gagal secara graceful (tidak throw) agar tidak mengganggu alur bisnis utama.
 */
export async function recordAuditLog(params: AuditLogParams): Promise<void> {
  const safeMetadata = sanitizeMetadata(params.metadata ?? null);

  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        actorName: params.actorName,
        actorRole: params.actorRole,
        action: params.action,
        targetType: params.targetType ?? null,
        targetId: params.targetId ?? null,
        metadata: (safeMetadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    // Fallback: tulis ke console agar tidak ada blackhole — tidak throw
    console.warn(
      JSON.stringify({
        level: 'WARN',
        event: 'AUDIT_LOG_WRITE_FAILED',
        action: params.action,
        actorId: params.actorId,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      })
    );
  }
}
