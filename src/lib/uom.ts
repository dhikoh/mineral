/**
 * src/lib/uom.ts
 * P0-02: Modul terpusat konversi satuan berat (KG ↔ TON)
 * Satu sumber kebenaran — pakai di ProductDetailClient, keranjang, checkout, PDF katalog
 */

export type WeightUnit = 'kg' | 'ton';

const WEIGHT_BASE_ALIASES: Record<string, WeightUnit> = {
  kg: 'kg',
  kilogram: 'kg',
  ton: 'ton',
  tonne: 'ton',
};

/** Apakah unit produk adalah satuan berat (kg atau ton)? */
export function isWeightBase(unit: string): boolean {
  return unit.toLowerCase() in WEIGHT_BASE_ALIASES;
}

/** Normalisasi string unit ke WeightUnit canonical, atau null jika bukan berat */
export function normalizeBaseUnit(unit: string): WeightUnit | null {
  return WEIGHT_BASE_ALIASES[unit.toLowerCase()] ?? null;
}

/**
 * Konversi qty dari satuan tampilan ke satuan dasar produk.
 * Contoh: qty=2, displayUnit='ton', baseUnit='kg' → 2000
 *         qty=2, displayUnit='ton', baseUnit='ton' → 2
 *         qty=500, displayUnit='kg', baseUnit='ton' → 0.5
 */
export function toBaseQty(
  qty: number,
  displayUnit: WeightUnit,
  baseUnit: WeightUnit
): number {
  if (displayUnit === baseUnit) return qty;
  if (displayUnit === 'ton' && baseUnit === 'kg') return qty * 1000;
  if (displayUnit === 'kg' && baseUnit === 'ton') return qty / 1000;
  return qty;
}

/**
 * Konversi qty dari satuan dasar produk ke satuan tampilan.
 */
export function fromBaseQty(
  baseQty: number,
  displayUnit: WeightUnit,
  baseUnit: WeightUnit
): number {
  if (displayUnit === baseUnit) return baseQty;
  if (displayUnit === 'ton' && baseUnit === 'kg') return baseQty / 1000;
  if (displayUnit === 'kg' && baseUnit === 'ton') return baseQty * 1000;
  return baseQty;
}

/**
 * Harga per 1 unit satuan tampilan, berdasarkan harga per 1 unit satuan dasar.
 * Contoh: basePrice=5000 (per kg), displayUnit='ton' → 5_000_000 (per ton)
 *         basePrice=2_000_000 (per ton), displayUnit='kg' → 2000 (per kg)
 */
export function priceForDisplayUnit(
  basePrice: number,
  displayUnit: WeightUnit,
  baseUnit: WeightUnit
): number {
  if (displayUnit === baseUnit) return basePrice;
  if (displayUnit === 'ton' && baseUnit === 'kg') return basePrice * 1000;
  if (displayUnit === 'kg' && baseUnit === 'ton') return Math.round(basePrice / 1000);
  return basePrice;
}

/**
 * Stok maksimum dalam satuan tampilan.
 * Jika hasil < 1 (pecahan), kembalikan 0 → tab satuan tersebut harus di-disable.
 */
export function maxQtyInDisplayUnit(
  baseStock: number,
  displayUnit: WeightUnit,
  baseUnit: WeightUnit
): number {
  if (displayUnit === baseUnit) return baseStock;
  if (displayUnit === 'ton' && baseUnit === 'kg') return Math.floor(baseStock / 1000);
  if (displayUnit === 'kg' && baseUnit === 'ton') return baseStock * 1000;
  return baseStock;
}

/**
 * Validasi bahwa qty memenuhi minOrderQty dan increment step (dalam satuan dasar).
 * Mengembalikan pesan error atau null jika valid.
 */
export function validateOrderQty(
  baseQty: number,
  minOrderQty: number,
  incrementQty: number
): string | null {
  if (baseQty < minOrderQty) {
    return `Minimum order ${minOrderQty} ${minOrderQty === 1 ? 'unit' : 'unit'}`;
  }
  if (incrementQty > 1 && (baseQty - minOrderQty) % incrementQty !== 0) {
    return `Jumlah harus kelipatan ${incrementQty}`;
  }
  return null;
}
