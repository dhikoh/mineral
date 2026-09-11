import { NextResponse } from 'next/server';
import { getOrderByCode, submitPaymentProof } from '@/lib/data-store';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderCode: string }> }
) {
  try {
    const { orderCode } = await params;
    const order = await getOrderByCode(orderCode);

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { fileUrl, senderBank, senderName, amount, note } = body;

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'Gambar atau bukti transfer wajib diunggah.' },
        { status: 400 }
      );
    }

    const updated = await submitPaymentProof(order.id, {
      fileUrl,
      senderBank: senderBank ? senderBank.trim() : undefined,
      senderName: senderName ? senderName.trim() : undefined,
      amount: amount ? Number(amount) : undefined,
      note: note ? note.trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Bukti transfer berhasil dikirim. Menunggu verifikasi admin.',
      order: updated,
    });
  } catch (error: any) {
    console.error('Error submitting payment proof:', error);
    const isClientError =
      error.message?.includes('sudah lunas') ||
      error.message?.includes('telah dibatalkan') ||
      error.message?.includes('tidak dapat diubah');
    return NextResponse.json(
      { error: error.message || 'Gagal mengirim bukti pembayaran.' },
      { status: isClientError ? 400 : 500 }
    );
  }
}
