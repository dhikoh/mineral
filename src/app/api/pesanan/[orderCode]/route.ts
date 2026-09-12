import { NextResponse } from 'next/server';
import { getOrderByCode } from '@/lib/data-store';
import { getClientIp, checkOrderDetailRateLimit } from '@/lib/rate-limit';
import { isPhoneMatch, maskOrderPII } from '@/lib/order-security';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderCode: string }> }
) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkOrderDetailRateLimit(clientIp);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak permintaan. Silakan tunggu ${rateLimit.remainingMinutes} menit.`,
        },
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

    const matched = isPhoneMatch(queryPhone, order.buyerPhone);

    // Kembalikan data dengan masking bertingkat terpadu
    return NextResponse.json(maskOrderPII(order, matched));
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat pesanan.' },
      { status: 500 }
    );
  }
}
