import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/data-store';

// POST /api/validate-cart
// Validasi semua item keranjang terhadap kondisi DB terkini.
// Endpoint publik (tanpa auth) karena keranjang adalah fitur storefront.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: { id: string; name: string; qty: number; price: number; stock: number }[] =
      body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ valid: true, invalidItems: [] });
    }

    const invalidItems: {
      id: string;
      name: string;
      reason: 'DELETED' | 'INACTIVE' | 'STOCK_CHANGED' | 'PRICE_CHANGED';
      message: string;
      newPrice?: number;
      availableStock?: number;
    }[] = [];

    const results = await Promise.allSettled(
      items.map((item) => getProductById(item.id))
    );

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const result = results[i];

      if (result.status === 'rejected') {
        invalidItems.push({
          id: item.id,
          name: item.name,
          reason: 'DELETED',
          message: `Produk "${item.name}" tidak dapat diverifikasi. Silakan hapus dari keranjang.`,
        });
        continue;
      }

      const product = result.value;

      // 1. Produk dihapus dari DB
      if (!product) {
        invalidItems.push({
          id: item.id,
          name: item.name,
          reason: 'DELETED',
          message: `Produk "${item.name}" sudah tidak tersedia di katalog.`,
        });
        continue;
      }

      // 2. Produk dinonaktifkan admin (Gap #1 & #4)
      if ((product as any).isActive === false) {
        invalidItems.push({
          id: item.id,
          name: item.name,
          reason: 'INACTIVE',
          message: `Produk "${item.name}" saat ini tidak aktif dan tidak dapat dipesan.`,
        });
        continue;
      }

      const currentPrice = (product as any).price ?? 0;
      const currentStock = (product as any).stock ?? 0;

      // 3. Harga berubah (Gap #3) — non-fatal, server tetap pakai harga DB
      if (Math.abs(currentPrice - item.price) > 0.01) {
        invalidItems.push({
          id: item.id,
          name: item.name,
          reason: 'PRICE_CHANGED',
          message: `Harga "${item.name}" telah berubah menjadi ${currentPrice.toLocaleString('id-ID')}. Harga terbaru akan digunakan saat checkout.`,
          newPrice: currentPrice,
        });
        // Tidak stop — lanjut cek stok
      }

      // 4. Stok tidak cukup (Gap #2)
      if (currentStock < item.qty) {
        invalidItems.push({
          id: item.id,
          name: item.name,
          reason: 'STOCK_CHANGED',
          message: `Stok "${item.name}" berkurang. Tersisa ${currentStock} ${(product as any).unit || 'unit'}, qty Anda: ${item.qty}.`,
          availableStock: currentStock,
        });
      }
    }

    return NextResponse.json({
      valid: invalidItems.length === 0,
      invalidItems,
    });
  } catch (error: any) {
    console.error('Error validating cart:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memvalidasi keranjang.' },
      { status: 500 }
    );
  }
}
