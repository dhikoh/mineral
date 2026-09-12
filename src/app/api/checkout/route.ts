import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/data-store';
import { getClientIp, checkCheckoutRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Terapkan Rate Limiting anti-spam pesanan fiktif
    const clientIp = getClientIp(request);
    const rateLimit = checkCheckoutRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Batas checkout terlampaui. Alamat IP Anda ditangguhkan sementara. Silakan coba kembali dalam ${rateLimit.remainingMinutes} menit.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { customerName, customerPhone, customerEmail, shippingAddress, notes, items } = body;

    if (!customerName || !customerPhone || !shippingAddress) {
      return NextResponse.json(
        { error: 'Nama, nomor WhatsApp/telepon, dan alamat pengiriman wajib diisi.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Keranjang belanja Anda masih kosong.' },
        { status: 400 }
      );
    }

    // Validasi dan format items untuk data-store
    const orderItems: { productId: string; qty: number }[] = [];
    for (const it of items) {
      const productId = it.productId || it.id;
      if (!productId || typeof productId !== 'string') {
        return NextResponse.json(
          { error: 'ID produk tidak valid.' },
          { status: 400 }
        );
      }

      const parsedQty = Number(it.quantity !== undefined ? it.quantity : it.qty);
      if (!parsedQty || !Number.isInteger(parsedQty) || parsedQty <= 0) {
        return NextResponse.json(
          { error: 'Jumlah produk (qty) harus berupa bilangan bulat positif minimal 1.' },
          { status: 400 }
        );
      }

      if (parsedQty > 1_000_000) {
        return NextResponse.json(
          { error: 'Kuantitas melebihi batas pesanan maksimal per item.' },
          { status: 400 }
        );
      }

      orderItems.push({
        productId: productId.trim(),
        qty: parsedQty,
      });
    }

    const order = await createOrder({
      buyerName: customerName.trim(),
      buyerPhone: customerPhone.trim(),
      buyerEmail: customerEmail ? customerEmail.trim() : undefined,
      buyerAddress: shippingAddress.trim(),
      notes: notes ? notes.trim() : undefined,
      items: orderItems,
    });

    return NextResponse.json({
      success: true,
      orderCode: order.orderCode,
      total: order.total,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses pesanan.' },
      { status: 500 }
    );
  }
}
