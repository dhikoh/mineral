import { NextResponse } from 'next/server';
import { getOrderByCode } from '@/lib/data-store';
import { getClientIp, checkTrackingRateLimit } from '@/lib/rate-limit';
import { isPhoneMatch, maskOrderPII } from '@/lib/order-security';

export async function POST(request: Request) {
  try {
    // 1. Rate limiting perlindungan brute-force enumerasi nomor & kode pesanan
    const clientIp = getClientIp(request);
    const rateLimit = checkTrackingRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak permintaan pelacakan. Alamat IP Anda ditangguhkan sementara. Silakan coba dalam ${rateLimit.remainingMinutes} menit.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { orderCode, phone } = body;

    if (!orderCode || !phone) {
      return NextResponse.json(
        { error: 'Kode pesanan dan nomor WhatsApp wajib diisi.' },
        { status: 400 }
      );
    }

    const order = await getOrderByCode(String(orderCode).trim());

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan. Periksa kembali kode pesanan Anda.' },
        { status: 404 }
      );
    }

    // 2. Pencocokan nomor kontak dengan helper terpusat
    const matched = isPhoneMatch(phone, order.buyerPhone);

    if (!matched) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp tidak cocok dengan nomor yang terdaftar pada pesanan ini.' },
        { status: 403 }
      );
    }

    // 3. Kembalikan data pesanan terverifikasi dengan payload standar
    return NextResponse.json({
      success: true,
      order: maskOrderPII(order, true),
    });
  } catch (error: any) {
    console.error('Error tracking order:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal melacak pesanan.' },
      { status: 500 }
    );
  }
}
