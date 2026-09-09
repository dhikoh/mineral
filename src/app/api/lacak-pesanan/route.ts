import { NextResponse } from 'next/server';
import { getOrderByCode } from '@/lib/data-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderCode, phone } = body;

    if (!orderCode || !phone) {
      return NextResponse.json(
        { error: 'Kode pesanan dan nomor WhatsApp wajib diisi.' },
        { status: 400 }
      );
    }

    const order = await getOrderByCode(orderCode.trim());

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan. Periksa kembali kode pesanan Anda.' },
        { status: 404 }
      );
    }

    // Match phone numbers by comparing only numeric digits
    const cleanInputPhone = phone.replace(/\D/g, '');
    const cleanBuyerPhone = order.buyerPhone.replace(/\D/g, '');

    // Allow match if endsWith matches last 8 digits (handles 08 vs 628 prefixes)
    const isPhoneMatch =
      cleanInputPhone === cleanBuyerPhone ||
      cleanBuyerPhone.endsWith(cleanInputPhone.slice(-8)) ||
      cleanInputPhone.endsWith(cleanBuyerPhone.slice(-8));

    if (!isPhoneMatch) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp tidak cocok dengan nomor yang terdaftar pada pesanan ini.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderCode: order.orderCode,
        buyerName: order.buyerName,
        buyerPhone: order.buyerPhone,
        buyerAddress: order.buyerAddress,
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
      },
    });
  } catch (error: any) {
    console.error('Error tracking order:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal melacak pesanan.' },
      { status: 500 }
    );
  }
}
