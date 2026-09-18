/**
 * src/lib/order-total.ts
 * Helper terpusat untuk kalkulasi finansial pesanan B2B.
 * Seluruh pembacaan dan penulisan total/grandTotal wajib melalui modul ini.
 */

export interface OrderItemPriceQty {
  price: number;
  qty: number;
}

export interface ComputeOrderTotalsInput {
  items: OrderItemPriceQty[];
  taxEnabled?: boolean;
  /** Basis poin: 1100 = 11% */
  taxRateBasisPoints?: number;
  /** Alias untuk taxRateBasisPoints */
  taxRateBps?: number;
  manualShippingCost?: number;
  /** Alias untuk manualShippingCost */
  shippingCost?: number;
  discountAmount?: number;
}

export interface OrderTotalsResult {
  /** Total harga produk murni (sum of price * qty) */
  subtotal: number;
  /** Nilai tarif pajak yang diterapkan (basis poin, misal 1100) */
  taxRate: number;
  /** Nominal pajak yang dihitung dari subtotal */
  taxAmount: number;
  /** Biaya ongkos kirim (hasil negosiasi manual atau kebijakan) */
  shippingCost: number;
  /** Potongan harga / diskon */
  discountAmount: number;
  /** Total akhir tagihan yang wajib dibayarkan pembeli */
  grandTotal: number;
  /** Alias identik dengan grandTotal untuk backward-compatibility */
  total: number;
}

/**
 * Menghitung rincian finansial pesanan secara deterministik dan presisi.
 */
export function computeOrderTotals(input: ComputeOrderTotalsInput): OrderTotalsResult {
  const subtotal = (input.items || []).reduce((acc, item) => {
    const p = Math.max(0, Number(item.price) || 0);
    const q = Math.max(0, Number(item.qty) || 0);
    return acc + p * q;
  }, 0);

  const isTaxActive = Boolean(input.taxEnabled);
  const rawTaxRate = input.taxRateBasisPoints !== undefined ? input.taxRateBasisPoints : input.taxRateBps;
  const taxRate = isTaxActive ? Math.max(0, Number(rawTaxRate) || 0) : 0;
  // taxRate dalam basis poin (1100 = 11% = 1100 / 10000)
  const taxAmount = isTaxActive && taxRate > 0 ? Math.round((subtotal * taxRate) / 10000) : 0;

  const rawShipping = input.manualShippingCost !== undefined ? input.manualShippingCost : input.shippingCost;
  const shippingCost = Math.max(0, Math.round(Number(rawShipping) || 0));
  const discountAmount = Math.max(0, Math.round(Number(input.discountAmount) || 0));

  const grandTotal = Math.max(0, subtotal + taxAmount + shippingCost - discountAmount);

  return {
    subtotal,
    taxRate,
    taxAmount,
    shippingCost,
    discountAmount,
    grandTotal,
    total: grandTotal,
  };
}

/**
 * Format angka ke format Rupiah standar Indonesia (misal: Rp 15.000.000)
 */
export function formatCurrencyIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0));
}

/**
 * Mengecek apakah nominal pembayaran berada dalam ambang toleransi yang diizinkan
 */
export function isAmountWithinTolerance(
  paidAmount: number,
  expectedGrandTotal: number,
  toleranceAmount: number = 5000
): { isMatch: boolean; diff: number } {
  const diff = Math.abs(paidAmount - expectedGrandTotal);
  return {
    isMatch: diff <= Math.max(0, toleranceAmount),
    diff,
  };
}
