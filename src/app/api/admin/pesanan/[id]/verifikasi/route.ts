import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { verifyPaymentProof, getOrderById } from '@/lib/data-store';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';

/**
 * POST /api/admin/pesanan/[id]/verifikasi
 * Sesi #17 (Temuan S): Simpan verifiedById (ID staf) — source of truth akuntabilitas.
 * Sesi #17 (Temuan K): Rekam audit log setiap verifikasi pembayaran.
 */
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
    const { isApproved, notes } = body;

    // Dapatkan order untuk metadata audit log
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    // Sesi #17 (Temuan S): Tambah verifiedById sebagai parameter ke-5
    const updated = await verifyPaymentProof(
      id,
      Boolean(isApproved),
      notes,
      session.name || 'Super Admin',
      session.id // verifiedById — ID staf sebagai foreign key
    );

    // Sesi #17 (Temuan K): Audit log verifikasi pembayaran
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
      },
    });

    return NextResponse.json({
      success: true,
      message: isApproved
        ? 'Pembayaran berhasil diverifikasi dan disetujui (Lunas).'
        : 'Bukti pembayaran ditolak. Pesanan dikembalikan ke status Menunggu Pembayaran.',
      order: updated,
    });
  } catch (error: any) {
    console.error('Error verifying payment proof:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memverifikasi bukti pembayaran.' },
      { status: 500 }
    );
  }
}
