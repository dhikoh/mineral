/**
 * POST /api/pesanan/[orderCode]/bukti
 * P0-03: Fix IDOR — tambah rate limit, verifikasi buyerPhone, validasi fileUrl
 */
import { NextResponse } from 'next/server';
import { getOrderByCode, submitPaymentProof } from '@/lib/data-store';
import {
  getClientIp,
  checkProofSubmitRateLimit,
} from '@/lib/rate-limit';
import { isPhoneMatch } from '@/lib/order-security';
import { validateLocalUploadPath, validateUploadUrl } from '@/lib/upload-url';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderCode: string }> }
) {
  const { orderCode } = await params;
  const clientIp = getClientIp(request);

  // P0-03: Rate limit per IP + per orderCode (5 req / 15 menit)
  const rateLimitKey = `proof_submit:${clientIp}:${orderCode}`;
  const rateLimit = checkProofSubmitRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan. Coba lagi dalam ${rateLimit.remainingMinutes} menit.` },
      { status: 429 }
    );
  }

  try {
    const order = await getOrderByCode(orderCode);
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    const body = await request.json();
    const { fileUrl, senderBank, senderName, amount, note, buyerPhone } = body;

    // P0-03: Wajibkan buyerPhone untuk verifikasi kepemilikan
    if (!buyerPhone) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp pembeli wajib diisi untuk verifikasi kepemilikan pesanan.' },
        { status: 400 }
      );
    }

    // P0-03: Cocokkan nomor HP — tolak jika tidak sesuai
    if (!isPhoneMatch(buyerPhone, order.buyerPhone)) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp tidak sesuai dengan data pesanan.' },
        { status: 403 }
      );
    }

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'Gambar atau bukti transfer wajib diunggah.' },
        { status: 400 }
      );
    }

    // P0-03: Validasi fileUrl — hanya terima path upload lokal atau URL storage resmi
    if (fileUrl.startsWith('/')) {
      const localValidation = validateLocalUploadPath(fileUrl);
      if (!localValidation.valid) {
        return NextResponse.json(
          { error: localValidation.error || 'Path file tidak valid.' },
          { status: 400 }
        );
      }
    } else {
      const urlValidation = validateUploadUrl(fileUrl);
      if (!urlValidation.valid) {
        return NextResponse.json(
          { error: urlValidation.error || 'URL file tidak valid.' },
          { status: 400 }
        );
      }
    }

    const updated = await submitPaymentProof(order.id, {
      fileUrl,
      senderBank: senderBank ? String(senderBank).trim() : undefined,
      senderName: senderName ? String(senderName).trim() : undefined,
      amount: amount ? Number(amount) : undefined,
      note: note ? String(note).trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Bukti transfer berhasil dikirim. Menunggu verifikasi admin.',
      order: updated,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error submitting payment proof:', err);
    const isClientError =
      err.message?.includes('sudah lunas') ||
      err.message?.includes('telah dibatalkan') ||
      err.message?.includes('tidak dapat diubah');
    return NextResponse.json(
      { error: err.message || 'Gagal mengirim bukti pembayaran.' },
      { status: isClientError ? 400 : 500 }
    );
  }
}
