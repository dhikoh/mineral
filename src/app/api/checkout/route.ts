import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/data-store';

export async function POST(request: Request) {
  try {
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

    // Format items for data-store
    const orderItems = items.map((it: any) => ({
      productId: it.productId || it.id,
      qty: Number(it.quantity || it.qty || 1),
    }));

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
