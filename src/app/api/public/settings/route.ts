/**
 * GET /api/public/settings?orderCode=XXX
 * P2-05: Rate limit PUBLIC_SETTINGS
 * Keputusan Owner: nomor rekening bank WAJIB terikat orderCode yang valid
 * Mencegah scraping rekening bank tanpa konteks transaksi
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSiteSettings, getOrderByCode } from '@/lib/data-store';
import { getClientIp, checkPublicSettingsRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimit = checkPublicSettingsRateLimit(`public_settings:${clientIp}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi sebentar.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const orderCode = searchParams.get('orderCode');

  const settings = await getSiteSettings().catch(() => null);
  if (!settings) {
    return NextResponse.json({ error: 'Konfigurasi sistem tidak tersedia.' }, { status: 503 });
  }

  // P0-F: Kebutuhan Pra-Order (Halaman Checkout)
  // Menampilkan daftar metode pembayaran yang tersedia (nama bank & QRIS) tanpa membocorkan nomor rekening penuh
  if (!orderCode) {
    const availableMethods = (settings.bankAccounts || [])
      .filter((b: any) => b.isActive !== false)
      .map((b: any) => ({
        bank: b.bank,
        type: b.type || 'BANK',
        isActive: b.isActive !== false,
      }));

    return NextResponse.json({
      siteName: settings.siteName,
      csWhatsapp: settings.csWhatsapp,
      bankAccounts: availableMethods,
      paymentMethods: availableMethods,
    });
  }

  // Kebutuhan Pasca-Order: verifikasi orderCode dan tampilkan detail rekening lengkap untuk transfer
  const order = await getOrderByCode(orderCode).catch(() => null);
  if (!order) {
    return NextResponse.json(
      { error: 'Pesanan tidak ditemukan.' },
      { status: 404 }
    );
  }

  // Hanya tampilkan untuk pesanan yang menunggu pembayaran
  if (order.status !== 'PENDING_PAYMENT' && order.status !== 'PENDING_VERIFICATION') {
    return NextResponse.json(
      { error: 'Informasi pembayaran hanya tersedia untuk pesanan yang menunggu pembayaran.' },
      { status: 403 }
    );
  }

  const effectiveTotal = ((order.grandTotal ?? 0) > 0 ? order.grandTotal : order.total) ?? 0;

  // Kembalikan rincian rekening penuh terikat orderCode
  return NextResponse.json({
    siteName: settings.siteName,
    csWhatsapp: settings.csWhatsapp,
    bankAccounts: settings.bankAccounts,
    paymentMethods: settings.bankAccounts,
    orderTotal: effectiveTotal,
    grandTotal: effectiveTotal,
    orderCode: order.orderCode,
  });
}
