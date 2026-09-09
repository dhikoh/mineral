import { NextResponse } from 'next/server';
import { getOrderByCode } from '@/lib/data-store';

export async function GET(
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

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat pesanan.' },
      { status: 500 }
    );
  }
}
