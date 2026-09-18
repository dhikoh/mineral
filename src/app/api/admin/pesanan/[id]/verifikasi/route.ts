/**
 * POST /api/admin/pesanan/[id]/verifikasi
 * P0-04: State machine gate — hanya approve/reject dari PENDING_VERIFICATION
 * P1-03: Rekonsiliasi nominal bukti vs total pesanan
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { verifyPaymentProof, getOrderById, getSiteSettings } from '@/lib/data-store';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';
import { buildWhatsAppMessage } from '@/lib/wa-notify';
import { canVerifyPayment, canRejectPayment, isValidOrderTransition } from '@/lib/order-security';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { isApproved, notes, forceApprove } = body;

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    // P0-04: State machine gate — tolak jika status tidak memungkinkan verifikasi
    if (isApproved && !canVerifyPayment(order.status)) {
      return NextResponse.json(
        {
          error: `Pembayaran tidak dapat diverifikasi. Status pesanan saat ini: "${order.status}". Hanya pesanan dengan status PENDING_VERIFICATION yang dapat disetujui.`,
        },
        { status: 409 }
      );
    }

    if (!isApproved && !canRejectPayment(order.status)) {
      return NextResponse.json(
        {
          error: `Bukti pembayaran tidak dapat ditolak. Status pesanan saat ini: "${order.status}".`,
        },
        { status: 409 }
      );
    }

    // P0-04: Pastikan bukti transfer ada sebelum approve
    if (isApproved && !order.proof) {
      return NextResponse.json(
        { error: 'Bukti transfer belum diunggah. Tidak dapat menyetujui pembayaran.' },
        { status: 400 }
      );
    }

    // P1-03: Rekonsiliasi nominal — bandingkan amount bukti vs total pesanan
    const settings = await getSiteSettings().catch(() => null);
    const tolerance = settings?.paymentToleranceAmount ?? 5000;
    const orderTotal = ((order.grandTotal ?? 0) > 0 ? order.grandTotal : order.total) ?? 0;

    if (isApproved && order.proof?.amount != null) {
      const proofAmount = order.proof.amount;
      const diff = Math.abs(proofAmount - orderTotal);

      if (diff > tolerance) {
        // Jika selisih melebihi toleransi, hanya SUPERADMIN dengan forceApprove yang bisa lanjut
        if (!forceApprove || session.role !== 'SUPERADMIN') {
          await recordAuditLog({
            actorId: session.id,
            actorName: session.name,
            actorRole: session.role,
            action: AUDIT_ACTIONS.VERIFY_PAYMENT_AMOUNT_MISMATCH,
            targetType: 'Order',
            targetId: id,
            metadata: {
              orderCode: order.orderCode,
              orderTotal,
              proofAmount,
              difference: diff,
              tolerance,
            },
          });
          return NextResponse.json(
            {
              error: `Selisih nominal pembayaran terlalu besar. Tagihan: Rp ${orderTotal.toLocaleString('id-ID')}, Transfer: Rp ${proofAmount.toLocaleString('id-ID')}, Selisih: Rp ${diff.toLocaleString('id-ID')} (toleransi: Rp ${tolerance.toLocaleString('id-ID')}).`,
              code: 'AMOUNT_MISMATCH',
              orderTotal,
              proofAmount,
              difference: diff,
            },
            { status: 409 }
          );
        }
      }
    }

    // P1-E: Validasi state machine resmi
    const targetStatus = isApproved ? 'PAID' : 'PENDING_PAYMENT';
    if (!isValidOrderTransition(order.status, targetStatus)) {
      return NextResponse.json(
        { error: `Transisi status pesanan dari '${order.status}' ke '${targetStatus}' tidak diizinkan.` },
        { status: 409 }
      );
    }

    // Eksekusi verifikasi
    const updated = await verifyPaymentProof(
      id,
      Boolean(isApproved),
      notes,
      session.name || 'Admin',
      session.id
    );

    await recordAuditLog({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      action: isApproved
        ? AUDIT_ACTIONS.VERIFY_PAYMENT_APPROVED
        : AUDIT_ACTIONS.VERIFY_PAYMENT_REJECTED,
      targetType: 'Order',
      targetId: id,
      metadata: {
        orderCode: order.orderCode,
        buyerName: order.buyerName,
        amount: order.proof?.amount || null,
        notes: notes || null,
        forceApprove: forceApprove || false,
      },
    });

    let wa_message: string | null = null;
    try {
      wa_message = buildWhatsAppMessage(
        {
          orderCode: order.orderCode,
          buyerName: order.buyerName,
          buyerPhone: order.buyerPhone,
          total: orderTotal,
          rejectionReason: isApproved ? undefined : (notes || 'Bukti pembayaran tidak valid'),
        },
        isApproved ? 'payment_verified' : 'payment_rejected'
      );
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      success: true,
      message: isApproved
        ? 'Pembayaran berhasil diverifikasi dan disetujui (Lunas).'
        : 'Bukti pembayaran ditolak. Pesanan dikembalikan ke status Menunggu Pembayaran.',
      order: updated,
      wa_message,
      wa_phone: order.buyerPhone,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error verifying payment proof:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal memverifikasi bukti pembayaran.' },
      { status: 500 }
    );
  }
}
