/**
 * Order Security, PII Masking, Phone Matching & State Machine Module
 * Memusatkan logika proteksi data pembeli, pencocokan nomor telepon,
 * dan mesin status alur pemesanan untuk menghindari drift & celah keamanan.
 */

export const VALID_ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PENDING_VERIFICATION',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
] as const;

export type OrderStatusType = (typeof VALID_ORDER_STATUSES)[number];

/**
 * Whitelist transisi status pesanan yang sah (State Machine).
 * Catatan: Transisi ke status 'PAID' tidak diizinkan melalui endpoint generik PATCH /api/admin/pesanan/[id],
 * melainkan WAJIB melalui alur resmi verifikasi bukti transfer POST /api/admin/pesanan/[id]/verifikasi
 * untuk menjamin efek samping stok dan LTV CRM tereksekusi secara konsisten.
 */
export const ALLOWED_ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: ['PENDING_VERIFICATION', 'CANCELLED'],
  PENDING_VERIFICATION: ['CANCELLED'], // Perubahan ke PAID / REJECTED melalui alur verifikasi bukti
  PAID: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], // Terminal
  REJECTED: ['PENDING_PAYMENT', 'PENDING_VERIFICATION', 'CANCELLED'],
  CANCELLED: [], // Terminal
};

/**
 * Validasi apakah transisi dari status A ke status B diizinkan.
 * Jika status tujuan sama dengan status awal (mis. hanya update nomor resi/catatan), selalu diizinkan.
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
 * Pencocokan nomor telepon terpadu.
 * Membandingkan digit numerik murni dan mencocokkan akhiran 8 digit
 * untuk mengakomodasi perbedaan format (contoh: 0812 vs 62812 vs +62812).
 */
export function isPhoneMatch(
  inputPhone: string | null | undefined,
  targetPhone: string | null | undefined
): boolean {
  if (!inputPhone || !targetPhone) return false;

  const cleanInput = inputPhone.replace(/\D/g, '');
  const cleanTarget = targetPhone.replace(/\D/g, '');

  if (!cleanInput || !cleanTarget) return false;

  return (
    cleanInput === cleanTarget ||
    cleanTarget.endsWith(cleanInput.slice(-8)) ||
    cleanInput.endsWith(cleanTarget.slice(-8))
  );
}

/**
 * Penyamaran PII (Personally Identifiable Information) Pembeli
 * Digunakan untuk endpoint publik detail pesanan & pelacakan jika nomor kontak belum terverifikasi
 */
export function maskOrderPII(order: any, isVerified: boolean = false) {
  if (isVerified) {
    return {
      ...order,
      isVerified: true,
    };
  }

  const rawName = order.buyerName || '';
  const maskedName =
    rawName.length > 2
      ? rawName[0] + '*'.repeat(Math.max(1, rawName.length - 2)) + rawName.slice(-1)
      : '*'.repeat(rawName.length || 4);

  const cleanPhone = (order.buyerPhone || '').replace(/\D/g, '');
  const maskedPhone =
    cleanPhone.length > 4
      ? cleanPhone.slice(0, 3) + '****' + cleanPhone.slice(-3)
      : '****';

  return {
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    total: order.total,
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt,
    items: order.items,
    proof: order.proof
      ? {
          status: order.proof.status,
          uploadedAt: order.proof.uploadedAt,
          rejectionReason: order.proof.rejectionReason,
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
