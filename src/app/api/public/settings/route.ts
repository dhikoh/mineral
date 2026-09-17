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

  // Keputusan Owner: rekening bank hanya ditampilkan jika orderCode valid
  if (!orderCode) {
    return NextResponse.json(
      { error: 'Parameter orderCode wajib disertakan untuk mendapatkan informasi pembayaran.' },
      { status: 400 }
    );
  }

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

  const settings = await getSiteSettings().catch(() => null);
  if (!settings) {
    return NextResponse.json({ error: 'Konfigurasi sistem tidak tersedia.' }, { status: 503 });
  }

  // Hanya kembalikan field yang dibutuhkan untuk checkout — bukan seluruh settings
  return NextResponse.json({
    siteName: settings.siteName,
    csWhatsapp: settings.csWhatsapp,
    bankAccounts: settings.bankAccounts,
    // grandTotal pesanan untuk konfirmasi nominal transfer
    orderTotal: order.grandTotal ?? order.total,
    orderCode: order.orderCode,
  });
}
