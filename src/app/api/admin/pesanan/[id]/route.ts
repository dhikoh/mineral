import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getOrderById, updateOrderStatus } from '@/lib/data-store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error fetching admin order detail:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat detail pesanan.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { status, notes, trackingNumber } = body;

    const updated = await updateOrderStatus(id, status, notes, trackingNumber);
    return NextResponse.json({
      success: true,
      message: 'Status pesanan berhasil diperbarui.',
      order: updated,
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui status pesanan.' },
      { status: 500 }
    );
  }
}
