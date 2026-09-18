/**
 * src/lib/order-security.ts
 * P1-05: REJECTED dihapus dari VALID_ORDER_STATUSES dan ALLOWED_ORDER_TRANSITIONS
 * P0-04: Tambah canVerifyPayment() dan canRejectPayment() sebagai helper UI+API
 */

// P1-05: REJECTED dihapus — state orphan yang tidak pernah dicapai
export const VALID_ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PENDING_VERIFICATION',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type OrderStatusType = (typeof VALID_ORDER_STATUSES)[number];

/**
 * State machine transisi status pesanan yang sah.
 * Catatan: Perubahan ke PAID HANYA melalui alur verifikasi bukti transfer
 * POST /api/admin/pesanan/[id]/verifikasi — tidak melalui PATCH generik.
 */
export const ALLOWED_ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT:      ['PENDING_VERIFICATION', 'CANCELLED'],
  PENDING_VERIFICATION: ['PENDING_PAYMENT', 'PAID', 'CANCELLED'], // Approve -> PAID, Tolak Bukti -> PENDING_PAYMENT, Batal -> CANCELLED
  PAID:                 ['PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'], // Model loco/ambil gudang mendukung langsung COMPLETED
  PROCESSING:           ['SHIPPED', 'COMPLETED', 'CANCELLED'],
  SHIPPED:              ['COMPLETED', 'CANCELLED'],
  COMPLETED:            [], // Terminal
  CANCELLED:            [], // Terminal
};

/**
 * Validasi apakah transisi dari status A ke B diizinkan.
 */
export function isValidOrderTransition(
  currentStatus: string,
  targetStatus: string
): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(targetStatus);
}

/**
 * P0-04: Apakah pesanan boleh di-approve pembayarannya?
 * Hanya dari PENDING_VERIFICATION.
 */
export function canVerifyPayment(status: string): boolean {
  return status === 'PENDING_VERIFICATION';
}

/**
 * P0-04: Apakah pesanan boleh ditolak bukti bayarnya?
 * Hanya dari PENDING_VERIFICATION.
 */
export function canRejectPayment(status: string): boolean {
  return status === 'PENDING_VERIFICATION';
}

/**
 * Pencocokan nomor telepon terpadu.
 * Membandingkan digit numerik murni dan mencocokkan akhiran 8 digit.
 * Input < 8 digit langsung ditolak (anti brute-force).
 */
export function isPhoneMatch(
  inputPhone: string | null | undefined,
  targetPhone: string | null | undefined
): boolean {
  if (!inputPhone || !targetPhone) return false;

  const cleanInput = inputPhone.replace(/\D/g, '');
  const cleanTarget = targetPhone.replace(/\D/g, '');

  if (!cleanInput || cleanInput.length < 8 || !cleanTarget) return false;

  return (
    cleanInput === cleanTarget ||
    cleanTarget.endsWith(cleanInput.slice(-8)) ||
    cleanInput.endsWith(cleanTarget.slice(-8))
  );
}

/**
 * Penyamaran PII pembeli untuk endpoint publik.
 */
export function maskOrderPII(order: Record<string, unknown>, isVerified: boolean = false) {
  if (isVerified) {
    return { ...order, isVerified: true };
  }

  const rawName = String(order.buyerName || '');
  const maskedName =
    rawName.length > 2
      ? rawName[0] + '*'.repeat(Math.max(1, rawName.length - 2)) + rawName.slice(-1)
      : '*'.repeat(rawName.length || 4);

  const cleanPhone = String(order.buyerPhone || '').replace(/\D/g, '');
  const maskedPhone =
    cleanPhone.length > 4
      ? cleanPhone.slice(0, 3) + '****' + cleanPhone.slice(-3)
      : '****';

  return {
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    total: (typeof order.total === 'number' ? order.total : 0),
    grandTotal: (typeof order.grandTotal === 'number' && order.grandTotal > 0)
      ? order.grandTotal
      : (typeof order.total === 'number' ? order.total : 0),
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt,
    items: order.items,
    proof: order.proof
      ? {
          status: (order.proof as Record<string, unknown>).status,
          uploadedAt: (order.proof as Record<string, unknown>).uploadedAt,
          rejectionReason: (order.proof as Record<string, unknown>).rejectionReason,
        }
      : null,
    buyerName: maskedName,
    buyerPhone: maskedPhone,
    buyerAddress: 'Verifikasi nomor WhatsApp diperlukan untuk melihat alamat lengkap pengiriman.',
    buyerEmail: order.buyerEmail ? '***@***.***' : null,
    notes: order.notes ? '[Disamarkan]' : null,
    isVerified: false,
  };
}
