import { NextResponse } from 'next/server';
import { createOrder, OrderItemData } from '@/lib/data-store';
import { getClientIp, checkCheckoutRateLimit } from '@/lib/rate-limit';
import { buildWhatsAppMessage } from '@/lib/wa-notify';

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

    // P1-I: Validasi panjang nomor telepon agar pembeli tidak terkunci saat pelacakan
    const cleanPhoneDigits = String(customerPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhoneDigits.length < 8 || cleanPhoneDigits.length > 16) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp/telepon harus terdiri dari minimal 8 digit dan maksimal 16 digit angka.' },
        { status: 400 }
      );
    }

    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customerEmail).trim())) {
      return NextResponse.json(
        { error: 'Format alamat email tidak valid.' },
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

    const effectiveTotal = order.grandTotal > 0 ? order.grandTotal : order.total;

    // Sesi #22 (Audit): Hubungkan event checkout_success yang sebelumnya orphan di wa-notify.ts
    // wa_message disisipkan di response agar admin/sistem dapat meneruskan ke WA pembeli secara manual
    let wa_message: string | null = null;
    try {
      wa_message = buildWhatsAppMessage(
        {
          orderCode: order.orderCode,
          buyerName: order.buyerName,
          buyerPhone: order.buyerPhone,
          total: effectiveTotal,
          items: order.items?.map((i: OrderItemData) => ({
            name: String(i.product?.name || (i as any).productName || i.productId),
            qty: i.qty,
            unit: i.product?.unit || (i as any).productUnit || 'kg',
          })),
        },
        'checkout_success'
      );
    } catch {
      // Non-critical — jangan gagalkan response utama
    }

    return NextResponse.json({
      success: true,
      orderCode: order.orderCode,
      total: effectiveTotal,
      grandTotal: effectiveTotal,
      subtotal: order.subtotal ?? order.total,
      taxAmount: order.taxAmount ?? 0,
      shippingCost: order.shippingCost ?? 0,
      // wa_message: teks siap-copy untuk admin/CS teruskan ke WA pembeli setelah checkout
      wa_message,
      wa_phone: order.buyerPhone,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    const msg = error?.message || 'Gagal memproses pesanan.';
    // NEW-03 & P1-I: Kembalikan HTTP 400 untuk validasi bisnis
    const isBusinessError =
      msg.includes('Stok komoditas') ||
      msg.includes('tidak mencukupi') ||
      msg.includes('minimum order') ||
      msg.includes('tidak tersedia') ||
      msg.includes('tidak ditemukan') ||
      msg.includes('kelipatan') ||
      msg.includes('Validasi kuantitas');

    return NextResponse.json(
      { error: msg },
      { status: isBusinessError ? 400 : 500 }
    );
  }
}
