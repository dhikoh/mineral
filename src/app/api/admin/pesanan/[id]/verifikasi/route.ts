import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { verifyPaymentProof } from '@/lib/data-store';

export async function POST(
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
    const { isApproved, notes } = body;

    const updated = await verifyPaymentProof(
      id,
      Boolean(isApproved),
      notes,
      session.name || 'Super Admin'
    );

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
