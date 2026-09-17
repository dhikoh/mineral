/**
 * src/lib/audit-log.ts
 * P2-12: Tambah konstanta audit untuk semua operasi PII berisiko
 * P2-02: LOGOUT + CREATE_PRODUCT + DELETE_PRODUCT sudah ada, pastikan dipakai
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

// Konstanta aksi audit — gunakan konstanta ini, bukan string literal
export const AUDIT_ACTIONS = {
  // Auth
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',                                    // P2-02 + P2-12

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
  VERIFY_PAYMENT_AMOUNT_MISMATCH: 'VERIFY_PAYMENT_AMOUNT_MISMATCH', // P1-03

  // Produk & Katalog
  CREATE_PRODUCT: 'CREATE_PRODUCT',                   // P2-02
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  UPDATE_PRODUCT_PRICE: 'UPDATE_PRODUCT_PRICE',
  UPDATE_PRODUCT_STOCK: 'UPDATE_PRODUCT_STOCK',
  DELETE_PRODUCT: 'DELETE_PRODUCT',                   // P2-02

  // Stok
  RESTOCK_FAILED: 'RESTOCK_FAILED',                   // P1-08

  // Pelanggan / CRM — P2-12
  CREATE_CUSTOMER: 'CREATE_CUSTOMER',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  DELETE_CUSTOMER: 'DELETE_CUSTOMER',
  DELETE_INTERACTION: 'DELETE_INTERACTION',

  // Ekspor Data — P2-12 (operasi PII berisiko tinggi)
  EXPORT_CUSTOMERS: 'EXPORT_CUSTOMERS',
  EXPORT_ORDERS: 'EXPORT_ORDERS',
  EXPORT_CATALOG_PDF: 'EXPORT_CATALOG_PDF',

  // Konten & Pengaturan
  UPDATE_SITE_SETTINGS: 'UPDATE_SITE_SETTINGS',
  UPDATE_BANK_ACCOUNTS: 'UPDATE_BANK_ACCOUNTS',
  CREATE_ARTICLE: 'CREATE_ARTICLE',
  UPDATE_ARTICLE: 'UPDATE_ARTICLE',
  DELETE_ARTICLE: 'DELETE_ARTICLE',

  // SellOffer
  UPDATE_SELL_OFFER_STATUS: 'UPDATE_SELL_OFFER_STATUS',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/**
 * Hapus field sensitif sebelum disimpan ke metadata.
 */
function sanitizeMetadata(
  meta: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!meta) return null;
  const SENSITIVE_KEYS = ['password', 'token', 'secret', 'accessKey', 'secretKey', 'authorization'];
  const cleaned = { ...meta };
  for (const key of SENSITIVE_KEYS) {
    if (key in cleaned) delete cleaned[key];
  }
  return cleaned;
}

/**
 * Rekam satu entri audit log.
 * Gagal secara graceful (console.warn, tidak throw) agar tidak mengganggu alur bisnis utama.
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
    console.warn(JSON.stringify({
      level: 'WARN',
      event: 'AUDIT_LOG_WRITE_FAILED',
      action: params.action,
      actorId: params.actorId,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    }));
  }
}
