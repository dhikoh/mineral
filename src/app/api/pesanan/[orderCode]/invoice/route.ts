/**
 * src/app/api/pesanan/[orderCode]/invoice/route.ts
 * ADD-01: Endpoint unduh / cetak faktur proforma dan invoice resmi pesanan.
 * GET /api/pesanan/[orderCode]/invoice?phone=0812xxx
 */

import { NextResponse } from 'next/server';
import { getOrderByCode, getSiteSettings } from '@/lib/data-store';
import { getAdminSession } from '@/lib/auth';
import { getClientIp, checkOrderDetailRateLimit } from '@/lib/rate-limit';
import { isPhoneMatch } from '@/lib/order-security';
import { renderInvoiceToBuffer } from '@/lib/invoice-pdf';

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
    const [order, settings] = await Promise.all([
      getOrderByCode(orderCode),
      getSiteSettings(),
    ]);

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Otorisasi: Admin berhak langsung, pembeli publik wajib mencocokkan nomor WhatsApp
    const adminSession = await getAdminSession();
    if (!adminSession) {
      const url = new URL(request.url);
      const queryPhone =
        url.searchParams.get('phone') || request.headers.get('x-buyer-phone') || '';

      if (!isPhoneMatch(queryPhone, order.buyerPhone)) {
        return NextResponse.json(
          { error: 'Akses ditolak. Nomor WhatsApp pembeli tidak sesuai.' },
          { status: 403 }
        );
      }
    }

    const pdfBuffer = await renderInvoiceToBuffer(order as any, settings);
    const uint8 = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${order.orderCode}.pdf"`,
        'Content-Length': String(uint8.length),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[invoice-route] Error generating invoice PDF:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal membuat dokumen faktur.' },
      { status: 500 }
    );
  }
}
