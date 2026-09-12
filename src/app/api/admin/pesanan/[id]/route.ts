import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getOrderById, updateOrderStatus } from '@/lib/data-store';
import { VALID_ORDER_STATUSES, isValidOrderTransition } from '@/lib/order-security';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';
import { buildWhatsAppMessage } from '@/lib/wa-notify';

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

    // Sesi #17 (Temuan K): Audit log perubahan status
    if (status !== undefined && status !== order.status) {
      await recordAuditLog({
        actorId: session.id,
        actorName: session.name,
        actorRole: session.role,
        action: AUDIT_ACTIONS.UPDATE_ORDER_STATUS,
        targetType: 'Order',
        targetId: id,
        metadata: {
          orderCode: order.orderCode,
          from: order.status,
          to: status,
          notes: notes || null,
          trackingNumber: trackingNumber || null,
        },
      });
    }

    // Sesi #22 (Audit): Hubungkan event order_shipped / order_completed yang sebelumnya orphan di wa-notify.ts
    let wa_message: string | null = null;
    try {
      if (status === 'SHIPPED') {
        wa_message = buildWhatsAppMessage(
          {
            orderCode: order.orderCode,
            buyerName: order.buyerName,
            buyerPhone: order.buyerPhone,
            total: order.total,
            trackingNumber: trackingNumber || updated.trackingNumber || undefined,
          },
          'order_shipped'
        );
      } else if (status === 'COMPLETED') {
        wa_message = buildWhatsAppMessage(
          {
            orderCode: order.orderCode,
            buyerName: order.buyerName,
            buyerPhone: order.buyerPhone,
            total: order.total,
          },
          'order_completed'
        );
      }
    } catch {
      // Non-critical — jangan gagalkan response utama
    }

    return NextResponse.json({
      success: true,
      message: 'Status pesanan berhasil diperbarui.',
      order: updated,
      // wa_message: teks siap-copy untuk admin teruskan ke WA pembeli (hanya saat SHIPPED/COMPLETED)
      ...(wa_message ? { wa_message, wa_phone: order.buyerPhone } : {}),
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui status pesanan.' },
      { status: 500 }
    );
  }
}
