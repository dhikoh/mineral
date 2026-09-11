import { NextResponse } from 'next/server';
import { getOrderByCode } from '@/lib/data-store';

// Rate limiter sederhana per-IP untuk endpoint publik pesanan
const orderRateLimitMap = new Map<string, { count: number; firstTime: number }>();
const ORDER_WINDOW_MS = 60 * 1000; // 1 menit
const MAX_ORDER_REQUESTS = 30; // maks 30 request / menit

function checkOrderRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = orderRateLimitMap.get(ip);
  if (!rec || now - rec.firstTime > ORDER_WINDOW_MS) {
    orderRateLimitMap.set(ip, { count: 1, firstTime: now });
    return true;
  }
  if (rec.count >= MAX_ORDER_REQUESTS) {
    return false;
  }
  rec.count += 1;
  return true;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderCode: string }> }
) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    if (!checkOrderRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Silakan tunggu 1 menit.' },
        { status: 429 }
      );
    }

    const { orderCode } = await params;
    const order = await getOrderByCode(orderCode);

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan.' },
        { status: 404 }
      );
    }

    // P0: Cek verifikasi nomor telepon pembeli untuk cegah enumerasi PII
    const url = new URL(request.url);
    const queryPhone = url.searchParams.get('phone') || request.headers.get('x-buyer-phone') || '';

    let isPhoneMatch = false;
    if (queryPhone) {
      const cleanInputPhone = queryPhone.replace(/\D/g, '');
      const cleanBuyerPhone = (order.buyerPhone || '').replace(/\D/g, '');

      isPhoneMatch =
        cleanInputPhone === cleanBuyerPhone ||
        cleanBuyerPhone.endsWith(cleanInputPhone.slice(-8)) ||
        cleanInputPhone.endsWith(cleanBuyerPhone.slice(-8));
    }

    // Jika nomor HP cocok, kembalikan data penuh
    if (isPhoneMatch) {
      return NextResponse.json({
        ...order,
        isVerified: true,
      });
    }

    // Jika tanpa nomor HP atau nomor HP tidak cocok, maskir data sensitif (PII)
    const rawName = order.buyerName || '';
    const maskedName =
      rawName.length > 2
        ? rawName[0] + '*'.repeat(Math.max(1, rawName.length - 2)) + rawName.slice(-1)
        : '*'.repeat(rawName.length);

    const cleanPhone = (order.buyerPhone || '').replace(/\D/g, '');
    const maskedPhone =
      cleanPhone.length > 4
        ? cleanPhone.slice(0, 3) + '****' + cleanPhone.slice(-3)
        : '****';

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat pesanan.' },
      { status: 500 }
    );
  }
}
