import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getOrderById, updateOrderStatus } from '@/lib/data-store';
import {
  VALID_ORDER_STATUSES,
  isValidOrderTransition,
} from '@/lib/order-security';

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
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    const body = await request.json();
    const { status, notes, trackingNumber } = body;

    // Validasi status jika dikirimkan dalam payload
    if (status !== undefined) {
      // 1. Larang mutasi langsung ke status PAID di luar alur verifikasi resmi
      if (status === 'PAID') {
        return NextResponse.json(
          {
            error:
              'Perubahan status ke PAID tidak diizinkan melalui endpoint ini. Gunakan endpoint verifikasi bukti transfer (/api/admin/pesanan/[id]/verifikasi) agar sinkronisasi LTV CRM dan verifikasi bank tereksekusi secara sah.',
          },
          { status: 400 }
        );
      }

      // 2. Validasi enum OrderStatus yang sah
      if (!VALID_ORDER_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Nilai status '${status}' tidak valid.` },
          { status: 400 }
        );
      }

      // 3. Validasi state machine alur kerja
      if (!isValidOrderTransition(order.status, status)) {
        return NextResponse.json(
          {
            error: `Transisi status pesanan dari '${order.status}' ke '${status}' tidak diizinkan.`,
          },
          { status: 400 }
        );
      }
    }

    const targetStatus = status !== undefined ? status : order.status;
    const updated = await updateOrderStatus(id, targetStatus, notes, trackingNumber);

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
